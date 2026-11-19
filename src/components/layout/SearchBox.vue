<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { queryProducts } from '@/data/catalog'
import { track } from '@/composables/analytics'
import { UiIcon } from '@/components/ui'

const route = useRoute()
const router = useRouter()
const q = ref('')
const open = ref(false)
const root = ref<HTMLElement>()

watch(() => route.query.q, (v) => { q.value = typeof v === 'string' ? v : '' }, { immediate: true })
watch(() => route.fullPath, () => { open.value = false })

const suggestions = computed(() => (q.value.trim().length >= 2 ? queryProducts({ search: q.value }).slice(0, 6) : []))

function submit() {
  const v = q.value.trim()
  open.value = false
  if (v) track('search', { length: v.length })
  router.push({ path: '/catalog', query: v ? { q: v } : {} })
}

function outside(e: MouseEvent) {
  if (root.value && !root.value.contains(e.target as Node)) open.value = false
}
onMounted(() => document.addEventListener('click', outside))
onBeforeUnmount(() => document.removeEventListener('click', outside))

const classes = {
  root: 'relative min-w-0 flex-1',
  form: 'flex',
  field: 'h-11 min-w-0 flex-1 rounded-l-xl border border-r-0 border-slate-300 bg-white px-3.5 text-base outline-none placeholder:text-slate-400 field-quiet',
  submit: 'inline-flex h-11 w-12 items-center justify-center rounded-r-xl bg-brand-600 text-white transition-colors hover:bg-brand-700',
  list: 'absolute left-0 right-0 top-full z-40 mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg',
  item: 'block truncate px-3.5 py-3 text-sm hover:bg-slate-50 focus:bg-slate-50',
  all: 'block border-t border-slate-100 px-3.5 py-3 text-sm font-medium text-brand-600 hover:bg-slate-50',
}
</script>

<template>
  <div ref="root" :class="classes.root">
    <form :class="classes.form" role="search" @submit.prevent="submit">
      <input
        v-model="q"
        type="search"
        name="q"
        autocomplete="off"
        placeholder="Поиск по каталогу"
        aria-label="Поиск по каталогу"
        :class="classes.field"
        @focus="open = true"
        @input="open = true"
        @keydown.esc="open = false"
      />
      <button type="submit" :class="classes.submit" aria-label="Найти"><UiIcon name="search" /></button>
    </form>
    <Transition name="fade">
      <ul v-if="open && suggestions.length" :class="classes.list" aria-label="Подсказки">
        <li v-for="p in suggestions" :key="p.id">
          <RouterLink :to="`/product/${p.slug}`" :class="classes.item">{{ p.title }}</RouterLink>
        </li>
        <li><RouterLink :to="{ path: '/catalog', query: { q: q.trim() } }" :class="classes.all">Показать все результаты</RouterLink></li>
      </ul>
    </Transition>
  </div>
</template>
