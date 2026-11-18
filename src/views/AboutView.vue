<script setup lang="ts">
import { site } from '@/config/site'
import { breadcrumbLd, organizationLd, useSeo } from '@/composables/useSeo'
import PageShell from '@/components/layout/PageShell.vue'
import { UiButton } from '@/components/ui'

useSeo({
  title: `О магазине — ${site.name}`,
  description: 'Интернет-магазин осуществляет дилерские продажи продукции компании-производителя Greenol на территории России.',
  path: '/about',
  jsonLd: [breadcrumbLd([{ name: 'Главная', path: '/' }, { name: 'О магазине', path: '/about' }]), organizationLd()],
})
const classes = { card: 'rounded-2xl border border-slate-200 bg-white p-5', h2: 'mb-2 text-lg font-semibold', dl: 'grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-sm', dt: 'text-slate-500' }
</script>

<template>
  <PageShell title="О магазине">
    <p>{{ site.fullName }}. Интернет-магазин осуществляет дилерские продажи продукции компании-производителя Greenol на территории России.</p>
    <section :class="classes.card" aria-labelledby="a-req">
      <h2 id="a-req" :class="classes.h2">Реквизиты</h2>
      <p class="mb-3 text-sm">{{ site.legal.region }}.</p>
      <dl :class="classes.dl">
        <dt :class="classes.dt">Продавец</dt><dd>{{ site.legal.name }}</dd>
        <dt :class="classes.dt">ОГРНИП</dt><dd>{{ site.legal.ogrnip }}</dd>
        <dt :class="classes.dt">ИНН</dt><dd>{{ site.legal.inn }}</dd>
        <dt :class="classes.dt">Адрес</dt><dd>{{ site.contacts.address }}</dd>
        <dt :class="classes.dt">E-mail</dt><dd><a :href="`mailto:${site.contacts.email}`" class="text-brand-600 hover:underline">{{ site.contacts.email }}</a></dd>
      </dl>
    </section>
    <div class="flex flex-wrap gap-2"><UiButton to="/catalog">Перейти в каталог</UiButton><UiButton to="/contacts" variant="secondary">Контакты</UiButton></div>
  </PageShell>
</template>
