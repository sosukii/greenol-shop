<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { api } from '@/api'
import { ValidationError, type Order, type OrderStatus } from '@/core/types'
import { formatDate, formatPrice } from '@/utils/format'
import { UiAlert, UiBadge, UiButton, UiEmptyState, UiModal, UiSelect, UiSkeleton, UiTextarea } from '@/components/ui'
import { opts, orderStatusLabels, orderStatusTone, paymentMethodLabels, paymentStatusLabels, paymentStatusTone } from './labels'

const route = useRoute()
const order = ref<Order | null>(null)
const loading = ref(true)
const error = ref('')
const status = ref<OrderStatus>('new')
const note = ref('')
const saving = ref(false)
const payOpen = ref(false)
const reason = ref('')
const reasonError = ref('')

async function load() {
  try { order.value = await api.admin.getOrder(String(route.query.id ?? '')); if (order.value) status.value = order.value.status } catch { error.value = 'Не удалось загрузить заказ' }
  loading.value = false
}
onMounted(load)

async function saveStatus() {
  if (!order.value || status.value === order.value.status) return
  saving.value = true
  try { order.value = await api.admin.setOrderStatus(order.value.id, status.value, note.value || undefined); note.value = '' } catch { error.value = 'Не удалось сохранить статус' } finally { saving.value = false }
}
async function markPaid() {
  if (!order.value) return
  reasonError.value = ''
  try { order.value = await api.admin.markPaid(order.value.id, reason.value); payOpen.value = false; reason.value = '' } catch (e) {
    if (e instanceof ValidationError) reasonError.value = e.fields.reason ?? 'Ошибка'
    else reasonError.value = 'Не удалось сохранить'
  }
}

const classes = {
  head: 'mb-4 flex flex-wrap items-center gap-3',
  h1: 'text-2xl font-bold',
  grid: 'grid gap-4 lg:grid-cols-3',
  card: 'rounded-2xl border border-slate-200 bg-white p-5',
  h2: 'mb-3 text-lg font-semibold',
  dl: 'grid grid-cols-[auto_1fr] gap-x-5 gap-y-1.5 text-sm',
  dt: 'text-slate-500',
  line: 'flex justify-between gap-4 border-b border-slate-100 py-2 text-sm last:border-0',
  hist: 'flex flex-col gap-3 border-l-2 border-slate-200 pl-4',
}
</script>

