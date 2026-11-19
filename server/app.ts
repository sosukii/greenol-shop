import { Hono, type Context } from 'hono'
import { cors } from 'hono/cors'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { hmacHex, signToken, verifyPassword, verifyToken } from '../src/core/auth'
import { applyPaymentEvent, createLead, createOrder, markPaidManually, retryPayment, setLeadStatus, setOrderStatus, type Store } from '../src/core/orders'
import { ValidationError, type Order } from '../src/core/types'
import { matchCity } from '../src/core/geo'
import { cities } from '../src/data/cities'

export interface AppConfig {
  store: Store
  /** секрет подписи сессий */
  sessionSecret: string
  adminUser: string
  /** хэш пароля в формате pbkdf2$... (см. scripts/hash-password.mjs) */
  adminHash: string
  /** секрет подписи webhook платёжного шлюза */
  webhookSecret: string
  paymentMode: 'sandbox' | 'live'
  /** разрешённые Origin для CORS (адрес витрины) */
  allowedOrigins: string[]
  secureCookies?: boolean
  /** витрина на другом домене (например GitHub Pages): cookie SameSite=None; Secure */
  crossSiteCookies?: boolean
}

/** Простейший in-memory лимитер: key → таймстемпы. Для нескольких инстансов нужен общий стор (Redis). */
function limiter(max: number, windowMs: number) {
  const hits = new Map<string, number[]>()
  return (key: string) => {
    const now = Date.now()
    const arr = (hits.get(key) ?? []).filter((t) => now - t < windowMs)
    arr.push(now)
    hits.set(key, arr)
    return arr.length <= max
  }
}

const pub = ({ history: _h, idempotencyKey: _k, utm: _u, ...rest }: Order) => rest
const SESSION_COOKIE = 'gr_admin'

