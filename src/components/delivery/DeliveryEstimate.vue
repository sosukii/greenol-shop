<script setup lang="ts">
// Быстрый расчёт доставки: вводим город (подсказки) — сразу видим цену и сроки СДЭК и Ozon Доставки.
// Город общий для всего сайта (store), поэтому в корзине и чекауте он уже подставлен.
import { computed, onMounted } from 'vue'
import { deliveryProviders } from '@/config/site'
import { estimateDelivery } from '@/core/delivery'
import { useDeliveryStore } from '@/stores/delivery'
import { deliveryDates, formatPrice } from '@/utils/format'
import { UiCityInput } from '@/components/ui'

const props = defineProps<{ count: number; label?: string }>()
const place = useDeliveryStore()
onMounted(() => place.hydrate())

const rows = computed(() =>
  place.city.trim().length >= 2
    ? deliveryProviders.map((p) => ({ ...estimateDelivery(p.id, place.city, Math.max(1, props.count)), dates: deliveryDates(p.daysMin, p.daysMax) }))
    : [],
)

const classes = {
  list: 'mt-1 divide-y divide-slate-100',
  row: 'flex items-center justify-between gap-3 py-3',
  name: 'font-medium text-slate-900',
  when: 'text-sm text-slate-500',
  price: 'shrink-0 rounded-lg bg-slate-100 px-2.5 py-1 text-sm font-semibold text-slate-900',
  hint: 'mt-3 text-sm text-slate-500',
}
</script>

<template>
  <div>
    <UiCityInput v-model="place.city" :label="label ?? 'Город доставки'" placeholder="Например, Казань" :recent="place.recent" @commit="place.remember" />
    <ul v-if="rows.length" :class="classes.list" aria-live="polite">
      <li v-for="r in rows" :key="r.provider" :class="classes.row">
        <div>
          <p :class="classes.name">{{ r.providerTitle }}</p>
          <p :class="classes.when">≈ {{ r.dates }} · {{ r.daysMin }}–{{ r.daysMax }} дн.</p>
        </div>
        <span :class="classes.price">≈ {{ formatPrice(r.price) }}</span>
      </li>
    </ul>
    <p v-if="place.isAuto" :class="classes.hint">Определили город по вашему местоположению. Если не угадали, просто измените.</p>
    <p v-if="rows.length" :class="classes.hint">Расчёт ориентировочный: точную стоимость и срок подтвердит менеджер после оформления.</p>
    <p v-else :class="classes.hint">Укажите город — покажем стоимость и сроки СДЭК и Ozon Доставки.</p>
  </div>
</template>
