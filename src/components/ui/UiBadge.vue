<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{ tone?: 'brand' | 'success' | 'warning' | 'neutral' | 'danger' }>(), {
  tone: 'neutral',
})
const tones = {
  brand: 'bg-brand-50 text-brand-700',
  success: 'bg-leaf-50 text-leaf-700',
  warning: 'bg-amber-50 text-amber-800',
  danger: 'bg-red-50 text-red-700',
  neutral: 'bg-slate-100 text-slate-700',
}
const classes = {
  root: computed(() => ['inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium', tones[props.tone]]),
}
</script>

<template>
  <span :class="classes.root.value"><slot /></span>
</template>
