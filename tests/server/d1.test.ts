import { readFileSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'
import { describe, expect, it } from 'vitest'
import { applyPaymentEvent, createLead, createOrder } from '@/core/orders'
import { d1Store, type D1Like } from '../../server/d1Store'
import { orderInput } from '../unit/helpers'

/** Фейковый D1 поверх node:sqlite: тот же контракт prepare().bind().run()/all(), та же SQL-миграция. */
function fakeD1(): D1Like {
  const db = new DatabaseSync(':memory:')
  db.exec(readFileSync('migrations/0001_init.sql', 'utf8'))
  const stmt = (sql: string, values: unknown[] = []) => ({
    run: async () => db.prepare(sql).run(...(values as never[])),
    all: async <T>() => ({ results: db.prepare(sql).all(...(values as never[])) as T[] }),
  })
  return { prepare: (sql) => ({ ...stmt(sql), bind: (...v) => stmt(sql, v) }) }
}

describe('D1-хранилище (Cloudflare)', () => {
  it('заказы и лиды сохраняются, идемпотентность и нумерация работают', async () => {
    const s = d1Store(fakeD1())
    const input = orderInput()
    const a = await createOrder(s, input)
    expect((await createOrder(s, input)).id).toBe(a.id)
    const b = await createOrder(s, orderInput())
    expect([a.number, b.number]).toEqual(['GR-01001', 'GR-01002'])
    await applyPaymentEvent(s, a.id, 'paid')
    expect((await s.listOrders()).find((o) => o.id === a.id)?.payment.status).toBe('paid')
    await createLead(s, { name: 'А', phone: '9160000000', source: 'x' })
    expect(await s.listLeads()).toHaveLength(1)
  })
  it('уникальный индекс не даёт записать дубль ключа', async () => {
    const s = d1Store(fakeD1())
    const o = await createOrder(s, orderInput())
    await expect(s.saveOrder({ ...o, id: 'other', number: 'GR-99999' })).rejects.toThrow()
  })
})
