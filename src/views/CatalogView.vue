<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { site } from '@/config/site'
import { brands, categoryPath, childCategories, getCategory, queryProducts, descendantIds, products } from '@/data/catalog'
import type { SortKey } from '@/data/types'
import { plural } from '@/utils/format'
import { breadcrumbLd, useSeo } from '@/composables/useSeo'
import { track } from '@/composables/analytics'
import ProductGrid from '@/components/catalog/ProductGrid.vue'
import { UiBreadcrumbs, UiButton, UiCheckbox, UiEmptyState, UiIcon, UiInput, UiModal, UiPagination, UiSelect } from '@/components/ui'
import NotFoundView from './NotFoundView.vue'

const route = useRoute()
const router = useRouter()

const slug = computed(() => route.params.slug as string | undefined)
const category = computed(() => (slug.value ? getCategory(slug.value) : undefined))
const q = computed(() => (typeof route.query.q === 'string' ? route.query.q : ''))
const brandSel = computed(() => (typeof route.query.brand === 'string' ? route.query.brand.split(',') : []))
const inStock = computed(() => route.query.stock === '1')
const priceMin = computed(() => (route.query.min ? Number(route.query.min) : undefined))
const priceMax = computed(() => (route.query.max ? Number(route.query.max) : undefined))
const sort = computed(() => ((route.query.sort as SortKey) || 'default'))
const page = computed(() => Math.max(1, Number(route.query.page) || 1))

const filtered = computed(() => queryProducts({
  categoryId: category.value?.id, search: q.value, inStockOnly: inStock.value, brands: brandSel.value,
  priceMin: priceMin.value, priceMax: priceMax.value, sort: sort.value,
}))
const pages = computed(() => Math.max(1, Math.ceil(filtered.value.length / site.pageSize)))
const shown = computed(() => filtered.value.slice((page.value - 1) * site.pageSize, page.value * site.pageSize))
const hasFilters = computed(() => !!(q.value || brandSel.value.length || inStock.value || priceMin.value || priceMax.value))
const children = computed(() => childCategories(category.value?.id ?? null))
const scopeBrands = computed(() => {
  const scope = category.value ? descendantIds(category.value.id) : null
  const set = new Set(products.filter((p) => !scope || p.categoryIds.some((c) => scope.includes(c))).map((p) => p.brand))
  return brands.filter((b) => set.has(b.id))
})

const title = computed(() => category.value?.title ?? (q.value ? `Поиск: «${q.value}»` : 'Каталог товаров'))
const path = computed(() => (category.value ? `/catalog/${category.value.slug}` : '/catalog'))
const crumbItems = computed(() => [
  { name: 'Главная', path: '/' }, { name: 'Каталог', path: '/catalog' },
  ...(category.value ? categoryPath(category.value.id).map((c) => ({ name: c.title, path: `/catalog/${c.slug}` })) : []),
])
const crumbs = computed(() => crumbItems.value.slice(1).map((c, i, a) => ({ label: c.name, to: i < a.length - 1 ? c.path : undefined })))

useSeo(() => ({
  title: category.value
    ? `${category.value.title} — купить в интернет-магазине ${site.name}`
    : q.value ? `Поиск «${q.value}» — ${site.name}` : `Каталог — ${site.name}`,
  description: category.value
    ? `${category.value.title}: ${filtered.value.length} ${plural(filtered.value.length, 'товар', 'товара', 'товаров')} в официальном интернет-магазине производителя Greenol. Цены, наличие, доставка по России.`
    : `Каталог официального интернет-магазина Greenol: автохимия, масла Тотек, защитные материалы для автосервиса.`,
  path: path.value,
  // страницы с поиском, фильтрами и пагинацией не индексируем — канонический вариант без параметров
  noindex: hasFilters.value || page.value > 1,
  jsonLd: [breadcrumbLd(crumbItems.value), {
    '@context': 'https://schema.org', '@type': 'ItemList',
    itemListElement: filtered.value.slice(0, 24).map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: `${site.url}/product/${p.slug}` })),
  }],
}))

watch(() => category.value?.id, (id) => { if (id) track('view_category', { id }) }, { immediate: true })

function setQuery(patch: Record<string, string | undefined>, resetPage = true) {
  const next: Record<string, string> = {}
  for (const [k, v] of Object.entries({ ...route.query, ...patch, ...(resetPage ? { page: undefined } : {}) })) {
    if (typeof v === 'string' && v !== '') next[k] = v
  }
  router.replace({ path: route.path, query: next })
}
const toggleBrand = (id: string) => {
  const s = new Set(brandSel.value)
  s.has(id) ? s.delete(id) : s.add(id)
  setQuery({ brand: [...s].join(',') || undefined })
}
const reset = () => router.replace({ path: route.path })

const minModel = ref(route.query.min?.toString() ?? '')
const maxModel = ref(route.query.max?.toString() ?? '')
watch(() => route.query, (qq) => { minModel.value = qq.min?.toString() ?? ''; maxModel.value = qq.max?.toString() ?? '' })
const applyPrice = () => setQuery({ min: minModel.value.replace(/\D/g, '') || undefined, max: maxModel.value.replace(/\D/g, '') || undefined })

const filtersOpen = ref(false)
const sortOptions = [
  { value: 'default', label: 'Популярные' }, { value: 'price-asc', label: 'Сначала дешевле' },
  { value: 'price-desc', label: 'Сначала дороже' }, { value: 'title', label: 'По названию' },
]

