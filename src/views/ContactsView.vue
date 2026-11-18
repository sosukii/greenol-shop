<script setup lang="ts">
import { computed } from 'vue'
import { contacts } from '@/config'
import PageShell from '@/components/layout/PageShell.vue'
import { UiAlert, UiButton } from '@/components/ui'

const messengers = computed(() => [
  { label: 'MAX', href: contacts.max },
  { label: 'Telegram', href: contacts.telegram },
  { label: 'WhatsApp', href: contacts.whatsapp },
].filter((m) => m.href))
const hasAny = computed(() => messengers.value.length || contacts.phone || contacts.email)

const classes = { row: 'flex flex-wrap gap-3' }
</script>

<template>
  <PageShell title="Контакты">
    <UiAlert v-if="!hasAny" tone="info">Контактные данные и ссылки на MAX, Telegram и WhatsApp будут добавлены заказчиком.</UiAlert>
    <p v-if="contacts.phone">Телефон: <a :href="`tel:${contacts.phone}`" class="text-brand-600">{{ contacts.phone }}</a></p>
    <p v-if="contacts.email">Email: <a :href="`mailto:${contacts.email}`" class="text-brand-600">{{ contacts.email }}</a></p>
    <div v-if="messengers.length" :class="classes.row">
      <UiButton v-for="m in messengers" :key="m.label" :href="m.href" variant="secondary">{{ m.label }}</UiButton>
    </div>
  </PageShell>
</template>
