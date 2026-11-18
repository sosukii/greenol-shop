// Хранилище на Cloudflare D1 (SQLite в облаке). Схема — migrations/0001_init.sql.
// Документы хранятся как JSON; уникальные индексы защищают от дублей по ключу идемпотентности и номеру.
import type { Store } from '../src/core/orders'
import type { Lead, Order } from '../src/core/types'

/** Минимальный контракт D1, чтобы не тянуть @cloudflare/workers-types и легко подменять в тестах. */
export interface D1Like {
  prepare(sql: string): {
    bind(...values: unknown[]): { run(): Promise<unknown>; all<T = unknown>(): Promise<{ results: T[] }> }
    all<T = unknown>(): Promise<{ results: T[] }>
  }
}

export function d1Store(db: D1Like): Store {
  const rows = async (sql: string) => (await db.prepare(sql).all<{ data: string }>()).results
  return {
    listOrders: async () => (await rows('SELECT data FROM orders ORDER BY created_at')).map((r) => JSON.parse(r.data) as Order),
    saveOrder: async (o) => {
      await db
        .prepare(`INSERT INTO orders (id, idem_key, number, created_at, data) VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET data = excluded.data`)
        .bind(o.id, o.idempotencyKey, o.number, o.createdAt, JSON.stringify(o))
        .run()
    },
    listLeads: async () => (await rows('SELECT data FROM leads ORDER BY created_at')).map((r) => JSON.parse(r.data) as Lead),
    saveLead: async (l) => {
      await db
        .prepare('INSERT INTO leads (id, created_at, data) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data')
        .bind(l.id, l.createdAt, JSON.stringify(l))
        .run()
    },
  }
}
