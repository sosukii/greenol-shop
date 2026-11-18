<script setup lang="ts">
import { RouterLink } from 'vue-router'

defineProps<{ items: { label: string; to?: string }[] }>()

const classes = {
  root: 'mb-4 flex flex-wrap items-center gap-1.5 text-sm text-slate-500',
  link: 'hover:text-brand-600',
  current: 'text-slate-900',
  sep: 'text-slate-300',
}
</script>

<template>
  <nav aria-label="Хлебные крошки" :class="classes.root">
    <template v-for="(item, i) in items" :key="i">
      <RouterLink v-if="item.to" :to="item.to" :class="classes.link">{{ item.label }}</RouterLink>
      <span v-else :class="classes.current" aria-current="page">{{ item.label }}</span>
      <span v-if="i < items.length - 1" :class="classes.sep" aria-hidden="true">/</span>
    </template>
  </nav>
</template>
