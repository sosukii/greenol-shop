<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { api, type PaymentOutcome, type PublicOrder } from '@/api'
import { paymentMethods, site } from '@/config/site'
import { formatPrice } from '@/utils/format'
import { useSeo } from '@/composables/useSeo'
import { ecommerce, track } from '@/composables/analytics'
import { UiAlert, UiBadge, UiButton, UiEmptyState, UiSkeleton } from '@/components/ui'

useSeo({ title: 'Ваш заказ — Greenol', description: 'Статус вашего заказа.', path: '/order', noindex: true })

const route = useRoute()
const order = ref<PublicOrder | null>(null)
const loading = ref(true)
const error = ref('')
const busy = ref(false)
let tracked = false

async function load() {
  try {
    order.value = await api.getOrder(String(route.query.id ?? ''))
    error.value = ''
  } catch { error.value = 'Не удалось получить статус заказа. Попробуйте обновить страницу.' }
  loading.value = false
  // Успешная оплата в метрике — только когда статус подтверждён API (не по возврату пользователя)
  if (order.value?.payment.status === 'paid' && !tracked) {
    tracked = true
    track('purchase', { total: order.value.total })
    ecommerce('purchase', order.value.items.map((i) => ({ id: i.sku, name: i.title, price: i.price, quantity: i.qty })), { id: order.value.number, revenue: order.value.total })
  }
}
onMounted(() => { load(); window.addEventListener('focus', load) })
onBeforeUnmount(() => window.removeEventListener('focus', load))

async function simulate(o: PaymentOutcome) {
  if (busy.value || !order.value) return
  busy.value = true
  try { order.value = await api.simulatePayment(order.value.id, o); await load() } finally { busy.value = false }
}
async function retry() {
  if (busy.value || !order.value) return
  busy.value = true
  try { order.value = await api.retryPayment(order.value.id) } finally { busy.value = false }
}

const methodTitle = computed(() => paymentMethods.find((m) => m.id === order.value?.payment.method)?.title)
const isCard = computed(() => order.value?.payment.method === 'card')
const status = computed(() => order.value?.payment.status)

const classes = {
  title: 'mb-5 text-2xl font-bold sm:text-3xl',
  wrap: 'flex max-w-2xl flex-col gap-4',
  card: 'flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5',
  line: 'flex justify-between gap-4 text-sm',
  total: 'flex justify-between border-t border-slate-200 pt-3 text-lg font-bold',
  h2: 'text-lg font-semibold',
  dl: 'grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-sm',
  dt: 'text-slate-500',
  sandbox: 'flex flex-col gap-3 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50 p-5',
  actions: 'flex flex-wrap gap-2',
}
</script>

<template>
  <div v-if="loading" :class="classes.wrap"><UiSkeleton class="h-24" /><UiSkeleton class="h-48" /></div>
  <UiAlert v-else-if="error" tone="danger" title="Ошибка">{{ error }} <UiButton size="sm" variant="secondary" @click="load">Повторить</UiButton></UiAlert>
  <UiEmptyState v-else-if="!order" title="Заказ не найден" text="Проверьте ссылку. Если вы оформили заказ на другом устройстве, найдите его по номеру у менеджера.">
    <UiButton to="/catalog">В каталог</UiButton>
  </UiEmptyState>
  <template v-else>
    <h1 :class="classes.title">Заказ № {{ order.number }}</h1>
    <div :class="classes.wrap">
      <UiAlert v-if="status === 'paid'" tone="success" title="Оплата получена">Спасибо за покупку! Мы приступили к обработке заказа.</UiAlert>
      <UiAlert v-else-if="status === 'cancelled'" tone="warning" title="Оплата отменена">Заказ сохранён, деньги не списаны. Вы можете повторить оплату.</UiAlert>
      <UiAlert v-else-if="status === 'failed'" tone="danger" title="Оплата не прошла">Деньги не списаны. Повторите попытку или выберите другую карту.</UiAlert>
      <UiAlert v-else-if="status === 'pending'" tone="info" title="Ожидаем оплату">Заказ создан и ждёт оплаты. Статус обновится после подтверждения банком.</UiAlert>
      <UiAlert v-else tone="success" title="Заказ принят">Менеджер свяжется с вами по телефону {{ order.customer.phone }} для подтверждения.</UiAlert>

      <section v-if="isCard && (status === 'pending' || status === 'failed' || status === 'cancelled') && site.paymentMode === 'sandbox'" :class="classes.sandbox" aria-label="Тестовая оплата">
        <div><UiBadge tone="warning">Тестовая оплата</UiBadge></div>
        <p class="text-sm">Банковский модуль ещё не подключён: здесь можно имитировать ответ платёжной страницы. Реальные деньги не списываются.</p>
        <div v-if="status === 'pending'" :class="classes.actions">
          <UiButton :loading="busy" @click="simulate('paid')">Оплата прошла успешно</UiButton>
          <UiButton variant="outline" :disabled="busy" @click="simulate('failed')">Ошибка оплаты</UiButton>
          <UiButton variant="outline" :disabled="busy" @click="simulate('cancelled')">Отменить оплату</UiButton>
        </div>
        <UiButton v-else :loading="busy" @click="retry">Повторить оплату</UiButton>
      </section>

      <section :class="classes.card" aria-labelledby="o-items">
        <h2 id="o-items" :class="classes.h2">Состав заказа</h2>
        <div v-for="i in order.items" :key="i.sku" :class="classes.line"><span>{{ i.title }}{{ i.label ? `, ${i.label}` : '' }} × {{ i.qty }}</span><span class="shrink-0">{{ formatPrice(i.price * i.qty) }}</span></div>
        <div :class="classes.line"><span>Товары</span><span>{{ formatPrice(order.subtotal) }}</span></div>
        <div :class="classes.line"><span>Доставка, {{ order.delivery.providerTitle }} (ориентировочно)</span><span>{{ formatPrice(order.delivery.price) }}</span></div>
        <div :class="classes.total"><span>Итого</span><span>{{ formatPrice(order.total) }}</span></div>
      </section>
      <section :class="classes.card" aria-labelledby="o-info">
        <h2 id="o-info" :class="classes.h2">Данные заказа</h2>
        <dl :class="classes.dl">
          <dt :class="classes.dt">Получатель</dt><dd>{{ order.customer.name }}, {{ order.customer.phone }}</dd>
          <dt :class="classes.dt">Доставка</dt><dd>{{ order.delivery.city }}, {{ order.delivery.address }}</dd>
          <dt :class="classes.dt">Оплата</dt><dd>{{ methodTitle }}</dd>
        </dl>
      </section>
      <div :class="classes.actions"><UiButton to="/catalog" variant="secondary">Продолжить покупки</UiButton><UiButton variant="ghost" @click="load">Обновить статус</UiButton></div>
    </div>
  </template>
</template>
