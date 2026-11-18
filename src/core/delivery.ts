import { deliveryProviders } from '@/config/site'

export interface DeliveryEstimate {
  provider: string
  providerTitle: string
  price: number
  daysMin: number
  daysMax: number
  /** true — стоимость ориентировочная, окончательную подтверждает менеджер */
  estimated: true
}

/**
 * Адаптер расчёта доставки. Сейчас — тарифная таблица из конфигурации;
 * реальные провайдеры (СДЭК/Ozon) подключаются заменой этой функции на серверный вызов API.
 */
export function estimateDelivery(providerId: string, city: string, itemsCount: number): DeliveryEstimate {
  const p = deliveryProviders.find((x) => x.id === providerId)
  if (!p) throw new Error('unknown-provider')
  if (!city.trim()) throw new Error('city-required')
  return { provider: p.id, providerTitle: p.title, price: p.base + p.perItem * Math.max(0, itemsCount - 1), daysMin: p.daysMin, daysMax: p.daysMax, estimated: true }
}
