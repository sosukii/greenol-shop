<script setup lang="ts">
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { useHead } from '@unhead/vue'
import { api } from '@/api'
import { asset } from '@/utils/format'
import { UiButton } from '@/components/ui'

useHead({ title: 'Админка — Greenol', meta: [{ name: 'robots', content: 'noindex, nofollow' }] })
const router = useRouter()
async function logout() {
  await api.admin.logout()
  router.push('/admin/login')
}

const links = [
  { to: '/admin/orders', label: 'Заказы' },
  { to: '/admin/leads', label: 'Лиды' },
  { to: '/admin/analytics', label: 'Аналитика' },
]
const classes = {
  root: 'min-h-dvh bg-slate-50',
  bar: 'sticky top-0 z-20 border-b border-slate-200 bg-white',
  inner: 'mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2.5',
  logo: 'flex shrink-0 items-center gap-2 font-semibold',
  nav: 'flex flex-1 gap-1 overflow-x-auto',
  link: 'inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-slate-600 hover:bg-slate-100',
  active: '!bg-brand-50 !text-brand-700',
  main: 'mx-auto max-w-7xl px-4 py-6',
  note: 'bg-amber-50 px-4 py-2 text-center text-xs text-amber-900',
}
</script>

<template>
  <div :class="classes.root">
    <div v-if="api.mode === 'local'" :class="classes.note">
      Админка работает в локальном режиме: заказы и заявки хранятся только в этом браузере. Для общего доступа подключите бэкенд (см. README).
    </div>
    <header :class="classes.bar">
      <div :class="classes.inner">
        <RouterLink to="/admin/orders" :class="classes.logo"><img :src="asset('img/logo.webp')" width="444" height="88" class="h-6 w-auto" alt="Greenol" /><span class="text-slate-500">Админка</span></RouterLink>
        <nav :class="classes.nav" aria-label="Разделы админки">
          <RouterLink v-for="l in links" :key="l.to" :to="l.to" :class="classes.link" :active-class="classes.active">{{ l.label }}</RouterLink>
        </nav>
        <UiButton to="/" variant="ghost" size="sm">На сайт</UiButton>
        <UiButton variant="outline" size="sm" @click="logout">Выйти</UiButton>
      </div>
    </header>
    <main :class="classes.main"><RouterView /></main>
  </div>
</template>
