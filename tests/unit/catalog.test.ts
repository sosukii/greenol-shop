import { existsSync } from 'node:fs'
import imagesJson from '@/data/images.json'
const images = imagesJson as Record<string, { widths: number[] }>
import { describe, expect, it } from 'vitest'
import { categories, descendantIds, isPurchasable, getProduct, minPrice, productCategory, products, queryProducts } from '@/data/catalog'
import { estimateDelivery } from '@/core/delivery'
import { clean, normalizePhone, validateEmail, validatePhone } from '@/core/validation'
import { hashPassword, signToken, verifyPassword, verifyToken } from '@/core/auth'

describe('целостность каталога', () => {
  it('у каждого товара есть предложения с положительной ценой и уникальным артикулом', () => {
    const skus = products.flatMap((p) => p.offers.map((o) => o.sku))
    expect(new Set(skus).size).toBe(skus.length)
    for (const p of products) {
      expect(p.offers.length).toBeGreaterThan(0)
      for (const o of p.offers) expect(o.price).toBeGreaterThanOrEqual(0)
    }
    expect(products.filter(isPurchasable).length).toBeGreaterThan(35)
  })
  it('все файлы изображений существуют', () => {
    for (const p of products) for (const id of p.images) expect(existsSync(`public/img/p/${id}-${images[id].widths[0]}.webp`), `${p.slug}:${id}`).toBe(true)
  })
  it('все категории товаров существуют, нет упоминаний демо', () => {
    const ids = new Set(categories.map((c) => c.id))
    for (const p of products) for (const c of p.categoryIds) expect(ids.has(c)).toBe(true)
    expect(JSON.stringify(products).toLowerCase()).not.toMatch(/тестов|демо|макса/)
  })
  it('нет циклов в дереве категорий', () => {
    for (const c of categories) expect(productCategory({ categoryIds: [c.id] } as never).length).toBeLessThan(6)
  })
})

describe('queryProducts', () => {
  it('категория включает товары вложенных категорий', () => {
    expect(descendantIds('avtomasla')).toContain('zaschita-sidenya')
    const inParent = queryProducts({ categoryId: 'avtomasla' })
    const inChild = queryProducts({ categoryId: 'zaschita-sidenya' })
    expect(inChild.length).toBeGreaterThan(0)
    for (const p of inChild) expect(inParent).toContain(p)
  })
  it('поиск нечувствителен к регистру и ё, учитывает несколько слов и артикул', () => {
    expect(queryProducts({ search: 'РЕАНИМАТОР' }).length).toBeGreaterThan(0)
    expect(queryProducts({ search: 'раскоксовка реаниматор' }).length).toBeGreaterThan(0)
    const sku = products[0].offers[0].sku
    expect(queryProducts({ search: sku.toLowerCase() })).toContain(products[0])
    expect(queryProducts({ search: 'zzzzzz-нет' })).toEqual([])
  })
  it('фильтры по бренду, наличию и цене', () => {
    for (const p of queryProducts({ brands: ['totek'] })) expect(p.brand).toBe('totek')
    for (const p of queryProducts({ inStockOnly: true })) expect(p.offers.some((o) => o.inStock)).toBe(true)
    for (const p of queryProducts({ priceMax: 1000 })) expect(minPrice(p)).toBeLessThanOrEqual(1000)
  })
  it('сортировка по цене', () => {
    const asc = queryProducts({ sort: 'price-asc' }).filter(isPurchasable).map(minPrice)
    expect(asc).toEqual([...asc].sort((a, b) => a - b))
    const desc = queryProducts({ sort: 'price-desc' }).filter(isPurchasable).map(minPrice)
    expect(desc).toEqual([...desc].sort((a, b) => b - a))
  })
  it('товары «цена по запросу» не попадают в ценовые фильтры', () => {
    const onRequest = products.filter((p) => !isPurchasable(p))
    expect(onRequest.length).toBeGreaterThan(0)
    for (const p of onRequest) expect(queryProducts({ priceMax: 100000 })).not.toContain(p)
  })
  it('getProduct находит по slug', () => {
    expect(getProduct(products[3].slug)).toBe(products[3])
    expect(getProduct('net-takogo')).toBeUndefined()
  })
})

describe('доставка', () => {
  it('оценка зависит от количества и помечена как ориентировочная', () => {
    const a = estimateDelivery('cdek', 'Москва', 1)
    const b = estimateDelivery('cdek', 'Москва', 5)
    expect(b.price).toBeGreaterThan(a.price)
    expect(a.estimated).toBe(true)
  })
  it('требует город и известного провайдера', () => {
    expect(() => estimateDelivery('cdek', ' ', 1)).toThrow('city-required')
    expect(() => estimateDelivery('x', 'М', 1)).toThrow('unknown-provider')
  })
})

describe('валидация', () => {
  it('телефоны', () => {
    expect(normalizePhone('8 (916) 245-45-24')).toBe('+79162454524')
    expect(normalizePhone('+7 916 245 45 24')).toBe('+79162454524')
    expect(normalizePhone('9162454524')).toBe('+79162454524')
    expect(validatePhone('12345')).not.toBe('')
  })
  it('email необязателен, но проверяется', () => {
    expect(validateEmail('')).toBe('')
    expect(validateEmail('a@b.ru')).toBe('')
    expect(validateEmail('a@b')).not.toBe('')
  })
  it('clean убирает управляющие символы и обрезает', () => {
    expect(clean('a\u0000b\nc', 10)).toBe('a b c')
    expect(clean('x'.repeat(20), 5)).toHaveLength(5)
  })
})

describe('auth', () => {
  it('пароль: верный проходит, неверный нет, хэши солёные', async () => {
    const h = await hashPassword('secret')
    expect(await verifyPassword('secret', h)).toBe(true)
    expect(await verifyPassword('Secret', h)).toBe(false)
    expect(await hashPassword('secret')).not.toBe(h)
  })
  it('токен: подпись проверяется, подделка и истечение отклоняются', async () => {
    const t = await signToken('s', { user: 'a' })
    expect(await verifyToken('s', t)).toMatchObject({ user: 'a' })
    expect(await verifyToken('other', t)).toBeNull()
    expect(await verifyToken('s', t.replace(/^./, 'X'))).toBeNull()
    expect(await verifyToken('s', await signToken('s', { user: 'a' }, -10))).toBeNull()
  })
})
