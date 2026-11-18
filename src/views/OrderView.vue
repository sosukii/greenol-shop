<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useOrdersStore } from '@/stores/orders'
import { useCartStore } from '@/stores/cart'
import { formatPrice } from '@/utils/format'
import { UiAlert, UiBadge, UiButton, UiEmptyState } from '@/components/ui'

const route = useRoute()
const orders = useOrdersStore()
const cart = useCartStore()
const order = computed(() => orders.get(route.params.id as string))

function simulate(status: 'paid' | 'cancelled' | 'failed') {
  if (!order.value) return
  orders.setStatus(order.value.id, status)
  if (status === 'paid') cart.clear()
}

const classes = {
  title: 'mb-4 text-2xl font-bold sm:text-3xl',
  card: 'flex max-w-2xl flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5',
  line: 'flex justify-between gap-4',
  actions: 'flex flex-wrap gap-2',
}
</script>

<template>
  <UiEmptyState v-if="!order" title="Заказ не найден" text="Заказы пока хранятся только в вашем браузере.">
    <UiButton to="/catalog">В каталог</UiButton>
  </UiEmptyState>
  <template v-else>
    <h1 :class="classes.title">Заказ № {{ order.id }}</h1>
    <div :class="classes.card">
      <UiAlert v-if="order.paymentStatus === 'paid'" tone="success" title="Оплата прошла успешно (тест)">Спасибо за заказ!</UiAlert>
      <UiAlert v-else-if="order.paymentStatus === 'cancelled'" tone="warning" title="Оплата отменена">Заказ сохранён — можно попробовать снова.</UiAlert>
      <UiAlert v-else-if="order.paymentStatus === 'failed'" tone="danger" title="Ошибка оплаты">Деньги не списаны. Попробуйте ещё раз.</UiAlert>
      <UiAlert v-else tone="info" title="Ожидает оплаты">
        Платёжный модуль банка не подключён. Ниже — имитация возврата с платёжной страницы.
        В реальной версии статус подтверждается серверным webhook.
      </UiAlert>

      <div v-for="i in order.items" :key="i.key" :class="classes.line">
        <span>{{ i.title }} × {{ i.qty }}</span><span>{{ formatPrice(i.price * i.qty) }}</span>
      </div>
      <div :class="classes.line"><span>Доставка ({{ order.deliveryProvider }}, тест)</span><span>{{ formatPrice(order.deliveryPrice) }}</span></div>
      <div :class="[classes.line, 'text-lg font-bold']"><span>Итого</span><span>{{ formatPrice(order.total) }}</span></div>
      <UiBadge tone="warning">Тестовый режим — реальных платежей нет</UiBadge>

      <div v-if="order.paymentStatus !== 'paid'" :class="classes.actions">
        <UiButton @click="simulate('paid')">Имитировать успех</UiButton>
        <UiButton variant="secondary" @click="simulate('cancelled')">Имитировать отмену</UiButton>
        <UiButton variant="ghost" @click="simulate('failed')">Имитировать ошибку</UiButton>
      </div>
      <UiButton v-else to="/catalog" variant="secondary">Продолжить покупки</UiButton>
    </div>
  </template>
</template>
