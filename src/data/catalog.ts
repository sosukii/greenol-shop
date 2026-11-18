// Единая точка доступа к данным каталога. Источник — src/data/catalog.json
// (импорт из действующего магазина, см. scripts/import). Для перехода на API/БД
// достаточно заменить реализацию этого модуля: UI зависит только от его функций.
import raw from './catalog.json'
import type { Brand, Category, Offer, Product, ProductQuery } from './types'

export const brands = raw.brands as Brand[]
export const categories = raw.categories as Category[]
export const products = raw.products as Product[]

const bySlug = new Map(products.map((p) => [p.slug, p]))
const offerBySku = new Map(products.flatMap((p) => p.offers.map((o) => [o.sku, { product: p, offer: o }] as const)))

export const getProduct = (slug: string) => bySlug.get(slug)
export const getOfferBySku = (sku: string) => offerBySku.get(sku)
export const getCategory = (slug: string) => categories.find((c) => c.slug === slug)
export const getBrand = (id: string) => brands.find((b) => b.id === id)
export const childCategories = (parentId: string | null) => categories.filter((c) => c.parentId === parentId)

export function categoryPath(id: string): Category[] {
  const c = categories.find((x) => x.id === id)
  return c ? [...(c.parentId ? categoryPath(c.parentId) : []), c] : []
}

export function descendantIds(id: string): string[] {
  return [id, ...categories.filter((c) => c.parentId === id).flatMap((c) => descendantIds(c.id))]
}

/** Цена 0 в источнике = «цена по запросу»: такой товар нельзя положить в корзину */
export const hasPrice = (o: Pick<Offer, 'price'>) => o.price > 0
export const priced = (p: Product) => p.offers.filter(hasPrice)
export const isPurchasable = (p: Product) => priced(p).length > 0
export const minPrice = (p: Product) => (isPurchasable(p) ? Math.min(...priced(p).map((o) => o.price)) : 0)
export const hasRange = (p: Product) => new Set(priced(p).map((o) => o.price)).size > 1
export const isAvailable = (p: Product) => p.offers.some((o) => o.inStock)
export const availabilityLabel = (o: Pick<Offer, 'inStock'>) => (o.inStock ? 'В наличии' : 'Под заказ')
export const productCategory = (p: Product) =>
  // самая глубокая категория товара — для хлебных крошек
  p.categoryIds.map((id) => categoryPath(id)).sort((a, b) => b.length - a.length)[0] ?? []

const norm = (s: string) => s.toLowerCase().replace(/ё/g, 'е')

export function queryProducts(q: ProductQuery = {}): Product[] {
  let list = [...products]
  if (q.categoryId) {
    const ids = descendantIds(q.categoryId)
    list = list.filter((p) => p.categoryIds.some((c) => ids.includes(c)))
  }
  const tokens = norm(q.search ?? '').split(/\s+/).filter(Boolean)
  if (tokens.length) {
    list = list.filter((p) => {
      const hay = norm([p.title, p.brand, ...p.offers.map((o) => o.sku), p.summary].join(' '))
      return tokens.every((t) => hay.includes(t))
    })
  }
  if (q.inStockOnly) list = list.filter(isAvailable)
  if (q.brands?.length) list = list.filter((p) => q.brands!.includes(p.brand))
  if (q.priceMin != null) list = list.filter((p) => Math.max(...p.offers.map((o) => o.price)) >= q.priceMin! && isPurchasable(p))
  if (q.priceMax != null) list = list.filter((p) => isPurchasable(p) && minPrice(p) <= q.priceMax!)
  switch (q.sort) {
    case 'price-asc': list.sort((a, b) => (minPrice(a) || Infinity) - (minPrice(b) || Infinity)); break
    case 'price-desc': list.sort((a, b) => minPrice(b) - minPrice(a)); break
    case 'title': list.sort((a, b) => a.title.localeCompare(b.title, 'ru', { numeric: true })); break
    default: list.sort((a, b) => Number(b.hit) - Number(a.hit) || Number(b.isNew) - Number(a.isNew))
  }
  return list
}

export const hitProducts = () => products.filter((p) => p.hit)
export const newProducts = () => products.filter((p) => p.isNew)
export const relatedProducts = (p: Product, n = 4) =>
  products.filter((x) => x.id !== p.id && x.categoryIds.some((c) => p.categoryIds.includes(c))).slice(0, n)
