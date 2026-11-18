<script setup lang="ts">
import { RouterLink } from 'vue-router'
import type { Product } from '@/data/types'
import { formatPrice } from '@/utils/format'
import { useCartStore } from '@/stores/cart'
import { UiBadge, UiButton } from '@/components/ui'
import ProductImage from './ProductImage.vue'

const props = defineProps<{ product: Product }>()
const cart = useCartStore()

const classes = {
  root: 'flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 transition-shadow hover:shadow-md',
  title: 'line-clamp-2 font-medium hover:text-brand-600',
  prices: 'flex items-baseline gap-2',
  price: 'text-lg font-bold',
  old: 'text-sm text-slate-400 line-through',
  footer: 'mt-auto flex flex-col gap-2',
}

function add() {
  // У товара с вариантами нужно выбрать вариант на странице товара.
  cart.add(props.product)
}
</script>

<template>
  <article :class="classes.root">
    <RouterLink :to="`/product/${product.slug}`" aria-label="Открыть товар"><ProductImage /></RouterLink>
    <div>
      <UiBadge v-if="product.stock === 0" tone="neutral">Нет в наличии</UiBadge>
      <UiBadge v-else tone="success">В наличии</UiBadge>
    </div>
    <RouterLink :to="`/product/${product.slug}`" :class="classes.title">{{ product.title }}</RouterLink>
    <div :class="classes.footer">
      <div :class="classes.prices">
        <span :class="classes.price">{{ formatPrice(product.price) }}</span>
        <span v-if="product.oldPrice" :class="classes.old">{{ formatPrice(product.oldPrice) }}</span>
      </div>
      <UiButton v-if="product.variants" :to="`/product/${product.slug}`" variant="secondary" block>Выбрать вариант</UiButton>
      <UiButton v-else :disabled="product.stock === 0" block @click="add">В корзину</UiButton>
    </div>
  </article>
</template>
