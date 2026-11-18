export interface Category {
  id: string
  slug: string
  title: string
  description?: string
  parentId: string | null
}

export interface ProductVariant {
  id: string
  title: string
  sku: string
  price?: number
}

export interface Product {
  id: string
  sku: string
  slug: string
  title: string
  shortDescription: string
  categoryId: string
  price: number
  oldPrice?: number
  /** Остаток; 0 — нет в наличии */
  stock: number
  attributes: Record<string, string>
  variants?: ProductVariant[]
  /** Данные тестовые (не реальный ассортимент) */
  isTestData: true
}

export type SortKey = 'popular' | 'price-asc' | 'price-desc' | 'title'

export interface ProductQuery {
  categoryId?: string
  search?: string
  inStockOnly?: boolean
  attributes?: Record<string, string[]>
  sort?: SortKey
}
