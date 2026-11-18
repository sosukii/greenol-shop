<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { childCategories } from '@/data/catalog'
import { UiIcon } from '@/components/ui'

const open = ref(false)
const root = ref<HTMLElement>()
const route = useRoute()
const top = childCategories(null)

watch(() => route.fullPath, () => { open.value = false })
const outside = (e: MouseEvent) => { if (root.value && !root.value.contains(e.target as Node)) open.value = false }
onMounted(() => document.addEventListener('click', outside))
onBeforeUnmount(() => document.removeEventListener('click', outside))

const classes = {
  root: 'relative',
  btn: 'inline-flex h-11 items-center gap-2 rounded-xl bg-brand-600 px-4 font-semibold text-white transition-colors hover:bg-brand-700',
  panel: 'absolute left-0 top-full z-40 mt-2 grid w-[min(44rem,90vw)] grid-cols-2 gap-x-6 gap-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xl',
  group: 'flex flex-col gap-1',
  head: 'py-1 font-semibold text-slate-900 hover:text-brand-600',
  sub: 'py-1 text-sm text-slate-600 hover:text-brand-600',
  all: 'col-span-2 border-t border-slate-100 pt-3 text-sm font-medium text-brand-600',
}
</script>

<template>
  <div ref="root" :class="classes.root" @keydown.esc="open = false">
    <button type="button" :class="classes.btn" :aria-expanded="open" aria-haspopup="true" @click="open = !open">
      <UiIcon :name="open ? 'close' : 'grid'" />Каталог
    </button>
    <Transition name="fade">
      <div v-if="open" :class="classes.panel">
        <div v-for="c in top" :key="c.id" :class="classes.group">
          <RouterLink :to="`/catalog/${c.slug}`" :class="classes.head">{{ c.title }}</RouterLink>
          <RouterLink v-for="s in childCategories(c.id)" :key="s.id" :to="`/catalog/${s.slug}`" :class="classes.sub">{{ s.title }}</RouterLink>
        </div>
        <RouterLink to="/catalog" :class="classes.all">Все товары</RouterLink>
      </div>
    </Transition>
  </div>
</template>
