import { beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../../server/app'
import { hashPassword, hmacHex } from '@/core/auth'
import { memoryStore, orderInput } from '../unit/helpers'

const json = (body: unknown, extra: Record<string, string> = {}) => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json', ...extra },
  body: JSON.stringify(body),
})

let app: ReturnType<typeof createApp>
let store: ReturnType<typeof memoryStore>

beforeEach(async () => {
  store = memoryStore()
  app = createApp({
    store, sessionSecret: 'test-secret', adminUser: 'admin', adminHash: await hashPassword('pw'),
    webhookSecret: 'whsec', paymentMode: 'sandbox', allowedOrigins: ['http://localhost:5173'], secureCookies: false,
  })
})

async function login(password = 'pw') {
  const r = await app.request('/api/admin/login', json({ user: 'admin', password }))
  return { r, cookie: r.headers.get('set-cookie')?.split(';')[0] ?? '' }
}

describe('публичное API', () => {
  it('создаёт заказ (201) и не отдаёт внутренние поля', async () => {
    const r = await app.request('/api/orders', json(orderInput()))
    expect(r.status).toBe(201)
    const o = await r.json()
    expect(o.number).toMatch(/^GR-/)
    expect(o.history).toBeUndefined()
    expect(o.idempotencyKey).toBeUndefined()
  })
  it('невалидный заказ → 422 с полями', async () => {
    const r = await app.request('/api/orders', json(orderInput({ items: [] })))
    expect(r.status).toBe(422)
    expect((await r.json()).fields.items).toBeTruthy()
  })
  it('повтор с тем же ключом не создаёт второй заказ', async () => {
    const input = orderInput()
    await app.request('/api/orders', json(input))
    await app.request('/api/orders', json(input))
    expect(store.orders).toHaveLength(1)
  })
  it('не-JSON запись → 415 (CSRF-защита)', async () => {
    const r = await app.request('/api/orders', { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: '{}' })
    expect(r.status).toBe(415)
  })
  it('несуществующий заказ → 404', async () => {
    expect((await app.request('/api/orders/nope')).status).toBe(404)
  })
  it('лид: 204, ловушка тоже 204, но не сохраняется', async () => {
    expect((await app.request('/api/leads', json({ name: 'А', phone: '9160000000', source: 's' }))).status).toBe(204)
    expect((await app.request('/api/leads', json({ name: 'Б', phone: '9160000000', source: 's', website: 'x' }))).status).toBe(204)
    expect(store.leads).toHaveLength(1)
  })
  it('rate limit на создание заказов', async () => {
    let last = 0
    for (let i = 0; i < 25; i++) last = (await app.request('/api/orders', json(orderInput()))).status
    expect(last).toBe(429)
  })
})

describe('webhook оплаты', () => {
  async function order() {
    return (await (await app.request('/api/orders', json(orderInput()))).json()) as { id: string }
  }
  it('отклоняет неверную подпись', async () => {
    const { id } = await order()
    const body = JSON.stringify({ orderId: id, status: 'paid' })
    const r = await app.request('/api/payments/webhook', { method: 'POST', headers: { 'X-Signature': 'bad' }, body })
    expect(r.status).toBe(401)
    expect(store.orders[0].payment.status).toBe('pending')
  })
  it('принимает корректную подпись и отмечает оплату', async () => {
    const { id } = await order()
    const body = JSON.stringify({ orderId: id, status: 'paid' })
    const r = await app.request('/api/payments/webhook', { method: 'POST', headers: { 'X-Signature': await hmacHex('whsec', body) }, body })
    expect(r.status).toBe(200)
    expect(store.orders[0].payment.status).toBe('paid')
  })
  it('песочница недоступна в live-режиме', async () => {
    const live = createApp({ store, sessionSecret: 's', adminUser: 'a', adminHash: 'x', webhookSecret: 'w', paymentMode: 'live', allowedOrigins: [] })
    const { id } = await order()
    expect((await live.request(`/api/payments/sandbox/${id}/paid`, json({}))).status).toBe(403)
  })
})

describe('админка', () => {
  it('без авторизации — 401', async () => {
    for (const p of ['/api/admin/orders', '/api/admin/leads', '/api/admin/me']) expect((await app.request(p)).status).toBe(401)
  })
  it('неверный пароль — 401, верный — httpOnly cookie', async () => {
    expect((await login('wrong')).r.status).toBe(401)
    const { r } = await login()
    expect(r.status).toBe(200)
    expect(r.headers.get('set-cookie')).toMatch(/HttpOnly/i)
  })
  it('брутфорс логина ограничивается', async () => {
    let last = 0
    for (let i = 0; i < 7; i++) last = (await login('wrong')).r.status
    expect(last).toBe(429)
  })
  it('подделанная cookie не проходит', async () => {
    const r = await app.request('/api/admin/orders', { headers: { Cookie: 'gr_admin=eyJ1c2VyIjoiYSJ9.AAAA' } })
    expect(r.status).toBe(401)
  })
  it('сценарий владельца: заказ виден в списке, статус меняется, ручная оплата с аудитом', async () => {
    const created = await (await app.request('/api/orders', json(orderInput({ paymentMethod: 'invoice' })))).json()
    const { cookie } = await login()
    const h = { Cookie: cookie }
    const list = await (await app.request('/api/admin/orders', { headers: h })).json()
    expect(list).toHaveLength(1)
    expect(list[0].customer.name).toBe('Иван')

    const st = await app.request(`/api/admin/orders/${created.id}/status`, json({ status: 'confirmed' }, h))
    expect((await st.json()).status).toBe('confirmed')

    const noReason = await app.request(`/api/admin/orders/${created.id}/mark-paid`, json({ reason: '' }, h))
    expect(noReason.status).toBe(422)
    const paid = await (await app.request(`/api/admin/orders/${created.id}/mark-paid`, json({ reason: 'Счёт оплачен' }, h))).json()
    expect(paid.payment.status).toBe('paid')
    expect(paid.history.some((x: { note?: string }) => x.note === 'Счёт оплачен')).toBe(true)
  })
  it('неверный статус → 422', async () => {
    const created = await (await app.request('/api/orders', json(orderInput()))).json()
    const { cookie } = await login()
    const r = await app.request(`/api/admin/orders/${created.id}/status`, json({ status: 'hacked' }, { Cookie: cookie }))
    expect(r.status).toBe(422)
  })
})
