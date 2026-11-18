import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import type { Product } from '@/data/types'

export interface CartItem {
  key: string
  productId: string
  slug: string
  title: string
  sku: string
  price: number
  variantTitle?: string
  qty: number
}

const STORAGE_KEY = 'max-shop:cart:v1'

function load(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as CartItem[]) : []
  } catch {
    return []
  }
}

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>(load())

  watch(items, (v) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(v)) } catch { /* storage недоступен */ }
  }, { deep: true })

  const count = computed(() => items.value.reduce((s, i) => s + i.qty, 0))
  const subtotal = computed(() => items.value.reduce((s, i) => s + i.price * i.qty, 0))

  function add(product: Product, qty = 1, variantId?: string) {
    const variant = product.variants?.find((v) => v.id === variantId)
    const key = `${product.id}:${variant?.id ?? ''}`
    const existing = items.value.find((i) => i.key === key)
    const next = Math.min(99, (existing?.qty ?? 0) + qty)
    if (existing) existing.qty = next
    else
      items.value.push({
        key,
        productId: product.id,
        slug: product.slug,
        title: product.title,
        sku: variant?.sku ?? product.sku,
        price: variant?.price ?? product.price,
        variantTitle: variant?.title,
        qty: next,
      })
  }

  function setQty(key: string, qty: number) {
    const item = items.value.find((i) => i.key === key)
    if (item) item.qty = Math.min(99, Math.max(1, qty))
  }

  const remove = (key: string) => { items.value = items.value.filter((i) => i.key !== key) }
  const clear = () => { items.value = [] }

  return { items, count, subtotal, add, setQty, remove, clear }
})
