// Точка входа Cloudflare Workers: то же приложение Hono, что и на Node, но с хранилищем D1.
// Секреты задаются через `wrangler secret put`, обычные переменные — в wrangler.toml [vars].
import { createApp } from './app'
import { d1Store, type D1Like } from './d1Store'

interface Env {
  DB: D1Like
  SESSION_SECRET: string
  ADMIN_PASSWORD_HASH: string
  PAYMENT_WEBHOOK_SECRET: string
  ADMIN_USER?: string
  ALLOWED_ORIGINS?: string
  PAYMENT_MODE?: string
  CROSS_SITE_COOKIES?: string
}

let cached: ReturnType<typeof createApp> | undefined

export default {
  fetch(request: Request, env: Env, ctx: unknown) {
    cached ??= createApp({
      store: d1Store(env.DB),
      sessionSecret: env.SESSION_SECRET,
      adminUser: env.ADMIN_USER ?? 'admin',
      adminHash: env.ADMIN_PASSWORD_HASH,
      webhookSecret: env.PAYMENT_WEBHOOK_SECRET,
      paymentMode: env.PAYMENT_MODE === 'live' ? 'live' : 'sandbox',
      allowedOrigins: (env.ALLOWED_ORIGINS ?? '').split(',').filter(Boolean),
      secureCookies: true,
      crossSiteCookies: env.CROSS_SITE_COOKIES === 'true',
    })
    return cached.fetch(request, env, ctx as never)
  },
}
