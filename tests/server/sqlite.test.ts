import { describe, expect, it } from 'vitest'
import { applyPaymentEvent, createLead, createOrder } from '@/core/orders'
import { sqliteStore } from '../../server/sqliteStore'
import { orderInput } from '../unit/helpers'

describe('SQLite-хранилище', () => {
  it('сохраняет заказы и лиды, идемпотентность и нумерация работают', async () => {
    const s = sqliteStore(':memory:')
    const input = orderInput()
    const a = await createOrder(s, input)
    expect((await createOrder(s, input)).id).toBe(a.id)
    const b = await createOrder(s, orderInput())
    expect([a.number, b.number]).toEqual(['GR-01001', 'GR-01002'])
    expect(await s.listOrders()).toHaveLength(2)
    await applyPaymentEvent(s, a.id, 'paid')
    expect((await s.listOrders()).find((o) => o.id === a.id)?.payment.status).toBe('paid')
    await createLead(s, { name: 'А', phone: '9160000000', source: 'x' })
    expect(await s.listLeads()).toHaveLength(1)
  })
  it('уникальный индекс не даёт записать дубль ключа', async () => {
    const s = sqliteStore(':memory:')
    const o = await createOrder(s, orderInput())
    await expect(s.saveOrder({ ...o, id: 'other', number: 'GR-99999' })).rejects.toThrow()
  })
})
