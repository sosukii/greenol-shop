<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { site } from '@/config/site'
import { brands, childCategories, hitProducts, newProducts, products, descendantIds } from '@/data/catalog'
import { plural } from '@/utils/format'
import { useSeo, websiteLd } from '@/composables/useSeo'
import ProductGrid from '@/components/catalog/ProductGrid.vue'
import { UiButton, UiIcon } from '@/components/ui'

useSeo({
  title: `${site.name} — официальный интернет-магазин производителя: автохимия, масла, защитные материалы`,
  description: site.description,
  path: '/',
  jsonLd: [websiteLd()],
})

const top = childCategories(null).map((c) => {
  const ids = descendantIds(c.id)
  return { ...c, count: products.filter((p) => p.categoryIds.some((x) => ids.includes(x))).length }
})
const hits = hitProducts().slice(0, 4)
const fresh = newProducts().filter((p) => !hits.includes(p)).slice(0, 4)

const classes = {
  hero: 'mb-10 grid gap-6 rounded-3xl bg-gradient-to-br from-brand-700 to-brand-600 px-6 py-9 text-white sm:px-10 sm:py-12 lg:grid-cols-[1.4fr_1fr] lg:items-center',
  h1: 'mb-3 text-3xl font-extrabold leading-tight sm:text-4xl',
  lead: 'mb-6 max-w-xl text-brand-100',
  actions: 'flex flex-wrap gap-3',
  facts: 'grid gap-2 text-sm text-brand-100',
  fact: 'flex items-center gap-2 rounded-xl bg-white/10 px-4 py-3',
  section: 'mb-12',
  head: 'mb-4 flex items-end justify-between gap-4',
  h2: 'text-xl font-bold sm:text-2xl',
  more: 'inline-flex min-h-8 items-center text-sm font-medium text-brand-600 hover:underline',
  cats: 'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4',
  cat: 'flex min-h-28 flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 transition-colors duration-150 hover:border-brand-500',
  catTitle: 'font-semibold leading-5',
  catCount: 'text-sm text-slate-500',
  brands: 'grid gap-3 sm:grid-cols-2',
  brand: 'flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 hover:border-brand-500',
  info: 'grid gap-3 sm:grid-cols-3',
  infoCard: 'flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-5 hover:border-brand-500',
}
</script>

<template>
  <section :class="classes.hero">
    <div>
      <h1 :class="classes.h1">Официальный интернет-магазин производителя Greenol</h1>
      <p :class="classes.lead">Автохимия, раскоксовка и промывки двигателя, моторные масла Тотек и защитные материалы для автосервиса. Дилерские продажи продукции Greenol по всей России.</p>
      <div :class="classes.actions">
        <UiButton to="/catalog" variant="secondary" size="lg">Перейти в каталог</UiButton>
        <UiButton to="/delivery" variant="ghost" size="lg" class="!text-white hover:!bg-white/10">Доставка и оплата</UiButton>
      </div>
    </div>
    <ul :class="classes.facts">
      <li :class="classes.fact"><UiIcon name="grid" />{{ products.length }} {{ plural(products.length, 'товар', 'товара', 'товаров') }} в каталоге</li>
      <li :class="classes.fact"><UiIcon name="truck" />Доставка СДЭК и Ozon по России</li>
      <li :class="classes.fact"><UiIcon name="phone" />{{ site.contacts.phone }}</li>
    </ul>
  </section>

  <section :class="classes.section" aria-labelledby="h-cats">
    <div :class="classes.head"><h2 id="h-cats" :class="classes.h2">Категории</h2></div>
    <ul :class="classes.cats">
      <li v-for="c in top" :key="c.id">
        <RouterLink :to="`/catalog/${c.slug}`" :class="classes.cat">
          <span :class="classes.catTitle">{{ c.title }}</span>
          <span :class="classes.catCount">{{ c.count }} {{ plural(c.count, 'товар', 'товара', 'товаров') }}</span>
        </RouterLink>
      </li>
    </ul>
  </section>

  <section v-if="hits.length" :class="classes.section" aria-labelledby="h-hits">
    <div :class="classes.head">
      <h2 id="h-hits" :class="classes.h2">Хиты продаж</h2>
      <RouterLink to="/catalog" :class="classes.more">Весь каталог</RouterLink>
    </div>
    <ProductGrid :products="hits" :priority-count="4" />
  </section>

  <section v-if="fresh.length" :class="classes.section" aria-labelledby="h-new">
    <div :class="classes.head"><h2 id="h-new" :class="classes.h2">Новинки</h2></div>
    <ProductGrid :products="fresh" />
  </section>

  <section :class="classes.section" aria-labelledby="h-brands">
    <div :class="classes.head"><h2 id="h-brands" :class="classes.h2">Бренды</h2></div>
    <ul :class="classes.brands">
      <li v-for="b in brands" :key="b.id">
        <RouterLink :to="{ path: '/catalog', query: { brand: b.id } }" :class="classes.brand">
          <span class="text-lg font-semibold">{{ b.title }}</span>
          <span :class="classes.catCount">{{ products.filter((p) => p.brand === b.id).length }} {{ plural(products.filter((p) => p.brand === b.id).length, 'товар', 'товара', 'товаров') }}</span>
        </RouterLink>
      </li>
    </ul>
  </section>

  <section :class="classes.section" aria-labelledby="h-info">
    <div :class="classes.head"><h2 id="h-info" :class="classes.h2">Покупателям</h2></div>
    <div :class="classes.info">
      <RouterLink to="/delivery" :class="classes.infoCard"><span class="font-semibold">Доставка и оплата</span><span :class="classes.catCount">Способы доставки, расчёт стоимости и варианты оплаты</span></RouterLink>
      <RouterLink to="/about" :class="classes.infoCard"><span class="font-semibold">О магазине</span><span :class="classes.catCount">Кто мы и что продаём</span></RouterLink>
      <RouterLink to="/contacts" :class="classes.infoCard"><span class="font-semibold">Контакты</span><span :class="classes.catCount">Телефон, e-mail, адрес и режим работы</span></RouterLink>
    </div>
  </section>
</template>
