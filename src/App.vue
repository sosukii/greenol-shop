<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { useHead } from '@unhead/vue'
import { site } from '@/config/site'
import { asset } from '@/utils/format'
import { useCartStore } from '@/stores/cart'
import { organizationLd } from '@/composables/useSeo'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import BottomNav from '@/components/layout/BottomNav.vue'
import AppToasts from '@/components/layout/AppToasts.vue'

const route = useRoute()
const cart = useCartStore()
onMounted(() => cart.hydrate())

useHead({
  htmlAttrs: { lang: 'ru' },
  titleTemplate: (t) => (t && !t.includes(site.name) ? `${t} — ${site.name}` : t || site.name),
  meta: [{ name: 'theme-color', content: '#1d4ed8' }, { name: 'format-detection', content: 'telephone=no' }],
  link: [{ rel: 'icon', type: 'image/png', href: asset('favicon.png') }],
  script: [{ key: 'ld-org', type: 'application/ld+json', innerHTML: JSON.stringify(organizationLd()) }],
})

const classes = {
  page: 'flex min-h-dvh flex-col',
  skip: 'sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow-lg',
  main: 'mx-auto w-full max-w-6xl flex-1 px-4 py-6 outline-none',
}
</script>

<template>
  <template v-if="route.path.startsWith('/admin')">
    <RouterView />
  </template>
  <div v-else :class="classes.page">
    <a href="#main" :class="classes.skip">Перейти к содержимому</a>
    <AppHeader />
    <main id="main" :class="classes.main" tabindex="-1">
      <RouterView v-slot="{ Component }">
        <Transition name="page" mode="out-in"><component :is="Component" /></Transition>
      </RouterView>
    </main>
    <AppFooter />
    <BottomNav />
    <AppToasts />
  </div>
</template>
