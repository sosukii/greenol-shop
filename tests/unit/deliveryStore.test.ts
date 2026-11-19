import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const geoCity = vi.fn()
vi.mock('@/api', () => ({ api: { geoCity: () => geoCity() } }))

import { useDeliveryStore } from '@/stores/delivery'

describe('город доставки', () => {
  beforeEach(() => { setActivePinia(createPinia()); geoCity.mockReset() })

  it('помнит три последних города без повторов, новые — первыми', () => {
    const s = useDeliveryStore()
    for (const c of ['Москва', 'Казань', 'Самара', 'казань', 'Тула']) s.remember(c)
    expect(s.recent).toEqual(['Тула', 'казань', 'Самара'])
    s.remember('а') // слишком короткое
    expect(s.recent).toHaveLength(3)
  })
  it('без сохранённого города подставляет определённый по IP и помечает его как автоматический', async () => {
    geoCity.mockResolvedValue('Казань')
    const s = useDeliveryStore()
    s.hydrate()
    await vi.waitFor(() => expect(s.city).toBe('Казань'))
    expect(s.isAuto).toBe(true)
    s.city = 'Самара'
    expect(s.isAuto).toBe(false)
  })
  it('не перетирает город, который пользователь уже ввёл', async () => {
    let resolve: (v: string) => void = () => {}
    geoCity.mockReturnValue(new Promise<string>((r) => { resolve = r }))
    const s = useDeliveryStore()
    s.hydrate()
    s.city = 'Тула'
    resolve('Казань')
    await Promise.resolve()
    expect(s.city).toBe('Тула')
  })
})
