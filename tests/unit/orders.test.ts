import { describe, expect, it } from 'vitest'
import { applyPaymentEvent, createLead, createOrder, markPaidManually, retryPayment, setOrderStatus } from '@/core/orders'
import { ValidationError } from '@/core/types'
import { getOfferBySku } from '@/data/catalog'
import { firstSku, memoryStore, orderInput } from './helpers'

describe('createOrder', () => {
  it('считает цены на сервере по каталогу и игнорирует клиентские значения', async () => {
    const store = memoryStore()
    const input = { ...orderInput(), items: [{ sku: firstSku, qty: 2, price: 1 } as never] }
    const o = await createOrder(store, input)
    const price = getOfferBySku(firstSku)!.offer.price
    expect(o.items[0].price).toBe(price)
    expect(o.subtotal).toBe(price * 2)
    expect(o.total).toBe(o.subtotal + o.delivery.price)
  })

  it('идемпотентен: тот же ключ возвращает тот же заказ', async () => {
    const store = memoryStore()
    const input = orderInput()
    const a = await createOrder(store, input)
    const b = await createOrder(store, input)
    expect(b.id).toBe(a.id)
    expect(store.orders).toHaveLength(1)
  })

  it('объединяет одинаковые артикулы и ограничивает количество', async () => {
    const o = await createOrder(memoryStore(), orderInput({ items: [{ sku: firstSku, qty: 60 }, { sku: firstSku, qty: 60 }] }))
    expect(o.items).toHaveLength(1)
    expect(o.items[0].qty).toBe(99)
  })

  it.each([
    ['пустая корзина', { items: [] }, 'items'],
    ['неизвестный артикул', { items: [{ sku: 'NOPE', qty: 1 }] }, 'items'],
    ['товар без цены (по запросу)', { items: [{ sku: '1707', qty: 1 }] }, 'items'],
    ['нулевое количество', { items: [{ sku: firstSku, qty: 0 }] }, 'items'],
    ['дробное/отрицательное', { items: [{ sku: firstSku, qty: -3 }] }, 'items'],
    ['плохой телефон', { customer: { name: 'А', phone: '123' } }, 'phone'],
    ['пустое имя', { customer: { name: ' ', phone: '+79160000000' } }, 'name'],
    ['плохой email', { customer: { name: 'А', phone: '+79160000000', email: 'x@' } }, 'email'],
    ['нет города', { delivery: { provider: 'cdek', city: '', address: 'а' } }, 'city'],
    ['неизвестный способ оплаты', { paymentMethod: 'bitcoin' as never }, 'paymentMethod'],
    ['неизвестная служба доставки', { delivery: { provider: 'pigeon', city: 'М', address: 'а' } }, 'provider'],
  ])('отклоняет: %s', async (_n, over, field) => {
    const err = await createOrder(memoryStore(), orderInput(over as never)).catch((e) => e)
    expect(err).toBeInstanceOf(ValidationError)
    expect(err.fields[field]).toBeTruthy()
  })

  it('нормализует телефон и обрезает комментарий', async () => {
    const o = await createOrder(memoryStore(), orderInput({ customer: { name: 'А', phone: '8 (916) 000-00-00', comment: 'x'.repeat(900) } }))
    expect(o.customer.phone).toBe('+79160000000')
    expect(o.customer.comment).toHaveLength(500)
  })

  it('картой → ожидает оплаты; наличными → не оплачен', async () => {
    const card = await createOrder(memoryStore(), orderInput({ paymentMethod: 'card' }))
    const cash = await createOrder(memoryStore(), orderInput({ paymentMethod: 'cash' }))
    expect(card.payment.status).toBe('pending')
    expect(cash.payment.status).toBe('unpaid')
  })

  it('нумерует заказы последовательно', async () => {
    const store = memoryStore()
    const a = await createOrder(store, orderInput())
    const b = await createOrder(store, orderInput())
    expect(a.number).toBe('GR-01001')
    expect(b.number).toBe('GR-01002')
  })
})

describe('платежи и статусы', () => {
  it('оплаченный заказ нельзя перевести в failed повторным событием', async () => {
    const store = memoryStore()
    const o = await createOrder(store, orderInput())
    await applyPaymentEvent(store, o.id, 'paid')
    const after = await applyPaymentEvent(store, o.id, 'failed')
    expect(after.payment.status).toBe('paid')
  })

  it('повторная попытка возможна только после failed/cancelled', async () => {
    const store = memoryStore()
    const o = await createOrder(store, orderInput())
    expect((await retryPayment(store, o.id)).payment.status).toBe('pending')
    await applyPaymentEvent(store, o.id, 'cancelled')
    expect((await retryPayment(store, o.id)).payment.status).toBe('pending')
  })

  it('ручная оплата требует причину и пишет аудит', async () => {
    const store = memoryStore()
    const o = await createOrder(store, orderInput({ paymentMethod: 'invoice' }))
    await expect(markPaidManually(store, o.id, 'admin', ' ')).rejects.toBeInstanceOf(ValidationError)
    const paid = await markPaidManually(store, o.id, 'admin', 'Оплата по счёту № 5')
    expect(paid.payment.status).toBe('paid')
    expect(paid.history.at(-1)).toMatchObject({ by: 'admin', note: 'Оплата по счёту № 5' })
  })

  it('смена статуса заказа попадает в историю', async () => {
    const store = memoryStore()
    const o = await createOrder(store, orderInput())
    const upd = await setOrderStatus(store, o.id, 'confirmed', 'admin')
    expect(upd.status).toBe('confirmed')
    expect(upd.history).toHaveLength(2)
  })
})

describe('лиды', () => {
  it('сохраняет лид и нормализует телефон', async () => {
    const store = memoryStore()
    const l = await createLead(store, { name: 'Анна', phone: '9160000000', source: 'contacts' })
    expect(l?.phone).toBe('+79160000000')
    expect(store.leads).toHaveLength(1)
  })
  it('спам-ловушка: заполненное скрытое поле молча отбрасывается', async () => {
    const store = memoryStore()
    expect(await createLead(store, { name: 'Бот', phone: '9160000000', source: 'x', website: 'http://spam' })).toBeNull()
    expect(store.leads).toHaveLength(0)
  })
  it('валидирует имя и телефон', async () => {
    await expect(createLead(memoryStore(), { name: '', phone: '1', source: 'x' })).rejects.toBeInstanceOf(ValidationError)
  })
})
