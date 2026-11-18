<script setup lang="ts">
import PageShell from '@/components/layout/PageShell.vue'
import { UiAlert, UiButton } from '@/components/ui'
</script>

<template>
  <PageShell title="Доставка и оплата">
    <UiAlert tone="warning" title="Условия уточняются">
      Точные способы, сроки и стоимость доставки (СДЭК, Ozon) и оплаты будут добавлены после согласования с заказчиком.
    </UiAlert>
    <p>Предварительный расчёт стоимости доставки (тестовый) доступен при оформлении заказа.</p>
    <div><UiButton to="/cart" variant="secondary">Перейти в корзину</UiButton></div>
  </PageShell>
</template>
