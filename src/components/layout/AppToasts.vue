<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { toasts } from '@/composables/useToast'

const classes = {
  host: 'pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 md:bottom-6 md:items-end md:px-6',
  item: 'pointer-events-auto flex max-w-sm items-center gap-3 rounded-xl bg-slate-900 px-4 py-3 text-sm text-white shadow-lg',
  link: 'shrink-0 font-semibold text-brand-100 underline',
  danger: 'bg-red-700',
}
</script>

<template>
  <div :class="classes.host" aria-live="polite" aria-atomic="false">
    <TransitionGroup name="toast">
      <div v-for="t in toasts" :key="t.id" :class="[classes.item, t.tone === 'danger' && classes.danger]" role="status">
        <span>{{ t.text }}</span>
        <RouterLink v-if="t.to" :to="t.to" :class="classes.link">Открыть</RouterLink>
      </div>
    </TransitionGroup>
  </div>
</template>
