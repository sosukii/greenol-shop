<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { api } from '@/api'
import type { Order } from '@/core/types'
import { formatDate, formatPrice } from '@/utils/format'
import { UiAlert, UiBadge, UiButton, UiEmptyState, UiInput, UiPagination, UiSelect, UiSkeleton } from '@/components/ui'
import { opts, orderStatusLabels, orderStatusTone, paymentMethodLabels, paymentStatusLabels, paymentStatusTone } from './labels'

const PER_PAGE = 10
const orders = ref<Order[]>([])
const loading = ref(true)
const error = ref(false)
const search = ref('')
const status = ref('')
const pay = ref('')
const sort = ref('date-desc')
const page = ref(1)

async function load() {
  loading.value = true
  error.value = false
  try { orders.value = await api.admin.listOrders() } catch { error.value = true } finally { loading.value = false }
}
onMounted(load)

const filtered = computed(() => {
  const s = search.value.trim().toLowerCase()
  const list = orders.value.filter((o) =>
    (!status.value || o.status === status.value) && (!pay.value || o.payment.status === pay.value) &&
    (!s || [o.number, o.customer.name, o.customer.phone, o.customer.email ?? ''].some((x) => x.toLowerCase().includes(s))),
  )
  const dir = sort.value.endsWith('asc') ? 1 : -1
  return list.sort((a, b) => (sort.value.startsWith('total') ? a.total - b.total : a.createdAt.localeCompare(b.createdAt)) * dir)
})
const pages = computed(() => Math.max(1, Math.ceil(filtered.value.length / PER_PAGE)))
const shown = computed(() => filtered.value.slice((page.value - 1) * PER_PAGE, page.value * PER_PAGE))
watch([search, status, pay, sort], () => { page.value = 1 })

function exportCsv() {
  const q = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const rows = [['Номер', 'Дата', 'Клиент', 'Телефон', 'Город', 'Сумма', 'Статус заказа', 'Статус оплаты', 'Оплата'].join(';'),
    ...filtered.value.map((o) => [o.number, o.createdAt, o.customer.name, o.customer.phone, o.delivery.city, o.total, orderStatusLabels[o.status], paymentStatusLabels[o.payment.status], paymentMethodLabels[o.payment.method]].map(q).join(';'))]
  const url = URL.createObjectURL(new Blob(['﻿' + rows.join('\n')], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

const classes = {
  head: 'mb-4 flex flex-wrap items-center justify-between gap-3',
  h1: 'text-2xl font-bold',
  filters: 'mb-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4',
  tableWrap: 'overflow-x-auto rounded-2xl border border-slate-200 bg-white',
  table: 'w-full min-w-[56rem] text-left text-sm',
  th: 'border-b border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-600',
  td: 'border-b border-slate-100 px-4 py-3 align-top',
  link: 'font-semibold text-brand-600 hover:underline',
  cards: 'flex flex-col gap-3 md:hidden',
  card: 'rounded-2xl border border-slate-200 bg-white p-4',
}
</script>

<template>
  <div :class="classes.head">
    <h1 :class="classes.h1">Заказы</h1>
    <UiButton variant="outline" size="sm" :disabled="!filtered.length" @click="exportCsv">Экспорт CSV</UiButton>
  </div>
  <div :class="classes.filters">
    <UiInput v-model="search" label="Поиск" placeholder="Номер, имя, телефон" />
    <UiSelect v-model="status" label="Статус заказа" :options="opts(orderStatusLabels, 'Все')" />
    <UiSelect v-model="pay" label="Статус оплаты" :options="opts(paymentStatusLabels, 'Все')" />
    <UiSelect v-model="sort" label="Сортировка" :options="[{ value: 'date-desc', label: 'Сначала новые' }, { value: 'date-asc', label: 'Сначала старые' }, { value: 'total-desc', label: 'Сумма: по убыванию' }, { value: 'total-asc', label: 'Сумма: по возрастанию' }]" />
  </div>

  <div v-if="loading" class="flex flex-col gap-3"><UiSkeleton class="h-16" /><UiSkeleton class="h-16" /><UiSkeleton class="h-16" /></div>
  <UiAlert v-else-if="error" tone="danger" title="Не удалось загрузить заказы">Проверьте соединение. <UiButton size="sm" variant="secondary" @click="load">Повторить</UiButton></UiAlert>
  <UiEmptyState v-else-if="!orders.length" title="Заказов пока нет" text="Новые заказы с сайта появятся здесь." />
  <UiEmptyState v-else-if="!filtered.length" title="Ничего не найдено" text="Измените поиск или фильтры." />
  <template v-else>
    <div :class="[classes.tableWrap, 'hidden md:block']">
      <table :class="classes.table">
        <caption class="sr-only">Список заказов</caption>
        <thead><tr><th v-for="h in ['Заказ', 'Дата', 'Клиент', 'Сумма', 'Заказ', 'Оплата']" :key="h" scope="col" :class="classes.th">{{ h }}</th></tr></thead>
        <tbody>
          <tr v-for="o in shown" :key="o.id">
            <td :class="classes.td"><RouterLink :to="{ path: '/admin/order', query: { id: o.id } }" :class="classes.link">{{ o.number }}</RouterLink></td>
            <td :class="classes.td">{{ formatDate(o.createdAt) }}</td>
            <td :class="classes.td">{{ o.customer.name }}<br /><span class="text-slate-500">{{ o.customer.phone }}</span></td>
            <td :class="classes.td" class="whitespace-nowrap font-semibold">{{ formatPrice(o.total) }}</td>
            <td :class="classes.td"><UiBadge :tone="orderStatusTone[o.status]">{{ orderStatusLabels[o.status] }}</UiBadge></td>
            <td :class="classes.td"><UiBadge :tone="paymentStatusTone[o.payment.status]">{{ paymentStatusLabels[o.payment.status] }}</UiBadge><br /><span class="text-xs text-slate-500">{{ paymentMethodLabels[o.payment.method] }}</span></td>
          </tr>
        </tbody>
      </table>
    </div>
    <ul :class="classes.cards">
      <li v-for="o in shown" :key="o.id" :class="classes.card">
        <div class="mb-2 flex items-center justify-between"><RouterLink :to="{ path: '/admin/order', query: { id: o.id } }" :class="classes.link">{{ o.number }}</RouterLink><span class="font-semibold">{{ formatPrice(o.total) }}</span></div>
        <p class="text-sm">{{ o.customer.name }}, {{ o.customer.phone }}</p>
        <p class="mb-2 text-xs text-slate-500">{{ formatDate(o.createdAt) }}</p>
        <div class="flex flex-wrap gap-1.5"><UiBadge :tone="orderStatusTone[o.status]">{{ orderStatusLabels[o.status] }}</UiBadge><UiBadge :tone="paymentStatusTone[o.payment.status]">{{ paymentStatusLabels[o.payment.status] }}</UiBadge></div>
      </li>
    </ul>
    <p class="mt-3 text-sm text-slate-500">Найдено: {{ filtered.length }}</p>
    <UiPagination :page="page" :pages="pages" @change="page = $event" />
  </template>
</template>
