export interface DeliveryQuote {
  providerId: string
  price: number
  daysMin: number
  daysMax: number
  /** true — расчёт тестовый, не от реального API */
  isMock: boolean
}

export interface DeliveryProvider {
  id: string
  title: string
  quote(params: { city: string; itemsCount: number; subtotal: number }): Promise<DeliveryQuote>
}

/**
 * Заглушка. Реальные тарифы СДЭК/Ozon требуют API-доступов, веса и габаритов товаров
 * и серверных запросов — пока этого нет. Цифры ниже условные.
 */
function mockProvider(id: string, title: string, base: number, perItem: number): DeliveryProvider {
  return {
    id,
    title,
    async quote({ city, itemsCount }) {
      await new Promise((r) => setTimeout(r, 400))
      if (!city.trim()) throw new Error('city-required')
      return { providerId: id, price: base + perItem * itemsCount, daysMin: 2, daysMax: 5, isMock: true }
    },
  }
}

export const deliveryProviders: DeliveryProvider[] = [
  mockProvider('cdek', 'СДЭК (тест)', 300, 20),
  mockProvider('ozon', 'Ozon (тест)', 250, 25),
]
