<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{ tone?: 'info' | 'success' | 'warning' | 'danger'; title?: string }>(), {
  tone: 'info',
})
const tones = {
  info: 'border-brand-100 bg-brand-50 text-brand-700',
  success: 'border-green-200 bg-green-50 text-green-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
  danger: 'border-red-200 bg-red-50 text-red-800',
}
const classes = {
  root: computed(() => ['rounded-xl border p-4 text-sm', tones[props.tone]]),
  title: 'mb-1 font-semibold',
}
</script>

<template>
  <div :class="classes.root.value" role="status">
    <p v-if="title" :class="classes.title">{{ title }}</p>
    <slot />
  </div>
</template>
