<script setup lang="ts">
import { useId } from 'vue'
defineProps<{ label: string; placeholder?: string; rows?: number; error?: string }>()
const model = defineModel<string>({ default: '' })
const id = useId()
const classes = {
  root: 'flex flex-col gap-1.5',
  label: 'text-sm font-medium text-slate-700',
  area: 'rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-base placeholder:text-slate-400 field-quiet',
  err: 'text-sm text-red-600',
}
</script>

<template>
  <div :class="classes.root">
    <label :for="id" :class="classes.label">{{ label }}</label>
    <textarea :id="id" v-model="model" :rows="rows ?? 3" :placeholder="placeholder" maxlength="1000" :class="classes.area" />
    <p v-if="error" :class="classes.err" role="alert">{{ error }}</p>
  </div>
</template>
