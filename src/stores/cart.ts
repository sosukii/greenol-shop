import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { MAX_QTY } from '@/core/orders'
import { getOfferBySku } from '@/data/catalog'
import type { Offer, Product } from '@/data/types'

export interface CartItem {
  sku: string
  productId: string
  slug: string
  title: string
  label: string | null
  price: number
  image?: string
  qty: number
}

const KEY = 'greenol:cart:v2'

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([])
  /** false при SSR/до гидратации — чтобы не показывать «пустую корзину» на долю секунды */
  const ready = ref(false)
  const bump = ref(0)

  /** Загрузка из localStorage + сверка с каталогом (актуальные цены, удалённые товары) */
  function hydrate() {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) ?? '[]') as CartItem[]
      items.value = saved.flatMap((i) => {
        const f = getOfferBySku(i.sku)
        if (!f || f.offer.price <= 0) return []
        return [{ ...i, title: f.product.title, label: f.offer.label, price: f.offer.price, slug: f.product.slug, image: f.product.images[0], qty: Math.min(MAX_QTY, Math.max(1, i.qty)) }]
      })
    } catch {
      items.value = []
    }
    ready.value = true
    watch(items, (v) => {
      try { localStorage.setItem(KEY, JSON.stringify(v)) } catch { /* storage недоступен */ }
    }, { deep: true })
  }

  const count = computed(() => items.value.reduce((s, i) => s + i.qty, 0))
  const subtotal = computed(() => items.value.reduce((s, i) => s + i.price * i.qty, 0))

  function add(product: Product, offer: Offer, qty = 1) {
    const ex = items.value.find((i) => i.sku === offer.sku)
    if (ex) ex.qty = Math.min(MAX_QTY, ex.qty + qty)
    else
      items.value.push({ sku: offer.sku, productId: product.id, slug: product.slug, title: product.title, label: offer.label, price: offer.price, image: product.images[0], qty: Math.min(MAX_QTY, qty) })
    bump.value++
  }
  function setQty(sku: string, qty: number) {
    const i = items.value.find((x) => x.sku === sku)
    if (i) i.qty = Math.min(MAX_QTY, Math.max(1, Math.floor(qty) || 1))
  }
  const remove = (sku: string) => { items.value = items.value.filter((i) => i.sku !== sku) }
  const clear = () => { items.value = [] }

  return { items, ready, bump, count, subtotal, hydrate, add, setQty, remove, clear }
})