export function createApp(cfg: AppConfig) {
  const app = new Hono()
  const loginLimit = limiter(5, 15 * 60_000)
  const writeLimit = limiter(20, 60_000)
  const ip = (c: Context) => c.req.header('x-forwarded-for')?.split(',')[0].trim() ?? 'local'

  app.use('/api/*', cors({ origin: cfg.allowedOrigins, credentials: true, allowHeaders: ['Content-Type', 'X-Signature'] }))

  // CSRF-подход: изменяющие запросы принимаются только как application/json
  // (кросс-сайтовая форма так не отправится, а fetch требует CORS-preflight) + SameSite=Lax cookie.
  app.use('/api/*', async (c, next) => {
    const m = c.req.method
    const isWebhook = c.req.path === '/api/payments/webhook'
    if (m !== 'GET' && m !== 'OPTIONS' && !isWebhook && !c.req.header('content-type')?.includes('application/json')) {
      return c.json({ error: 'unsupported-media-type' }, 415)
    }
    await next()
  })

  app.onError((err, c) => {
    if (err instanceof ValidationError) return c.json({ fields: err.fields }, 422)
    if (err.message === 'not-found') return c.json({ error: 'not-found' }, 404)
    console.error('[api]', err.message) // без персональных данных и тел запросов
    return c.json({ error: 'internal' }, 500)
  })

  app.get('/api/health', (c) => c.json({ ok: true }))

  // Город посетителя по IP: берём данные самого Cloudflare (request.cf), IP никуда не передаётся и не сохраняется.
  // Возвращаем только название города из нашего справочника (или null).
  app.get('/api/geo', (c) => {
    const cf = (c.req.raw as unknown as { cf?: { city?: string; country?: string } }).cf
    return c.json({ city: cf?.country === 'RU' ? matchCity(cf.city, cities) : null })
  })

  // ---- Публичные ----
  app.post('/api/orders', async (c) => {
    if (!writeLimit(ip(c))) return c.json({ error: 'rate-limited' }, 429)
    return c.json(pub(await createOrder(cfg.store, await c.req.json())), 201)
  })
  app.get('/api/orders/:id', async (c) => {
    const o = (await cfg.store.listOrders()).find((x) => x.id === c.req.param('id'))
    return o ? c.json(pub(o)) : c.json({ error: 'not-found' }, 404)
  })
  app.post('/api/orders/:id/retry-payment', async (c) => c.json(pub(await retryPayment(cfg.store, c.req.param('id')))))
  app.post('/api/leads', async (c) => {
    if (!writeLimit(ip(c))) return c.json({ error: 'rate-limited' }, 429)
    await createLead(cfg.store, await c.req.json())
    return c.body(null, 204) // ответ одинаков и для спама-ловушки
  })

  // ---- Платежи ----
  // Webhook банка: подпись HMAC-SHA256 от тела запроса. Заказ считается оплаченным только здесь,
  // а не по возврату пользователя на сайт.
  app.post('/api/payments/webhook', async (c) => {
    const raw = await c.req.text()
    const sig = c.req.header('x-signature') ?? ''
    if (sig !== (await hmacHex(cfg.webhookSecret, raw))) return c.json({ error: 'bad-signature' }, 401)
    const { orderId, status } = JSON.parse(raw)
    if (!['paid', 'failed', 'cancelled'].includes(status)) return c.json({ error: 'bad-status' }, 422)
    return c.json(pub(await applyPaymentEvent(cfg.store, orderId, status)))
  })
  app.post('/api/payments/sandbox/:id/:outcome', async (c) => {
    if (cfg.paymentMode !== 'sandbox') return c.json({ error: 'forbidden' }, 403)
    const outcome = c.req.param('outcome')
    if (!['paid', 'failed', 'cancelled'].includes(outcome)) return c.json({ error: 'bad-status' }, 422)
    return c.json(pub(await applyPaymentEvent(cfg.store, c.req.param('id'), outcome as 'paid')))
  })

  // ---- Админка ----
  app.post('/api/admin/login', async (c) => {
    if (!loginLimit(ip(c))) return c.json({ error: 'rate-limited' }, 429)
    const { user, password } = await c.req.json()
    const ok = user === cfg.adminUser && typeof password === 'string' && (await verifyPassword(password, cfg.adminHash))
    if (!ok) return c.json({ error: 'invalid-credentials' }, 401)
    setCookie(c, SESSION_COOKIE, await signToken(cfg.sessionSecret, { user, role: 'owner' }), {
      httpOnly: true, sameSite: cfg.crossSiteCookies ? 'None' : 'Lax', secure: cfg.crossSiteCookies ? true : (cfg.secureCookies ?? true), path: '/', maxAge: 8 * 3600,
    })
    return c.json({ ok: true })
  })
  app.post('/api/admin/logout', (c) => {
    deleteCookie(c, SESSION_COOKIE, { path: '/' })
    return c.body(null, 204)
  })

  // Проверка сессии: всегда 200, чтобы витрина могла спросить «вошёл ли я» без ошибок в консоли
  app.get('/api/admin/me', async (c) => {
    const s = await verifyToken(cfg.sessionSecret, getCookie(c, SESSION_COOKIE))
    return c.json(s ? { authenticated: true, user: s.user, role: 'owner' } : { authenticated: false })
  })

  const admin = new Hono<{ Variables: { user: string } }>()
  admin.use('*', async (c, next) => {
    const s = await verifyToken(cfg.sessionSecret, getCookie(c, SESSION_COOKIE))
    if (!s) return c.json({ error: 'unauthorized' }, 401)
    c.set('user', String(s.user))
    await next()
  })
  admin.get('/orders', async (c) => c.json((await cfg.store.listOrders()).sort((a, b) => b.createdAt.localeCompare(a.createdAt))))
  admin.get('/orders/:id', async (c) => {
    const o = (await cfg.store.listOrders()).find((x) => x.id === c.req.param('id'))
    return o ? c.json(o) : c.json({ error: 'not-found' }, 404)
  })
  admin.post('/orders/:id/status', async (c) => {
    const { status, note } = await c.req.json()
    if (!['new', 'confirmed', 'shipped', 'completed', 'cancelled'].includes(status)) return c.json({ fields: { status: 'Неверный статус' } }, 422)
    return c.json(await setOrderStatus(cfg.store, c.req.param('id'), status, c.get('user'), note))
  })
  admin.post('/orders/:id/mark-paid', async (c) => c.json(await markPaidManually(cfg.store, c.req.param('id'), c.get('user'), (await c.req.json()).reason ?? '')))
  admin.get('/leads', async (c) => c.json((await cfg.store.listLeads()).sort((a, b) => b.createdAt.localeCompare(a.createdAt))))
  admin.post('/leads/:id/status', async (c) => {
    const { status } = await c.req.json()
    if (!['new', 'in_progress', 'done', 'spam'].includes(status)) return c.json({ fields: { status: 'Неверный статус' } }, 422)
    return c.json(await setLeadStatus(cfg.store, c.req.param('id'), status))
  })
  app.route('/api/admin', admin)

  return app
}
