// Запуск: npm run server  (переменные окружения — см. .env.example)
import { serve } from '@hono/node-server'
import { createApp } from './app'
import { sqliteStore } from './sqliteStore'

const need = (k: string) => {
  const v = process.env[k]
  if (!v) throw new Error(`Не задана переменная окружения ${k} (см. .env.example)`)
  return v
}

if (process.argv[1]?.endsWith('server/index.ts')) {
  const app = createApp({
    store: sqliteStore(process.env.DATA_FILE ?? './server/data/shop.db'),
    sessionSecret: need('SESSION_SECRET'),
    adminUser: need('ADMIN_USER'),
    adminHash: need('ADMIN_PASSWORD_HASH'),
    webhookSecret: need('PAYMENT_WEBHOOK_SECRET'),
    paymentMode: process.env.PAYMENT_MODE === 'live' ? 'live' : 'sandbox',
    allowedOrigins: (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173').split(','),
    secureCookies: process.env.NODE_ENV === 'production',
    crossSiteCookies: process.env.CROSS_SITE_COOKIES === 'true',
  })
  const port = Number(process.env.PORT ?? 8787)
  serve({ fetch: app.fetch, port, hostname: '0.0.0.0' }, () => console.log(`API: http://localhost:${port}`))
}
