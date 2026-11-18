<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'

const cart = useCartStore()
const router = useRouter()
const query = ref('')

function search() {
  const q = query.value.trim()
  router.push({ path: '/catalog', query: q ? { q } : {} })
}

const classes = {
  banner: 'bg-amber-100 px-4 py-1 text-center text-xs text-amber-900',
  root: 'sticky top-0 z-30 border-b border-slate-200 bg-white',
  inner: 'mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3',
  logo: 'text-xl font-extrabold tracking-tight text-brand-600',
  catalog: 'inline-flex h-11 items-center rounded-xl bg-brand-50 px-4 font-semibold text-brand-600 hover:bg-brand-100',
  form: 'order-last flex min-w-0 basis-full gap-2 md:order-none md:basis-auto md:flex-1',
  field: 'h-11 min-w-0 flex-1 rounded-xl border border-slate-300 px-3.5 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100',
  submit: 'h-11 rounded-xl bg-brand-500 px-5 font-semibold text-white hover:bg-brand-600',
  nav: 'ml-auto flex items-center gap-1 md:ml-0',
  link: 'inline-flex h-11 items-center rounded-xl px-3 text-slate-700 hover:bg-slate-100',
  cartBadge: 'ml-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-brand-500 px-1.5 text-xs font-bold text-white',
}
</script>

<template>
  <div :class="classes.banner">Демо-версия: каталог, цены и расчёт доставки — тестовые данные</div>
  <header :class="classes.root">
    <div :class="classes.inner">
      <RouterLink to="/" :class="classes.logo">Магазин Макса</RouterLink>
      <RouterLink to="/catalog" :class="classes.catalog">Каталог</RouterLink>
      <form :class="classes.form" role="search" @submit.prevent="search">
        <input v-model="query" type="search" placeholder="Поиск по каталогу" aria-label="Поиск по каталогу" :class="classes.field" />
        <button type="submit" :class="classes.submit">Найти</button>
      </form>
      <nav :class="classes.nav" aria-label="Основное меню">
        <RouterLink to="/delivery" :class="[classes.link, 'hidden lg:inline-flex']">Доставка и оплата</RouterLink>
        <RouterLink to="/cart" :class="classes.link">
          Корзина
          <span v-if="cart.count" :class="classes.cartBadge">{{ cart.count }}</span>
        </RouterLink>
      </nav>
    </div>
  </header>
</template>