<template>
  <div v-if="loading" class="flex flex-col gap-3"><UiSkeleton class="h-12" /><UiSkeleton class="h-64" /></div>
  <UiAlert v-else-if="error && !order" tone="danger">{{ error }}</UiAlert>
  <UiEmptyState v-else-if="!order" title="Заказ не найден"><UiButton to="/admin/orders">К списку заказов</UiButton></UiEmptyState>
  <template v-else>
    <RouterLink to="/admin/orders" class="mb-2 inline-block text-sm text-brand-600 hover:underline">← Все заказы</RouterLink>
    <div :class="classes.head">
      <h1 :class="classes.h1">Заказ {{ order.number }}</h1>
      <UiBadge :tone="orderStatusTone[order.status]">{{ orderStatusLabels[order.status] }}</UiBadge>
      <UiBadge :tone="paymentStatusTone[order.payment.status]">{{ paymentStatusLabels[order.payment.status] }}</UiBadge>
      <span class="text-sm text-slate-500">{{ formatDate(order.createdAt) }}</span>
    </div>
    <UiAlert v-if="error" tone="danger" class="mb-4">{{ error }}</UiAlert>

    <div :class="classes.grid">
      <section :class="[classes.card, 'lg:col-span-2']" aria-labelledby="od-items">
        <h2 id="od-items" :class="classes.h2">Состав заказа</h2>
        <div v-for="i in order.items" :key="i.sku" :class="classes.line">
          <span>{{ i.title }}{{ i.label ? `, ${i.label}` : '' }}<br /><span class="text-slate-500">арт. {{ i.sku }} · {{ formatPrice(i.price) }} × {{ i.qty }}</span></span>
          <span class="shrink-0 font-semibold">{{ formatPrice(i.price * i.qty) }}</span>
        </div>
        <div :class="classes.line"><span>Товары</span><span>{{ formatPrice(order.subtotal) }}</span></div>
        <div :class="classes.line"><span>Доставка, {{ order.delivery.providerTitle }}{{ order.delivery.estimated ? ' (ориентировочно)' : '' }}</span><span>{{ formatPrice(order.delivery.price) }}</span></div>
        <div :class="[classes.line, 'text-lg font-bold']"><span>Итого</span><span>{{ formatPrice(order.total) }}</span></div>
      </section>

      <div class="flex flex-col gap-4">
        <section :class="classes.card" aria-labelledby="od-customer">
          <h2 id="od-customer" :class="classes.h2">Покупатель</h2>
          <dl :class="classes.dl">
            <dt :class="classes.dt">Имя</dt><dd>{{ order.customer.name }}</dd>
            <dt :class="classes.dt">Телефон</dt><dd><a :href="`tel:${order.customer.phone}`" class="inline-flex min-h-7 items-center text-brand-600">{{ order.customer.phone }}</a></dd>
            <dt v-if="order.customer.email" :class="classes.dt">Email</dt><dd v-if="order.customer.email">{{ order.customer.email }}</dd>
            <dt v-if="order.customer.comment" :class="classes.dt">Комментарий</dt><dd v-if="order.customer.comment">{{ order.customer.comment }}</dd>
          </dl>
        </section>
        <section :class="classes.card" aria-labelledby="od-delivery">
          <h2 id="od-delivery" :class="classes.h2">Доставка</h2>
          <dl :class="classes.dl">
            <dt :class="classes.dt">Служба</dt><dd>{{ order.delivery.providerTitle }}</dd>
            <dt :class="classes.dt">Город</dt><dd>{{ order.delivery.city }}</dd>
            <dt :class="classes.dt">Адрес</dt><dd>{{ order.delivery.address }}</dd>
            <dt :class="classes.dt">Срок</dt><dd>{{ order.delivery.daysMin }}–{{ order.delivery.daysMax }} дн.</dd>
          </dl>
        </section>
        <section :class="classes.card" aria-labelledby="od-pay">
          <h2 id="od-pay" :class="classes.h2">Оплата</h2>
          <dl :class="classes.dl"><dt :class="classes.dt">Способ</dt><dd>{{ paymentMethodLabels[order.payment.method] }}</dd><dt :class="classes.dt">Статус</dt><dd>{{ paymentStatusLabels[order.payment.status] }}</dd></dl>
          <UiButton v-if="order.payment.status !== 'paid'" class="mt-3" variant="outline" size="sm" @click="payOpen = true">Отметить оплаченным вручную</UiButton>
        </section>
      </div>

      <section :class="classes.card" aria-labelledby="od-status">
        <h2 id="od-status" :class="classes.h2">Статус заказа</h2>
        <div class="flex flex-col gap-3">
          <UiSelect v-model="status" label="Новый статус" :options="opts(orderStatusLabels)" />
          <UiTextarea v-model="note" label="Комментарий (необязательно)" :rows="2" />
          <UiButton :loading="saving" :disabled="status === order.status" @click="saveStatus">Сохранить статус</UiButton>
        </div>
      </section>

      <section :class="[classes.card, 'lg:col-span-2']" aria-labelledby="od-hist">
        <h2 id="od-hist" :class="classes.h2">История и аудит</h2>
        <ol :class="classes.hist">
          <li v-for="(h, i) in [...order.history].reverse()" :key="i" class="text-sm">
            <p class="font-medium">{{ h.action }}</p>
            <p class="text-slate-500">{{ formatDate(h.at) }} · {{ h.by }}<template v-if="h.note"> · «{{ h.note }}»</template></p>
          </li>
        </ol>
      </section>
    </div>

    <UiModal v-model="payOpen" title="Отметить оплаченным">
      <p class="mb-3 text-sm text-slate-600">Ручное изменение статуса оплаты фиксируется в журнале аудита. Укажите основание (например, номер платёжного поручения).</p>
      <UiTextarea v-model="reason" label="Причина" :error="reasonError" :rows="3" />
      <div class="mt-4 flex gap-2"><UiButton @click="markPaid">Подтвердить</UiButton><UiButton variant="ghost" @click="payOpen = false">Отмена</UiButton></div>
    </UiModal>
  </template>
</template>
