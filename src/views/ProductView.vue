<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { catalog } from '@/data/repository'
import type { Product } from '@/data/types'
import { categoryPath, useCategories } from '@/composables'
import { formatPrice } from '@/utils/format'
import { useCartStore } from '@/stores/cart'
import ProductImage from '@/components/catalog/ProductImage.vue'
import { UiAlert, UiBadge, UiBreadcrumbs, UiButton, UiEmptyState, UiQuantity, UiSelect, UiSkeleton } from '@/components/ui'

const route = useRoute()
const cart = useCartStore()
const { categories } = useCategories()

const product = ref<Product | null>(null)
const loading = ref(true)
const qty = ref(1)
const variantId = ref('')
const added = ref(false)

watch(() => route.params.slug, async (slug) => {
  loading.value = true
  added.value = false
  product.value = await catalog.getProductBySlug(slug as string)
  variantId.value = product.value?.variants?.[0]?.id ?? ''
  qty.value = 1
  loading.value = false
}, { immediate: true })

const variant = computed(() => product.value?.variants?.find((v) => v.id === variantId.value))
const price = computed(() => variant.value?.price ?? product.value?.price ?? 0)
const sku = computed(() => variant.value?.sku ?? product.value?.sku)
const crumbs = computed(() => [
  { label: 'Главная', to: '/' },
  { label: 'Каталог', to: '/catalog' },
  ...(product.value ? categoryPath(categories.value, product.value.categoryId).map((c) => ({ label: c.title, to: `/catalog/${c.slug}` })) : []),
  { label: product.value?.title ?? '' },
])

function add() {
  if (!product.value) return
  cart.add(product.value, qty.value, variantId.value || undefined)
  added.value = true
}

const classes = {
  layout: 'grid gap-8 md:grid-cols-2',
  title: 'mb-2 text-2xl font-bold sm:text-3xl',
  meta: 'mb-4 flex flex-wrap items-center gap-2 text-sm text-slate-500',
  prices: 'mb-4 flex items-baseline gap-3',
  price: 'text-3xl font-bold',
  old: 'text-lg text-slate-400 line-through',
  buy: 'my-5 flex flex-wrap items-center gap-3',
  section: 'mt-8',
  h2: 'mb-3 text-lg font-semibold',
  dl: 'grid max-w-md grid-cols-2 gap-y-2 text-sm',
  dt: 'text-slate-500',
}
</script>

<template>
  <div v-if="loading" :class="classes.layout"><UiSkeleton class="aspect-square" /><UiSkeleton class="h-72" /></div>
  <UiEmptyState v-else-if="!product" title="Товар не найден" text="Возможно, он снят с продажи или ссылка неверна.">
    <UiButton to="/catalog">В каталог</UiButton>
  </UiEmptyState>
  <template v-else>
    <UiBreadcrumbs :items="crumbs" />
    <div :class="classes.layout">
      <ProductImage />
      <div>
        <h1 :class="classes.title">{{ product.title }}</h1>
        <div :class="classes.meta">
          <span>Артикул: {{ sku }}</span>
          <UiBadge :tone="product.stock ? 'success' : 'neutral'">{{ product.stock ? 'В наличии' : 'Нет в наличии' }}</UiBadge>
          <UiBadge tone="warning">Тестовые данные</UiBadge>
        </div>
        <div :class="classes.prices">
          <span :class="classes.price">{{ formatPrice(price) }}</span>
          <span v-if="product.oldPrice" :class="classes.old">{{ formatPrice(product.oldPrice) }}</span>
        </div>
        <p>{{ product.shortDescription }}</p>
        <div v-if="product.variants" class="mt-4 max-w-xs">
          <UiSelect v-model="variantId" label="Вариант" :options="product.variants.map((v) => ({ value: v.id, label: v.title }))" />
        </div>
        <div :class="classes.buy">
          <UiQuantity v-model="qty" :max="Math.max(1, product.stock)" />
          <UiButton size="lg" :disabled="!product.stock" @click="add">В корзину</UiButton>
        </div>
        <UiAlert v-if="added" tone="success">
          Добавлено в корзину. <RouterLink to="/cart" class="font-semibold underline">Перейти в корзину</RouterLink>
        </UiAlert>
        <UiAlert v-if="!product.stock" tone="warning">Товар временно недоступен.</UiAlert>
        <section :class="classes.section">
          <h2 :class="classes.h2">Характеристики</h2>
          <dl :class="classes.dl">
            <template v-for="(v, k) in product.attributes" :key="k">
              <dt :class="classes.dt">{{ k }}</dt><dd>{{ v }}</dd>
            </template>
          </dl>
        </section>
        <section :class="classes.section">
          <h2 :class="classes.h2">Доставка</h2>
          <p class="text-sm text-slate-600">Стоимость и сроки рассчитываются при оформлении заказа.</p>
        </section>
      </div>
    </div>
  </template>
</template>
