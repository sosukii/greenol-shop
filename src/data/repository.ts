import { categories, products } from './mock'
import type { Category, Product, ProductQuery } from './types'

/** Контракт источника данных. Mock можно заменить на API/БД без правок UI. */
export interface CatalogRepository {
  getCategories(): Promise<Category[]>
  getProducts(query?: ProductQuery): Promise<Product[]>
  getProductBySlug(slug: string): Promise<Product | null>
  getProductsByIds(ids: string[]): Promise<Product[]>
}

const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms))

/** id категории и всех её потомков */
export function descendantIds(all: Category[], id: string): string[] {
  const kids = all.filter((c) => c.parentId === id)
  return [id, ...kids.flatMap((k) => descendantIds(all, k.id))]
}

const mockRepository: CatalogRepository = {
  async getCategories() {
    await delay(100)
    return categories
  },
  async getProducts(q = {}) {
    await delay()
    let list = [...products]
    if (q.categoryId) {
      const ids = descendantIds(categories, q.categoryId)
      list = list.filter((p) => ids.includes(p.categoryId))
    }
    if (q.search?.trim()) {
      const s = q.search.trim().toLowerCase()
      list = list.filter((p) => [p.title, p.sku, p.shortDescription].some((x) => x.toLowerCase().includes(s)))
    }
    if (q.inStockOnly) list = list.filter((p) => p.stock > 0)
    for (const [key, values] of Object.entries(q.attributes ?? {})) {
      if (values.length) list = list.filter((p) => values.includes(p.attributes[key]))
    }
    switch (q.sort) {
      case 'price-asc': list.sort((a, b) => a.price - b.price); break
      case 'price-desc': list.sort((a, b) => b.price - a.price); break
      case 'title': list.sort((a, b) => a.title.localeCompare(b.title, 'ru', { numeric: true })); break
    }
    return list
  },
  async getProductBySlug(slug) {
    await delay()
    return products.find((p) => p.slug === slug) ?? null
  },
  async getProductsByIds(ids) {
    return products.filter((p) => ids.includes(p.id))
  },
}

export const catalog: CatalogRepository = mockRepository
