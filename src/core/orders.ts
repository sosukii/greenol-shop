import { getOfferBySku } from '@/data/catalog'
import { paymentMethods } from '@/config/site'
import { estimateDelivery } from './delivery'
import { ValidationError, type CreateLeadInput, type CreateOrderInput, type Lead, type LeadStatus, type Order, type OrderStatus, type PaymentStatus } from './types'
import { clean, normalizePhone, validateEmail, validatePhone, validateRequired } from './validation'

/** Хранилище. Реализации: localStorage (демо-режим в браузере) и JSON-файл (server/). */
export interface Store {
  listOrders(): Promise<Order[]>
  saveOrder(o: Order): Promise<void>
  listLeads(): Promise<Lead[]>
  saveLead(l: Lead): Promise<void>
}

export const MAX_QTY = 99
const uid = () => globalThis.crypto.randomUUID()

function validateOrder(i: CreateOrderInput) {
  const e: Record<string, string> = {}
  const set = (k: string, m: string) => { if (m) e[k] = m }
  set('name', validateRequired('имя')(i.customer?.name ?? ''))
  set('phone', validatePhone(i.customer?.phone ?? ''))
  set('email', validateEmail(i.customer?.email ?? ''))
  set('city', validateRequired('город')(i.delivery?.city ?? ''))
  set('address', validateRequired('адрес или пункт выдачи')(i.delivery?.address ?? ''))
  if (!paymentMethods.some((m) => m.id === i.paymentMethod)) e.paymentMethod = 'Выберите способ оплаты'
  if (!i.idempotencyKey || String(i.idempotencyKey).length < 8) e.idempotencyKey = 'Нет ключа заказа'
  if (!Array.isArray(i.items) || !i.items.length) e.items = 'Корзина пуста'
  if (Object.keys(e).length) throw new ValidationError(e)
}

/**
 * Создание заказа. Сервер — источник истины: цены, названия и доставка берутся из каталога
 * и тарифов, значения от клиента игнорируются. Повторный вызов с тем же idempotencyKey
 * возвращает уже созданный заказ (защита от двойных кликов и повторной отправки).
 */
export async function createOrder(store: Store, input: CreateOrderInput, now = new Date()): Promise<Order> {
  validateOrder(input)
  const orders = await store.listOrders()
  const existing = orders.find((o) => o.idempotencyKey === input.idempotencyKey)
  if (existing) return existing

  const merged = new Map<string, number>()
  for (const it of input.items) {
    const qty = Math.floor(Number(it.qty))
    if (!(qty >= 1 && qty <= MAX_QTY)) throw new ValidationError({ items: 'Некорректное количество' })
    merged.set(it.sku, Math.min(MAX_QTY, (merged.get(it.sku) ?? 0) + qty))
  }
  const items = [...merged].map(([sku, qty]) => {
    const found = getOfferBySku(sku)
    if (!found || found.offer.price <= 0) throw new ValidationError({ items: `Товар ${sku} недоступен для заказа` })
    return { sku, productId: found.product.id, title: found.product.title, label: found.offer.label, price: found.offer.price, qty }
  })
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0)
  let est
  try {
    est = estimateDelivery(input.delivery.provider, input.delivery.city, items.reduce((s, i) => s + i.qty, 0))
  } catch {
    throw new ValidationError({ provider: 'Выберите способ доставки' })
  }
  const method = input.paymentMethod
  const iso = now.toISOString()
  const order: Order = {
    id: uid(),
    number: 'GR-' + String(orders.length + 1001).padStart(5, '0'),
    createdAt: iso,
    updatedAt: iso,
    idempotencyKey: input.idempotencyKey,
    customer: {
      name: clean(input.customer.name, 100),
      phone: normalizePhone(input.customer.phone),
      email: clean(input.customer.email, 120) || undefined,
      comment: clean(input.customer.comment, 500) || undefined,
    },
    delivery: { provider: est.provider, providerTitle: est.providerTitle, city: clean(input.delivery.city, 100), address: clean(input.delivery.address, 250), price: est.price, daysMin: est.daysMin, daysMax: est.daysMax, estimated: true },
    payment: { method, status: method === 'card' ? 'pending' : 'unpaid' },
    items,
    subtotal,
    total: subtotal + est.price,
    status: 'new',
    utm: input.utm,
    history: [{ at: iso, by: 'customer', action: 'Заказ создан' }],
  }
  await store.saveOrder(order)
  return order
}

async function mutate(store: Store, id: string, fn: (o: Order) => void): Promise<Order> {
  const o = (await store.listOrders()).find((x) => x.id === id)
  if (!o) throw new Error('not-found')
  fn(o)
  o.updatedAt = new Date().toISOString()
  await store.saveOrder(o)
  return o
}

/** Событие платёжного шлюза (webhook). Оплаченный заказ повторно не изменяется. */
export function applyPaymentEvent(store: Store, id: string, status: Extract<PaymentStatus, 'paid' | 'failed' | 'cancelled'>) {
  return mutate(store, id, (o) => {
    if (o.payment.method !== 'card' || o.payment.status === 'paid') return
    o.payment.status = status
    o.history.push({ at: new Date().toISOString(), by: 'payment-gateway', action: `Оплата: ${status}` })
  })
}

/** Повторная попытка оплаты после отмены/ошибки */
export function retryPayment(store: Store, id: string) {
  return mutate(store, id, (o) => {
    if (o.payment.method === 'card' && (o.payment.status === 'failed' || o.payment.status === 'cancelled')) {
      o.payment.status = 'pending'
      o.history.push({ at: new Date().toISOString(), by: 'customer', action: 'Повторная попытка оплаты' })
    }
  })
}

export function setOrderStatus(store: Store, id: string, status: OrderStatus, by: string, note?: string) {
  return mutate(store, id, (o) => {
    o.history.push({ at: new Date().toISOString(), by, action: `Статус заказа: ${o.status} → ${status}`, note })
    o.status = status
  })
}

/** Ручная смена оплаты — только с причиной, попадает в журнал аудита */
export async function markPaidManually(store: Store, id: string, by: string, reason: string) {
  if (!reason.trim()) throw new ValidationError({ reason: 'Укажите причину' })
  return mutate(store, id, (o) => {
    o.history.push({ at: new Date().toISOString(), by, action: `Оплата вручную: ${o.payment.status} → paid`, note: reason.trim() })
    o.payment.status = 'paid'
  })
}

export async function createLead(store: Store, input: CreateLeadInput, now = new Date()): Promise<Lead | null> {
  const e: Record<string, string> = {}
  if (validateRequired('имя')(input.name ?? '')) e.name = 'Укажите имя'
  if (validatePhone(input.phone ?? '')) e.phone = validatePhone(input.phone ?? '')
  if (Object.keys(e).length) throw new ValidationError(e)
  // Спам-ловушка: бот заполняет скрытое поле — молча отбрасываем
  if (input.website) return null
  const lead: Lead = {
    id: uid(), createdAt: now.toISOString(), name: clean(input.name, 100), phone: normalizePhone(input.phone),
    message: clean(input.message, 1000) || undefined, source: clean(input.source, 60) || 'site', utm: input.utm, status: 'new',
  }
  await store.saveLead(lead)
  return lead
}

export async function setLeadStatus(store: Store, id: string, status: LeadStatus) {
  const l = (await store.listLeads()).find((x) => x.id === id)
  if (!l) throw new Error('not-found')
  l.status = status
  await store.saveLead(l)
  return l
}
