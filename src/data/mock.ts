// ВНИМАНИЕ: все данные ниже — ТЕСТОВЫЕ заглушки. Реальный ассортимент, цены и остатки
// должен предоставить заказчик.
import type { Category, Product } from './types'

export const categories: Category[] = [
  { id: 'c1', slug: 'category-1', title: 'Тестовая категория 1', description: 'Описание тестовой категории.', parentId: null },
  { id: 'c1-1', slug: 'category-1-1', title: 'Подкатегория 1.1', parentId: 'c1' },
  { id: 'c1-2', slug: 'category-1-2', title: 'Подкатегория 1.2', parentId: 'c1' },
  { id: 'c2', slug: 'category-2', title: 'Тестовая категория 2', parentId: null },
  { id: 'c2-1', slug: 'category-2-1', title: 'Подкатегория 2.1', parentId: 'c2' },
  { id: 'c2-1-1', slug: 'category-2-1-1', title: 'Подкатегория 2.1.1', parentId: 'c2-1' },
  { id: 'c3', slug: 'category-3', title: 'Тестовая категория 3', parentId: null },
]

const colors = ['Синий', 'Белый', 'Чёрный']
const leaf = ['c1-1', 'c1-2', 'c2-1-1', 'c3']

export const products: Product[] = Array.from({ length: 16 }, (_, i) => {
  const n = i + 1
  const price = 500 + ((n * 373) % 4500)
  return {
    id: `p${n}`,
    sku: `TEST-${String(n).padStart(3, '0')}`,
    slug: `test-product-${n}`,
    title: `Тестовый товар ${n}`,
    shortDescription: 'Тестовое описание товара. Реальные данные будут предоставлены заказчиком.',
    categoryId: leaf[i % leaf.length],
    price,
    oldPrice: n % 4 === 0 ? Math.round(price * 1.2) : undefined,
    stock: n % 7 === 0 ? 0 : 3 + (n % 5),
    attributes: { Цвет: colors[i % colors.length] },
    variants:
      n === 1
        ? [
            { id: 'p1-a', title: 'Вариант A', sku: 'TEST-001-A' },
            { id: 'p1-b', title: 'Вариант B', sku: 'TEST-001-B' },
          ]
        : undefined,
    isTestData: true as const,
  }
})
