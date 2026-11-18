<script setup lang="ts">
import { computed, reactive } from 'vue'
import { deliveryProviders, paymentMethods, site } from '@/config/site'
import { estimateDelivery } from '@/core/delivery'
import { formatPrice } from '@/utils/format'
import { breadcrumbLd, useSeo } from '@/composables/useSeo'
import PageShell from '@/components/layout/PageShell.vue'
import { UiAlert, UiButton, UiInput, UiSelect } from '@/components/ui'

useSeo({
  title: `Доставка и оплата — ${site.name}`,
  description: 'Доставка заказов службами СДЭК и Ozon по России, расчёт стоимости. Оплата картой онлайн, наличными при получении или по счёту.',
  path: '/delivery',
  jsonLd: [breadcrumbLd([{ name: 'Главная', path: '/' }, { name: 'Доставка и оплата', path: '/delivery' }])],
})

const calc = reactive({ city: '', provider: 'cdek', units: '1' })
const result = computed(() => {
  const n = Math.min(99, Math.max(1, Number(calc.units) || 1))
  try { return calc.city.trim() ? estimateDelivery(calc.provider, calc.city, n) : null } catch { return null }
})
const classes = { card: 'rounded-2xl border border-slate-200 bg-white p-5', h2: 'mb-3 text-xl font-semibold', list: 'flex flex-col gap-3', grid: 'grid gap-4 sm:grid-cols-3', res: 'mt-4 rounded-xl bg-brand-50 p-4 text-brand-700' }
</script>

<template>
  <PageShell title="Доставка и оплата">
    <section aria-labelledby="d-ship">
      <h2 id="d-ship" :class="classes.h2">Доставка</h2>
      <p>Доставка товара осуществляется различными службами доставки. Выбрать способ доставки и оплатить его необходимо при оформлении заказа.</p>
      <ul class="mt-3 list-inside list-disc"><li v-for="p in deliveryProviders" :key="p.id">{{ p.title }}</li></ul>
    </section>

    <section :class="classes.card" aria-labelledby="d-calc">
      <h2 id="d-calc" :class="classes.h2">Калькулятор доставки</h2>
      <form :class="classes.grid" @submit.prevent>
        <UiInput v-model="calc.city" label="Город" autocomplete="address-level2" />
        <UiSelect v-model="calc.provider" label="Служба доставки" :options="deliveryProviders.map((p) => ({ value: p.id, label: p.title }))" />
        <UiInput v-model="calc.units" label="Количество товаров" inputmode="numeric" />
      </form>
      <div v-if="result" :class="classes.res" aria-live="polite">
        <p class="text-lg font-semibold">≈ {{ formatPrice(result.price) }}, {{ result.daysMin }}–{{ result.daysMax }} дн.</p>
        <p class="text-sm">Расчёт ориентировочный. Окончательную стоимость и срок подтверждает менеджер после оформления заказа.</p>
      </div>
      <p v-else class="mt-4 text-sm text-slate-500">Укажите город, чтобы увидеть ориентировочную стоимость.</p>
    </section>

    <section aria-labelledby="d-pay">
      <h2 id="d-pay" :class="classes.h2">Оплата</h2>
      <ul :class="classes.list">
        <li v-for="m in paymentMethods" :key="m.id" :class="classes.card"><h3 class="mb-1 font-semibold">{{ m.title }}</h3><p class="text-sm">{{ m.text }}</p></li>
      </ul>
    </section>
    <UiAlert tone="info">Остались вопросы? Позвоните: <a :href="`tel:${site.contacts.phoneRaw}`" class="font-semibold underline">{{ site.contacts.phone }}</a></UiAlert>
    <div><UiButton to="/catalog">Перейти в каталог</UiButton></div>
  </PageShell>
</template>
