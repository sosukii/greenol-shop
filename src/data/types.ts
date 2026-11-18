export interface Brand { id: string; title: string }

export interface Category {
  id: string
  slug: string
  title: string
  parentId: string | null
}

/** Торговое предложение: фасовка/объём со своим артикулом и ценой */
export interface Offer {
  sku: string
  /** Например «1л», «5л»; null — у товара одно предложение */
  label: string | null
  price: number
  inStock: boolean
}

export interface DescBlock { t: 'p' | 'h' | 'li'; text: string }

export interface Product {
  id: string
  slug: string
  title: string
  brand: string
  categoryIds: string[]
  summary: string
  description: DescBlock[]
  /** id изображений в /img/p/{id}-{width}.webp */
  images: string[]
  offers: Offer[]
  hit: boolean
  isNew: boolean
}

export type SortKey = 'default' | 'price-asc' | 'price-desc' | 'title'

export interface ProductQuery {
  categoryId?: string
  search?: string
  inStockOnly?: boolean
  brands?: string[]
  priceMin?: number
  priceMax?: number
  sort?: SortKey
}
