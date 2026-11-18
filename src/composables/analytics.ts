// Яндекс Метрика. Счётчик подключается только если задан VITE_YM_ID и это production-сборка,
// поэтому dev/staging не засоряют боевую статистику. Персональные данные (имя, телефон, email,
// адрес) в Метрику не передаются — только идентификаторы товаров, суммы и названия целей.
// Список целей: docs/ANALYTICS.md
import { site } from '@/config/site'

type Goal =
  | 'view_item' | 'search' | 'view_category' | 'add_to_cart' | 'view_cart' | 'begin_checkout'
  | 'select_delivery' | 'go_to_payment' | 'purchase' | 'lead_submit'

declare global {
  interface Window {
    ym?: (...args: unknown[]) => void
    dataLayer?: unknown[]
  }
}

const enabled = () => typeof window !== 'undefined' && !!site.metrikaId && import.meta.env.PROD

export function initMetrika() {
  if (!enabled() || window.ym) return
  window.dataLayer = window.dataLayer || []
  const w = window as unknown as Record<string, unknown>
  w.ym = w.ym || function (...a: unknown[]) { ((w.ym as { a?: unknown[][] }).a = (w.ym as { a?: unknown[][] }).a || []).push(a) }
  const s = document.createElement('script')
  s.async = true
  s.src = 'https://mc.yandex.ru/metrika/tag.js'
  document.head.appendChild(s)
  window.ym!(Number(site.metrikaId), 'init', {
    clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: false, ecommerce: 'dataLayer', defer: true,
  })
}

export function trackHit(url: string) {
  if (enabled()) window.ym?.(Number(site.metrikaId), 'hit', url)
}

export function track(goal: Goal, params?: Record<string, string | number>) {
  if (enabled()) window.ym?.(Number(site.metrikaId), 'reachGoal', goal, params)
}

interface EcomProduct { id: string; name: string; price: number; quantity?: number; variant?: string; brand?: string }

/** Электронная коммерция Метрики (dataLayer) */
export function ecommerce(action: 'detail' | 'add' | 'remove' | 'purchase', products: EcomProduct[], extra?: { id: string; revenue: number }) {
  if (!enabled()) return
  const body = action === 'purchase' ? { purchase: { actionField: extra, products } } : { [action]: { products } }
  window.dataLayer?.push({ ecommerce: { currencyCode: 'RUB', ...body } })
}