const classes = {
  title: 'mb-1 text-2xl font-bold sm:text-3xl',
  count: 'mb-5 text-sm text-slate-500',
  layout: 'grid gap-6 lg:grid-cols-[17rem_1fr]',
  aside: 'hidden flex-col gap-6 rounded-2xl border border-slate-200 bg-white p-5 lg:flex lg:self-start',
  block: 'flex flex-col gap-1.5',
  blockTitle: 'mb-1 text-sm font-semibold text-slate-900',
  catLink: 'rounded-lg px-2 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-brand-600',
  backLink: 'flex items-center gap-1 rounded-lg px-1.5 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-brand-600',
  toolbar: 'mb-4 flex flex-wrap items-end justify-between gap-3',
  mobileBtn: 'lg:hidden',
  sort: 'w-full max-w-60 sm:w-52',
  priceRow: 'grid grid-cols-2 gap-2',
}
</script>

<template>
  <NotFoundView v-if="slug && !category" />
  <template v-else>
    <UiBreadcrumbs :items="[{ label: 'Главная', to: '/' }, ...crumbs]" />
    <h1 :class="classes.title">{{ title }}</h1>
    <p :class="classes.count">{{ filtered.length }} {{ plural(filtered.length, 'товар', 'товара', 'товаров') }}</p>

    <div :class="classes.layout">
      <aside :class="classes.aside" aria-label="Фильтры">
          <div v-if="children.length || category" :class="classes.block">
            <p v-if="children.length" :class="classes.blockTitle">Подкатегории</p>
            <RouterLink v-for="c in children" :key="c.id" :to="`/catalog/${c.slug}`" :class="classes.catLink">{{ c.title }}</RouterLink>
            <RouterLink v-if="category" :to="category.parentId ? `/catalog/${categoryPath(category.id).at(-2)?.slug}` : '/catalog'" :class="classes.backLink"><UiIcon name="chevronLeft" :size="18" class="text-slate-400" />{{ category.parentId ? 'Назад' : 'Все категории' }}</RouterLink>
          </div>
          <div :class="classes.block">
            <p :class="classes.blockTitle">Наличие</p>
            <UiCheckbox :model-value="inStock" label="Только в наличии" @update:model-value="setQuery({ stock: $event ? '1' : undefined })" />
          </div>
          <div v-if="scopeBrands.length > 1" :class="classes.block">
            <p :class="classes.blockTitle">Бренд</p>
            <UiCheckbox v-for="b in scopeBrands" :key="b.id" :model-value="brandSel.includes(b.id)" :label="b.title" @update:model-value="toggleBrand(b.id)" />
          </div>
          <form :class="classes.block" @submit.prevent="applyPrice">
            <p :class="classes.blockTitle">Цена, ₽</p>
            <div :class="classes.priceRow">
              <UiInput v-model="minModel" label="От" inputmode="numeric" placeholder="0" quiet />
              <UiInput v-model="maxModel" label="До" inputmode="numeric" placeholder="∞" quiet />
            </div>
            <UiButton type="submit" variant="secondary" size="sm">Применить</UiButton>
          </form>
          <UiButton v-if="hasFilters" variant="ghost" size="sm" @click="reset">Сбросить фильтры</UiButton>
      </aside>

      <section aria-labelledby="cat-list">
        <h2 id="cat-list" class="sr-only">Список товаров</h2>
        <div :class="classes.toolbar">
          <UiButton variant="outline" :class="classes.mobileBtn" @click="filtersOpen = true"><UiIcon name="filter" :size="18" />Фильтры</UiButton>
          <div :class="classes.sort"><UiSelect :model-value="sort" :options="sortOptions" label="Сортировка" @update:model-value="setQuery({ sort: $event === 'default' ? undefined : $event })" /></div>
        </div>
        <UiEmptyState v-if="!filtered.length" :title="q ? 'Ничего не найдено' : 'Товары не найдены'" :text="q ? `По запросу «${q}» ничего нет. Проверьте написание или сбросьте фильтры.` : 'Попробуйте изменить или сбросить фильтры.'">
          <UiButton variant="secondary" @click="reset">Сбросить</UiButton>
          <UiButton to="/catalog" variant="ghost">В каталог</UiButton>
        </UiEmptyState>
        <ProductGrid v-else :products="shown" :priority-count="4" />
        <UiPagination :page="page" :pages="pages" @change="setQuery({ page: $event === 1 ? undefined : String($event) }, false)" />
      </section>
    </div>

    <UiModal v-model="filtersOpen" title="Фильтры">
      <div class="flex flex-col gap-6">
        <div v-if="children.length" :class="classes.block">
          <p :class="classes.blockTitle">Подкатегории</p>
          <RouterLink v-for="c in children" :key="c.id" :to="`/catalog/${c.slug}`" :class="classes.catLink" @click="filtersOpen = false">{{ c.title }}</RouterLink>
        </div>
        <UiCheckbox :model-value="inStock" label="Только в наличии" @update:model-value="setQuery({ stock: $event ? '1' : undefined })" />
        <div v-if="scopeBrands.length > 1" :class="classes.block">
          <p :class="classes.blockTitle">Бренд</p>
          <UiCheckbox v-for="b in scopeBrands" :key="b.id" :model-value="brandSel.includes(b.id)" :label="b.title" @update:model-value="toggleBrand(b.id)" />
        </div>
        <form :class="classes.block" @submit.prevent="applyPrice">
          <p :class="classes.blockTitle">Цена, ₽</p>
          <div :class="classes.priceRow">
            <UiInput v-model="minModel" label="От" inputmode="numeric" />
            <UiInput v-model="maxModel" label="До" inputmode="numeric" />
          </div>
          <UiButton type="submit" variant="secondary">Применить цену</UiButton>
        </form>
        <div class="flex gap-2">
          <UiButton block @click="filtersOpen = false">Показать ({{ filtered.length }})</UiButton>
          <UiButton v-if="hasFilters" variant="ghost" @click="reset">Сбросить</UiButton>
        </div>
      </div>
    </UiModal>
  </template>
</template>
