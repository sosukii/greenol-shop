<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { catalog } from '@/data/repository'
import type { Product, SortKey } from '@/data/types'
import { categoryPath, useCategories } from '@/composables'
import ProductCard from '@/components/catalog/ProductCard.vue'
import { UiAlert, UiBreadcrumbs, UiButton, UiEmptyState, UiSelect, UiSkeleton } from '@/components/ui'

const route = useRoute()
const router = useRouter()
const { categories } = useCategories()

const products = ref<Product[]>([])
const allInScope = ref<Product[]>([])
const loading = ref(true)
const error = ref(false)

const sort = ref('popular')
const inStockOnly = ref(false)
const colors = ref<string[]>([])

const slug = computed(() => route.params.slug as string | undefined)
const search = computed(() => (route.query.q as string) ?? '')
const category = computed(() => categories.value.find((c) => c.slug === slug.value))
const children = computed(() => categories.value.filter((c) => c.parentId === (category.value?.id ?? null)))
const crumbs = computed(() => [
  { label: 'Главная', to: '/' },
  { label: 'Каталог', to: category.value ? '/catalog' : undefined },
  ...(category.value ? categoryPath(categories.value, category.value.id).map((c, i, a) => ({
    label: c.title, to: i < a.length - 1 ? `/catalog/${c.slug}` : undefined,
  })) : []),
])
const availableColors = computed(() => [...new Set(allInScope.value.map((p) => p.attributes['Цвет']).filter(Boolean))])
const title = computed(() => category.value?.title ?? (search.value ? `Поиск: «${search.value}»` : 'Каталог'))
const unknownCategory = computed(() => !!slug.value && categories.value.length > 0 && !category.value)

const sortOptions = [
  { value: 'popular', label: 'По умолчанию' },
  { value: 'price-asc', label: 'Сначала дешевле' },
  { value: 'price-desc', label: 'Сначала дороже' },
  { value: 'title', label: 'По названию' },
]

async function load() {
  if (slug.value && !category.value) return
  loading.value = true
  error.value = false
  try {
    const base = { categoryId: category.value?.id, search: search.value }
    allInScope.value = await catalog.getProducts(base)
    products.value = await catalog.getProducts({
      ...base, sort: sort.value as SortKey, inStockOnly: inStockOnly.value, attributes: { Цвет: colors.value },
    })
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

watch([() => route.fullPath, categories, sort, inStockOnly, colors], load, { immediate: true, deep: true })
watch(() => route.fullPath, () => { colors.value = []; inStockOnly.value = false })

function reset() { colors.value = []; inStockOnly.value = false; router.push('/catalog') }

const classes = {
  title: 'mb-4 text-2xl font-bold sm:text-3xl',
  layout: 'grid gap-6 lg:grid-cols-[16rem_1fr]',
  aside: 'flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-4 lg:self-start',
  asideTitle: 'mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500',
  catList: 'flex flex-col gap-1',
  catLink: 'block rounded-lg px-2 py-1.5 hover:bg-slate-100',
  check: 'flex items-center gap-2 py-1',
  toolbar: 'mb-4 flex flex-wrap items-end justify-between gap-3',
  count: 'text-slate-500',
  grid: 'grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4',
}
</script>

<template>
  <UiBreadcrumbs :items="crumbs" />
  <UiEmptyState v-if="unknownCategory" title="Категория не найдена" text="Проверьте адрес или вернитесь в каталог.">
    <UiButton to="/catalog">В каталог</UiButton>
  </UiEmptyState>
  <template v-else>
    <h1 :class="classes.title">{{ title }}</h1>
    <p v-if="category?.description" class="mb-4 text-slate-600">{{ category.description }}</p>
    <div :class="classes.layout">
      <aside :class="classes.aside" aria-label="Фильтры">
        <div v-if="children.length">
          <p :class="classes.asideTitle">Подкатегории</p>
          <ul :class="classes.catList">
            <li v-for="c in children" :key="c.id">
              <RouterLink :to="`/catalog/${c.slug}`" :class="classes.catLink">{{ c.title }}</RouterLink>
            </li>
          </ul>
        </div>
        <div>
          <p :class="classes.asideTitle">Фильтры</p>
          <label :class="classes.check"><input v-model="inStockOnly" type="checkbox" /> Только в наличии</label>
        </div>
        <div v-if="availableColors.length">
          <p :class="classes.asideTitle">Цвет</p>
          <label v-for="c in availableColors" :key="c" :class="classes.check">
            <input v-model="colors" type="checkbox" :value="c" /> {{ c }}
          </label>
        </div>
      </aside>
      <section>
        <div :class="classes.toolbar">
          <p :class="classes.count">{{ loading ? 'Загрузка…' : `Найдено: ${products.length}` }}</p>
          <UiSelect v-model="sort" :options="sortOptions" label="Сортировка" />
        </div>
        <UiAlert v-if="error" tone="danger" title="Не удалось загрузить товары">
          Попробуйте обновить страницу. <UiButton size="sm" variant="secondary" @click="load">Повторить</UiButton>
        </UiAlert>
        <div v-else-if="loading" :class="classes.grid">
          <UiSkeleton v-for="n in 6" :key="n" class="h-72" />
        </div>
        <UiEmptyState
          v-else-if="!products.length"
          :title="search ? 'Ничего не найдено' : 'В этой категории пока нет товаров'"
          :text="search ? 'Попробуйте изменить запрос или сбросить фильтры.' : 'Загляните в другую категорию.'"
        >
          <UiButton variant="secondary" @click="reset">Сбросить</UiButton>
        </UiEmptyState>
        <div v-else :class="classes.grid">
          <ProductCard v-for="p in products" :key="p.id" :product="p" />
        </div>
      </section>
    </div>
  </template>
</template>
