<script setup lang="ts">
import { useId } from 'vue'

defineProps<{ label?: string; options: { value: string; label: string }[] }>()
const model = defineModel<string>({ default: '' })
const id = useId()

const classes = {
  root: 'flex flex-col gap-1.5',
  label: 'text-sm font-medium text-slate-700',
  select:
    'h-11 rounded-xl border border-slate-300 bg-white px-3 text-base outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100',
}
</script>

<template>
  <div :class="classes.root">
    <label v-if="label" :for="id" :class="classes.label">{{ label }}</label>
    <select :id="id" v-model="model" :class="classes.select">
      <option v-for="o in options" :key="o.value" :value="o.value">{{ o.label }}</option>
    </select>
  </div>
</template>
