<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { formatPrice, plural } from '@/utils/format'
import { useSeo } from '@/composables/useSeo'
import { ecommerce, track } from '@/composables/analytics'
import ProductImage from '@/components/catalog/ProductImage.vue'
import { UiBreadcrumbs, UiButton, UiEmptyState, UiIcon, UiQuantity, UiSkeleton } from '@/components/ui'

useSeo({ title: 'Корзина — Greenol', description: 'Ваша корзина в интернет-магазине Greenol.', path: '/cart', noindex: true })
const cart = useCartStore()
onMounted(() => { if (cart.items.length) track('view_cart', { items: cart.count }) })

function remove(sku: string) {
  const i = cart.items.find((x) => x.sku === sku)
  if (i) ecommerce('remove', [{ id: i.sku, name: i.title, price: i.price, quantity: i.qty }])
  cart.remove(sku)
}

const classes = {
  title: 'mb-5 text-2xl font-bold sm:text-3xl',
  layout: 'grid gap-6 lg:grid-cols-[1fr_22rem]',
  list: 'flex flex-col gap-3',
  row: 'grid grid-cols-[4.5rem_1fr] items-center gap-x-4 gap-y-3 rounded-2xl border border-slate-200 bg-white p-3 sm:grid-cols-[5.5rem_1fr_auto_auto] sm:p-4',
  name: 'font-medium leading-5 hover:text-brand-600',
  sub: 'mt-1 text-sm text-slate-500',
  controls: 'col-span-2 flex items-center justify-between gap-3 sm:col-span-1 sm:justify-start',
  sum: 'text-lg font-bold sm:w-28 sm:text-right',
  remove: 'inline-flex size-11 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600',
  summary: 'flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 lg:sticky lg:top-24 lg:self-start',
  line: 'flex justify-between gap-4',
  total: 'flex justify-between border-t border-slate-200 pt-3 text-xl font-bold',
  note: 'text-sm text-slate-500',
}
</script>

<template>
  <UiBreadcrumbs :items="[{ label: 'Главная', to: '/' }, { label: 'Корзина' }]" />
  <h1 :class="classes.title">Корзина</h1>
  <div v-if="!cart.ready" :class="classes.layout"><UiSkeleton class="h-32" /><UiSkeleton class="h-48" /></div>
  <UiEmptyState v-else-if="!cart.items.length" title="В корзине пока пусто" text="Выберите товары в каталоге — они появятся здесь.">
    <UiButton to="/catalog">Перейти в каталог</UiButton>
  </UiEmptyState>
  <div v-else :class="classes.layout">
    <ul :class="classes.list">
      <li v-for="item in cart.items" :key="item.sku" :class="classes.row">
        <RouterLink :to="`/product/${item.slug}`" tabindex="-1" aria-hidden="true"><ProductImage :id="item.image" :alt="item.title" sizes="96px" /></RouterLink>
        <div class="min-w-0">
          <RouterLink :to="`/product/${item.slug}`" :class="classes.name">{{ item.title }}</RouterLink>
          <p :class="classes.sub">{{ item.label ? item.label + ' · ' : '' }}Арт. {{ item.sku }} · {{ formatPrice(item.price) }} за шт.</p>
        </div>
        <div :class="classes.controls">
          <UiQuantity :model-value="item.qty" @update:model-value="cart.setQty(item.sku, $event)" />
          <span :class="[classes.sum, 'sm:hidden']">{{ formatPrice(item.price * item.qty) }}</span>
        </div>
        <div class="hidden items-center gap-1 sm:flex">
          <span :class="classes.sum">{{ formatPrice(item.price * item.qty) }}</span>
          <button type="button" :class="classes.remove" :aria-label="`Удалить: ${item.title}`" @click="remove(item.sku)"><UiIcon name="trash" /></button>
        </div>
        <button type="button" class="col-span-2 text-left text-sm text-slate-500 hover:text-red-600 sm:hidden" @click="remove(item.sku)">Удалить</button>
      </li>
    </ul>
    <aside :class="classes.summary" aria-label="Итого">
      <div :class="classes.line"><span>{{ cart.count }} {{ plural(cart.count, 'товар', 'товара', 'товаров') }}</span><span>{{ formatPrice(cart.subtotal) }}</span></div>
      <p :class="classes.note">Стоимость доставки рассчитывается при оформлении заказа.</p>
      <div :class="classes.total"><span>Итого</span><span>{{ formatPrice(cart.subtotal) }}</span></div>
      <UiButton to="/checkout" size="lg" block>Оформить заказ</UiButton>
    </aside>
  </div>
</template>
