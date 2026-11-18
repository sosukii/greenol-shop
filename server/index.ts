// Запуск: npm run server  (переменные окружения — см. .env.example)
import { serve } from '@hono/node-server'
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import type { Store } from '../src/core/orders'
import type { Lead, Order } from '../src/core/types'
import { createApp } from './app'

const need = (k: string) => {
  const v = process.env[k]
  if (!v) throw new Error(`Не задана переменная окружения ${k} (см. .env.example)`)
  return v
}

/** Файловое хранилище (JSON) с атомарной записью. Для продакшена — заменить на БД (PostgreSQL). */
export function fileStore(path: string): Store {
  mkdirSync(dirname(path), { recursive: true })
  const load = (): { orders: Order[]; leads: Lead[] } =>
    existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : { orders: [], leads: [] }
  const save = (d: unknown) => {
    writeFileSync(path + '.tmp', JSON.stringify(d, null, 2))
    renameSync(path + '.tmp', path)
  }
  const upsert = <T extends { id: string }>(arr: T[], item: T) => {
    const i = arr.findIndex((x) => x.id === item.id)
    if (i >= 0) arr[i] = item
    else arr.push(item)
  }
  return {
    listOrders: async () => load().orders,
    saveOrder: async (o) => { const d = load(); upsert(d.orders, o); save(d) },
    listLeads: async () => load().leads,
    saveLead: async (l) => { const d = load(); upsert(d.leads, l); save(d) },
  }
}

if (process.argv[1]?.endsWith('server/index.ts')) {
  const app = createApp({
    store: fileStore(process.env.DATA_FILE ?? './server/data/db.json'),
    sessionSecret: need('SESSION_SECRET'),
    adminUser: need('ADMIN_USER'),
    adminHash: need('ADMIN_PASSWORD_HASH'),
    webhookSecret: need('PAYMENT_WEBHOOK_SECRET'),
    paymentMode: process.env.PAYMENT_MODE === 'live' ? 'live' : 'sandbox',
    allowedOrigins: (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173').split(','),
    secureCookies: process.env.NODE_ENV === 'production',
  })
  const port = Number(process.env.PORT ?? 8787)
  serve({ fetch: app.fetch, port }, () => console.log(`API: http://localhost:${port}`))
}
