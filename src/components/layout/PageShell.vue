<script setup lang="ts">
import { UiBreadcrumbs } from '@/components/ui'

defineProps<{ title: string; crumbs?: { label: string; to?: string }[] }>()
const classes = { title: 'mb-5 text-2xl font-bold sm:text-3xl', body: 'flex max-w-3xl flex-col gap-4 leading-7 text-slate-700' }
</script>

<template>
  <UiBreadcrumbs :items="[{ label: 'Главная', to: '/' }, ...(crumbs ?? []), { label: title }]" />
  <h1 :class="classes.title">{{ title }}</h1>
  <div :class="classes.body"><slot /></div>
</template>
