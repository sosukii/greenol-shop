<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { api } from '@/api'
import type { Lead, LeadStatus } from '@/core/types'
import { formatDate } from '@/utils/format'
import { UiAlert, UiBadge, UiButton, UiEmptyState, UiSelect, UiSkeleton } from '@/components/ui'
import { leadStatusLabels, leadStatusTone, opts } from './labels'

const leads = ref<Lead[]>([])
const loading = ref(true)
const error = ref(false)
const filter = ref('')

async function load() {
  loading.value = true
  error.value = false
  try { leads.value = await api.admin.listLeads() } catch { error.value = true } finally { loading.value = false }
}
onMounted(load)
const shown = computed(() => leads.value.filter((l) => !filter.value || l.status === filter.value))

async function setStatus(l: Lead, status: string) {
  try { Object.assign(l, await api.admin.setLeadStatus(l.id, status as LeadStatus)) } catch { error.value = true }
}

const classes = {
  head: 'mb-4 flex flex-wrap items-end justify-between gap-3',
  list: 'flex flex-col gap-3',
  card: 'grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-[1fr_1fr_12rem] md:items-start',
  sub: 'text-xs text-slate-500',
}
</script>

<template>
  <div :class="classes.head">
    <h1 class="text-2xl font-bold">Лиды</h1>
    <div class="w-56"><UiSelect v-model="filter" label="Статус" :options="opts(leadStatusLabels, 'Все')" /></div>
  </div>
  <div v-if="loading" class="flex flex-col gap-3"><UiSkeleton class="h-24" /><UiSkeleton class="h-24" /></div>
  <UiAlert v-else-if="error" tone="danger" title="Не удалось загрузить заявки"><UiButton size="sm" variant="secondary" @click="load">Повторить</UiButton></UiAlert>
  <UiEmptyState v-else-if="!leads.length" title="Заявок пока нет" text="Заявки из формы обратного звонка и запросы цены появятся здесь." />
  <UiEmptyState v-else-if="!shown.length" title="Нет заявок с таким статусом" />
  <ul v-else :class="classes.list">
    <li v-for="l in shown" :key="l.id" :class="classes.card">
      <div>
        <p class="font-semibold">{{ l.name }}</p>
        <a :href="`tel:${l.phone}`" class="text-brand-600">{{ l.phone }}</a>
        <p :class="classes.sub">{{ formatDate(l.createdAt) }} · источник: {{ l.source }}</p>
        <p v-if="l.utm" :class="classes.sub">UTM: {{ Object.entries(l.utm).map(([k, v]) => `${k}=${v}`).join(', ') }}</p>
      </div>
      <p class="text-sm text-slate-700">{{ l.message || 'Без сообщения' }}</p>
      <div class="flex flex-col gap-2">
        <UiBadge :tone="leadStatusTone[l.status]" class="self-start">{{ leadStatusLabels[l.status] }}</UiBadge>
        <UiSelect :model-value="l.status" :options="opts(leadStatusLabels)" label="Сменить статус" @update:model-value="setStatus(l, $event)" />
      </div>
    </li>
  </ul>
</template>
