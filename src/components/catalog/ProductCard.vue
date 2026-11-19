<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { RouterLink } from 'vue-router'
import type { Product } from '@/data/types'
import { availabilityLabel, getBrand, hasRange, isAvailable, isPurchasable, minPrice, priced } from '@/data/catalog'
import { formatPrice } from '@/utils/format'
import { useCartStore } from '@/stores/cart'
import { ecommerce, track } from '@/composables/analytics'
import { toast } from '@/composables/useToast'
import { UiBadge, UiButton, UiIcon } from '@/components/ui'
import ProductImage from './ProductImage.vue'

const props = defineProps<{ product: Product; priority?: boolean }>()
const cart = useCartStore()
const added = ref(false)
let timer: ReturnType<typeof setTimeout>

const href = computed(() => `/product/${props.product.slug}`)
const single = computed(() => props.product.offers.length === 1 && isPurchasable(props.product))

function add() {
  const offer = priced(props.product)[0]
  cart.add(props.product, offer)
  track('add_to_cart', { id: offer.sku })
  ecommerce('add', [{ id: offer.sku, name: props.product.title, price: offer.price, quantity: 1, brand: props.product.brand }])
  toast(`«${props.product.title}» в корзине`, 'success', '/cart')
  added.value = true
  clearTimeout(timer)
  timer = setTimeout(() => (added.value = false), 1600)
}
onBeforeUnmount(() => clearTimeout(timer))

const classes = {
  root: 'group relative flex h-full flex-col gap-2.5 rounded-2xl border border-slate-200 bg-white p-3 transition-colors duration-150 hover:border-slate-300',
  title: 'line-clamp-3 min-h-[3.75rem] text-sm font-medium leading-5 text-slate-900 after:absolute after:inset-0 hover:text-brand-600 sm:text-base sm:leading-5',
  brand: 'text-xs text-slate-500',
  meta: 'flex items-center gap-1.5 text-xs',
  footer: 'relative z-10 mt-auto flex flex-col gap-2.5 pt-1',
  price: 'text-lg font-bold leading-6',
  from: 'mr-1 text-sm font-normal text-slate-500',
  request: 'text-sm font-medium text-slate-600',
}
</script>

<template>
  <article :class="classes.root">
    <ProductImage :id="product.images[0]" :alt="product.title" :priority="priority" />
    <p :class="classes.brand">{{ getBrand(product.brand)?.title }}</p>
    <h3>
      <RouterLink :to="href" :class="classes.title">{{ product.title }}</RouterLink>
    </h3>
    <div :class="classes.meta">
      <UiBadge :tone="isAvailable(product) ? 'success' : 'neutral'">{{ availabilityLabel({ inStock: isAvailable(product) }) }}</UiBadge>
    </div>
    <div :class="classes.footer">
      <p v-if="isPurchasable(product)" :class="classes.price">
        <span v-if="hasRange(product)" :class="classes.from">от</span>{{ formatPrice(minPrice(product)) }}
      </p>
      <p v-else :class="classes.request">Цена по запросу</p>
      <UiButton v-if="single" block size="sm" :variant="added ? 'secondary' : 'primary'" :aria-label="`В корзину: ${product.title}`" @click="add">
        <UiIcon :name="added ? 'check' : 'cart'" :size="18" />{{ added ? 'Добавлено' : 'В корзину' }}
      </UiButton>
      <UiButton v-else :to="href" variant="secondary" block>{{ isPurchasable(product) ? 'Выбрать' : 'Подробнее' }}</UiButton>
    </div>
  </article>
</template>
