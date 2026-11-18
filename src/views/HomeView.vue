<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { catalog } from '@/data/repository'
import type { Product } from '@/data/types'
import { useCategories } from '@/composables'
import ProductCard from '@/components/catalog/ProductCard.vue'
import { UiButton, UiSkeleton } from '@/components/ui'

const { categories } = useCategories()
const topCategories = computed(() => categories.value.filter((c) => !c.parentId))
const featured = ref<Product[]>([])
const loading = ref(true)

onMounted(async () => {
  featured.value = (await catalog.getProducts({ inStockOnly: true })).slice(0, 4)
  loading.value = false
})

const classes = {
  hero: 'mb-10 rounded-3xl bg-brand-500 px-6 py-10 text-white sm:px-10 sm:py-14',
  heroTitle: 'mb-3 max-w-xl text-3xl font-extrabold leading-tight sm:text-4xl',
  heroText: 'mb-6 max-w-xl text-brand-100',
  h2: 'mb-4 text-xl font-bold sm:text-2xl',
  section: 'mb-10',
  cats: 'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4',
  cat: 'flex min-h-24 items-end rounded-2xl border border-slate-200 bg-white p-4 font-semibold hover:border-brand-500 hover:text-brand-600',
  grid: 'grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4',
}
</script>

<template>
  <section :class="classes.hero">
    <h1 :class="classes.heroTitle">Магазин Макса</h1>
    <p :class="classes.heroText">Демо-версия витрины. Здесь появится описание магазина и актуальные предложения.</p>
    <UiButton to="/catalog" variant="secondary" size="lg">Смотреть каталог</UiButton>
  </section>

  <section :class="classes.section">
    <h2 :class="classes.h2">Категории</h2>
    <div :class="classes.cats">
      <RouterLink v-for="c in topCategories" :key="c.id" :to="`/catalog/${c.slug}`" :class="classes.cat">{{ c.title }}</RouterLink>
    </div>
  </section>

  <section :class="classes.section">
    <h2 :class="classes.h2">Подборка (тестовые данные)</h2>
    <div v-if="loading" :class="classes.grid"><UiSkeleton v-for="n in 4" :key="n" class="h-72" /></div>
    <div v-else :class="classes.grid"><ProductCard v-for="p in featured" :key="p.id" :product="p" /></div>
  </section>
</template>
