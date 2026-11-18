<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { api } from '@/api'
import { site } from '@/config/site'
import type { Lead, Order } from '@/core/types'
import { formatPrice } from '@/utils/format'
import { UiAlert, UiSkeleton } from '@/components/ui'
import { orderStatusLabels } from './labels'

const orders = ref<Order[]>([])
const leads = ref<Lead[]>([])
const loading = ref(true)
const error = ref(false)

onMounted(async () => {
  try { [orders.value, leads.value] = await Promise.all([api.admin.listOrders(), api.admin.listLeads()]) } catch { error.value = true }
  loading.value = false
})

const paid = computed(() => orders.value.filter((o) => o.payment.status === 'paid'))
const revenue = computed(() => paid.value.reduce((s, o) => s + o.total, 0))
const active = computed(() => orders.value.filter((o) => o.status !== 'cancelled'))
const avg = computed(() => (active.value.length ? Math.round(active.value.reduce((s, o) => s + o.total, 0) / active.value.length) : 0))

const byDay = computed(() => {
  const days: { day: string; count: number }[] = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10)
    days.push({ day: d, count: orders.value.filter((o) => o.createdAt.startsWith(d)).length })
  }
  return days
})
const maxDay = computed(() => Math.max(1, ...byDay.value.map((d) => d.count)))
const byStatus = computed(() => Object.entries(orderStatusLabels).map(([k, label]) => ({ label, count: orders.value.filter((o) => o.status === k).length })))
const top = computed(() => {
  const m = new Map<string, { title: string; qty: number }>()
  for (const o of orders.value) for (const i of o.items) m.set(i.sku, { title: i.title + (i.label ? `, ${i.label}` : ''), qty: (m.get(i.sku)?.qty ?? 0) + i.qty })
  return [...m.values()].sort((a, b) => b.qty - a.qty).slice(0, 5)
})

const classes = {
  cards: 'mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5',
  card: 'rounded-2xl border border-slate-200 bg-white p-4',
  label: 'text-xs text-slate-500',
  value: 'mt-1 text-xl font-bold sm:text-2xl',
  grid: 'grid gap-4 lg:grid-cols-2',
  h2: 'mb-3 text-lg font-semibold',
  bars: 'flex h-32 items-end gap-1',
  bar: 'flex-1 rounded-t bg-brand-500 transition-[height] duration-500',
}
</script>

<template>
  <h1 class="mb-4 text-2xl font-bold">Аналитика</h1>
  <div v-if="loading" :class="classes.cards"><UiSkeleton v-for="n in 5" :key="n" class="h-20" /></div>
  <UiAlert v-else-if="error" tone="danger" title="Не удалось загрузить данные" />
  <template v-else>
    <p class="mb-2 text-sm text-slate-500">Данные магазина (заказы и заявки)</p>
    <div :class="classes.cards">
      <div :class="classes.card"><p :class="classes.label">Заказов</p><p :class="classes.value">{{ orders.length }}</p></div>
      <div :class="classes.card"><p :class="classes.label">Оплачено на сумму</p><p :class="classes.value">{{ formatPrice(revenue) }}</p></div>
      <div :class="classes.card"><p :class="classes.label">Оплаченных заказов</p><p :class="classes.value">{{ paid.length }}</p></div>
      <div :class="classes.card"><p :class="classes.label">Средний чек</p><p :class="classes.value">{{ formatPrice(avg) }}</p></div>
      <div :class="classes.card"><p :class="classes.label">Заявок (лидов)</p><p :class="classes.value">{{ leads.length }}</p></div>
    </div>

    <div :class="classes.grid">
      <section :class="classes.card" aria-labelledby="an-days">
        <h2 id="an-days" :class="classes.h2">Заказы за 14 дней</h2>
        <div :class="classes.bars" role="img" :aria-label="`Заказы по дням, максимум ${maxDay}`">
          <div v-for="d in byDay" :key="d.day" :class="classes.bar" :style="{ height: (d.count / maxDay) * 100 + '%', minHeight: d.count ? '4px' : '2px', opacity: d.count ? 1 : 0.25 }" :title="`${d.day}: ${d.count}`" />
        </div>
        <p class="mt-2 text-xs text-slate-500">Слева — 14 дней назад, справа — сегодня</p>
      </section>
      <section :class="classes.card" aria-labelledby="an-status">
        <h2 id="an-status" :class="classes.h2">По статусам</h2>
        <ul class="flex flex-col gap-2 text-sm"><li v-for="s in byStatus" :key="s.label" class="flex justify-between"><span>{{ s.label }}</span><span class="font-semibold">{{ s.count }}</span></li></ul>
      </section>
      <section :class="classes.card" aria-labelledby="an-top">
        <h2 id="an-top" :class="classes.h2">Популярные товары в заказах</h2>
        <p v-if="!top.length" class="text-sm text-slate-500">Пока нет заказов.</p>
        <ol v-else class="flex flex-col gap-2 text-sm"><li v-for="t in top" :key="t.title" class="flex justify-between gap-3"><span>{{ t.title }}</span><span class="shrink-0 font-semibold">{{ t.qty }} шт.</span></li></ol>
      </section>
      <section :class="classes.card" aria-labelledby="an-ym">
        <h2 id="an-ym" :class="classes.h2">Яндекс Метрика</h2>
        <UiAlert v-if="!site.metrikaId" tone="warning" title="Счётчик не подключён">
          Укажите ID счётчика в переменной <code>VITE_YM_ID</code> и пересоберите сайт. События сайта описаны в docs/ANALYTICS.md.
        </UiAlert>
        <UiAlert v-else tone="info" title="Счётчик подключён">
          Счётчик № {{ site.metrikaId }} собирает посещения и цели. Отчёты Метрики в этой админке появятся после подключения серверного доступа к API (OAuth-токен хранится только на сервере) — пока их смотрите в кабинете Метрики. Данные здесь не имитируются.
        </UiAlert>
      </section>
    </div>
  </template>
</template>
