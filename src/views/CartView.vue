<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { formatPrice } from '@/utils/format'
import { UiBreadcrumbs, UiButton, UiEmptyState, UiQuantity } from '@/components/ui'

const cart = useCartStore()

const classes = {
  title: 'mb-4 text-2xl font-bold sm:text-3xl',
  layout: 'grid gap-6 lg:grid-cols-[1fr_20rem]',
  list: 'flex flex-col gap-3',
  row: 'flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4',
  name: 'min-w-0 flex-1 font-medium hover:text-brand-600',
  sub: 'text-sm text-slate-500',
  sum: 'w-28 text-right font-bold',
  remove: 'text-sm text-slate-500 hover:text-red-600',
  summary: 'flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 lg:self-start',
  line: 'flex justify-between',
  total: 'flex justify-between text-xl font-bold',
  note: 'text-sm text-slate-500',
}
</script>

<template>
  <UiBreadcrumbs :items="[{ label: 'Главная', to: '/' }, { label: 'Корзина' }]" />
  <h1 :class="classes.title">Корзина</h1>
  <UiEmptyState v-if="!cart.items.length" title="В корзине пока пусто" text="Добавьте товары из каталога.">
    <UiButton to="/catalog">Перейти в каталог</UiButton>
  </UiEmptyState>
  <div v-else :class="classes.layout">
    <ul :class="classes.list">
      <li v-for="item in cart.items" :key="item.key" :class="classes.row">
        <div class="min-w-0 flex-1">
          <RouterLink :to="`/product/${item.slug}`" :class="classes.name">{{ item.title }}</RouterLink>
          <p :class="classes.sub">
            {{ item.variantTitle ? item.variantTitle + ' · ' : '' }}Арт. {{ item.sku }} · {{ formatPrice(item.price) }} за шт.
          </p>
        </div>
        <UiQuantity :model-value="item.qty" @update:model-value="cart.setQty(item.key, $event)" />
        <span :class="classes.sum">{{ formatPrice(item.price * item.qty) }}</span>
        <button type="button" :class="classes.remove" @click="cart.remove(item.key)">Удалить</button>
      </li>
    </ul>
    <aside :class="classes.summary">
      <div :class="classes.line"><span>Товары ({{ cart.count }})</span><span>{{ formatPrice(cart.subtotal) }}</span></div>
      <p :class="classes.note">Доставка рассчитывается при оформлении.</p>
      <div :class="classes.total"><span>Итого</span><span>{{ formatPrice(cart.subtotal) }}</span></div>
      <UiButton to="/checkout" size="lg" block>Оформить заказ</UiButton>
    </aside>
  </div>
</template>
