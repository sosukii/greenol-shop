<script setup lang="ts">
// Меню каталога в два уровня, как у крупных маркетплейсов: слева разделы, справа содержимое выбранного.
// Раздел → подгруппы (жирным) → пункты (серым). Если у раздела нет вложенных категорий — показываем товары.
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { childCategories, descendantIds, products } from '@/data/catalog'
import { UiIcon } from '@/components/ui'

const open = ref(false)
const root = ref<HTMLElement>()
const route = useRoute()
const top = childCategories(null)
const activeId = ref(top[0]?.id ?? '')

const count = (id: string) => {
  const ids = descendantIds(id)
  return products.filter((p) => p.categoryIds.some((c) => ids.includes(c))).length
}
const counts = new Map(top.map((c) => [c.id, count(c.id)]))
const active = computed(() => top.find((c) => c.id === activeId.value) ?? top[0])
const groups = computed(() => (active.value ? childCategories(active.value.id).map((g) => ({ ...g, items: childCategories(g.id) })) : []))
const popular = computed(() => {
  if (!active.value || groups.value.length) return []
  const ids = descendantIds(active.value.id)
  return products.filter((p) => p.categoryIds.some((c) => ids.includes(c))).slice(0, 6)
})

watch(() => route.fullPath, () => { open.value = false })
watch(open, (v) => { if (v) activeId.value = top[0]?.id ?? '' })
const outside = (e: MouseEvent) => { if (root.value && !root.value.contains(e.target as Node)) open.value = false }
onMounted(() => document.addEventListener('click', outside))
onBeforeUnmount(() => document.removeEventListener('click', outside))

const classes = {
  root: 'relative',
  btn: 'inline-flex h-11 items-center gap-2 rounded-xl bg-brand-600 px-4 font-semibold text-white transition-colors hover:bg-brand-700',
  panel: 'absolute left-0 top-full z-40 mt-2 grid w-[min(56rem,calc(100vw-15rem))] grid-cols-[15rem_1fr] lg:grid-cols-[17rem_1fr] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl',
  rail: 'flex flex-col gap-0.5 border-r border-slate-100 bg-slate-50 p-3',
  railItem: (on: boolean) => [
    'flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-[15px]',
    on ? 'bg-brand-50 font-semibold text-brand-700' : 'text-slate-800 hover:bg-white',
  ],
  railCount: 'text-xs font-normal text-slate-400',
  railAll: 'mt-2 border-t border-slate-200 px-3 pt-3 text-sm font-medium text-brand-600 hover:text-brand-700',
  body: 'min-h-72 p-6',
  titleRow: 'mb-5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1',
  title: 'text-2xl font-bold text-slate-900 hover:text-brand-600',
  more: 'text-sm font-medium text-brand-600 hover:text-brand-700',
  cols: 'grid grid-cols-1 gap-x-8 gap-y-6 lg:grid-cols-2',
  colHead: 'block py-1 font-semibold text-slate-900 hover:text-brand-600',
  colItem: 'block py-1 text-sm text-slate-600 hover:text-brand-600',
  label: 'mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400',
  empty: 'text-sm text-slate-500',
}
</script>

<template>
  <div ref="root" :class="classes.root" @keydown.esc="open = false">
    <button type="button" :class="classes.btn" :aria-expanded="open" aria-haspopup="true" @click="open = !open">
      <UiIcon :name="open ? 'close' : 'grid'" />Каталог
    </button>
    <Transition name="fade">
      <div v-if="open && active" :class="classes.panel">
        <nav :class="classes.rail" aria-label="Разделы каталога">
          <RouterLink
            v-for="c in top"
            :key="c.id"
            :to="`/catalog/${c.slug}`"
            :class="classes.railItem(c.id === active.id)"
            @mouseenter="activeId = c.id"
            @focus="activeId = c.id"
          >
            <span>{{ c.title }}</span>
            <span :class="classes.railCount">{{ counts.get(c.id) }}</span>
          </RouterLink>
          <RouterLink to="/catalog" :class="classes.railAll">Все товары →</RouterLink>
        </nav>

        <div :class="classes.body">
          <div :class="classes.titleRow">
            <RouterLink :to="`/catalog/${active.slug}`" :class="classes.title">{{ active.title }}</RouterLink>
            <RouterLink :to="`/catalog/${active.slug}`" :class="classes.more">Смотреть все ({{ counts.get(active.id) }}) →</RouterLink>
          </div>

          <div v-if="groups.length" :class="classes.cols">
            <div v-for="g in groups" :key="g.id">
              <RouterLink :to="`/catalog/${g.slug}`" :class="classes.colHead">{{ g.title }}</RouterLink>
              <RouterLink v-for="s in g.items" :key="s.id" :to="`/catalog/${s.slug}`" :class="classes.colItem">{{ s.title }}</RouterLink>
            </div>
          </div>
          <div v-else-if="popular.length">
            <p :class="classes.label">Товары раздела</p>
            <RouterLink v-for="p in popular" :key="p.id" :to="`/product/${p.slug}`" :class="classes.colItem">{{ p.title }}</RouterLink>
          </div>
          <p v-else :class="classes.empty">В этом разделе пока нет товаров.</p>
        </div>
      </div>
    </Transition>
  </div>
</template>
