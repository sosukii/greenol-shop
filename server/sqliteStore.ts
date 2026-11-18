// Хранилище на SQLite (встроенный node:sqlite, Node ≥ 22.13). Документы хранятся как JSON,
// уникальные индексы защищают от дублей заказов по ключу идемпотентности и номеру.
import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import type { Store } from '../src/core/orders'
import type { Lead, Order } from '../src/core/types'

export function sqliteStore(path: string): Store & { close(): void } {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true })
  const db = new DatabaseSync(path)
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY, idem_key TEXT NOT NULL UNIQUE, number TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL, data TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS leads (id TEXT PRIMARY KEY, created_at TEXT NOT NULL, data TEXT NOT NULL);
  `)
  const upOrder = db.prepare(`INSERT INTO orders (id, idem_key, number, created_at, data) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET data = excluded.data`)
  const upLead = db.prepare(`INSERT INTO leads (id, created_at, data) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data`)
  const allOrders = db.prepare('SELECT data FROM orders ORDER BY created_at')
  const allLeads = db.prepare('SELECT data FROM leads ORDER BY created_at')
  // ВАЖНО: держим ссылку на db в замыкании (close), иначе GC закроет базу и подготовленные запросы упадут
  // с «statement has been finalized» уже на работающем сервере.
  return {
    close: () => db.close(),
    listOrders: async () => allOrders.all().map((r) => JSON.parse(r.data as string) as Order),
    saveOrder: async (o) => { upOrder.run(o.id, o.idempotencyKey, o.number, o.createdAt, JSON.stringify(o)) },
    listLeads: async () => allLeads.all().map((r) => JSON.parse(r.data as string) as Lead),
    saveLead: async (l) => { upLead.run(l.id, l.createdAt, JSON.stringify(l)) },
  }
}
