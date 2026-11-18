<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { UiIcon } from '@/components/ui'
import type { IconName } from '@/components/ui/UiIcon.vue'

const cart = useCartStore()
const items: { to: string; label: string; icon: IconName }[] = [
  { to: '/', label: 'Главная', icon: 'home' },
  { to: '/catalog', label: 'Каталог', icon: 'grid' },
  { to: '/cart', label: 'Корзина', icon: 'cart' },
  { to: '/contacts', label: 'Контакты', icon: 'phone' },
]

const classes = {
  root: 'fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden',
  list: 'mx-auto grid max-w-md grid-cols-4',
  link: 'relative flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-slate-600',
  active: 'text-brand-600',
  badge: 'absolute right-[calc(50%-1.5rem)] top-1.5 inline-flex min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold leading-4 text-white animate-pop',
}
</script>

<template>
  <nav :class="classes.root" aria-label="Быстрая навигация">
    <ul :class="classes.list">
      <li v-for="i in items" :key="i.to">
        <RouterLink :to="i.to" :class="classes.link" :active-class="classes.active" :exact-active-class="classes.active">
          <UiIcon :name="i.icon" :size="22" />{{ i.label }}
          <span v-if="i.to === '/cart' && cart.count" :key="cart.bump" :class="classes.badge">{{ cart.count }}</span>
        </RouterLink>
      </li>
    </ul>
  </nav>
</template>
