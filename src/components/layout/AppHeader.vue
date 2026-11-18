<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { site } from '@/config/site'
import { asset } from '@/utils/format'
import { useCartStore } from '@/stores/cart'
import { UiIcon } from '@/components/ui'
import SearchBox from './SearchBox.vue'
import CategoryMenu from './CategoryMenu.vue'

const cart = useCartStore()

const classes = {
  top: 'hidden border-b border-slate-200 bg-white text-sm text-slate-600 md:block',
  topInner: 'mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-1.5',
  topLinks: 'flex items-center gap-5',
  link: 'inline-flex min-h-8 items-center hover:text-brand-600',
  root: 'z-30 border-b border-slate-200 bg-white md:sticky md:top-0',
  inner: 'mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2.5 px-4 py-3',
  logo: 'inline-flex shrink-0 items-center',
  logoImg: 'h-8 w-auto sm:h-9',
  catalog: 'hidden md:block',
  search: 'order-last basis-full md:order-none md:basis-auto md:flex-1',
  phoneBtn: 'ml-auto inline-flex size-11 items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100 md:hidden',
  cart: 'relative hidden h-11 items-center gap-2 rounded-xl px-3 font-medium text-slate-800 hover:bg-slate-100 md:inline-flex',
  badge: 'absolute -right-0.5 -top-0.5 inline-flex min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-xs font-bold leading-5 text-white animate-pop',
}
</script>

<template>
  <div :class="classes.top">
    <div :class="classes.topInner">
      <a :href="`tel:${site.contacts.phoneRaw}`" :class="classes.link">{{ site.contacts.phone }} <span class="text-slate-400">· {{ site.contacts.hours[0] }}</span></a>
      <nav :class="classes.topLinks" aria-label="Информация">
        <RouterLink to="/about" :class="classes.link">О магазине</RouterLink>
        <RouterLink to="/delivery" :class="classes.link">Доставка и оплата</RouterLink>
        <RouterLink to="/contacts" :class="classes.link">Контакты</RouterLink>
      </nav>
    </div>
  </div>
  <header :class="classes.root">
    <div :class="classes.inner">
      <RouterLink to="/" :class="classes.logo" aria-label="Greenol — на главную">
        <img :src="asset('img/logo.webp')" width="444" height="88" :class="classes.logoImg" alt="Greenol" fetchpriority="high" />
      </RouterLink>
      <div :class="classes.catalog"><CategoryMenu /></div>
      <div :class="classes.search"><SearchBox /></div>
      <a :href="`tel:${site.contacts.phoneRaw}`" :class="classes.phoneBtn" aria-label="Позвонить"><UiIcon name="phone" /></a>
      <RouterLink to="/cart" :class="classes.cart" :aria-label="`Корзина, товаров: ${cart.count}`">
        <UiIcon name="cart" />Корзина
        <span v-if="cart.count" :key="cart.bump" :class="classes.badge">{{ cart.count }}</span>
      </RouterLink>
    </div>
  </header>
</template>
