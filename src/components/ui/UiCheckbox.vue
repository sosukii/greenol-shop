<script setup lang="ts">
defineProps<{ label?: string; error?: string }>()
const model = defineModel<boolean>({ default: false })
const classes = {
  // text-sm + leading-5 = 20px, как и сам чекбокс: бокс и первая строка текста стоят на одной линии по центру
  root: 'flex min-h-11 cursor-pointer items-start gap-3 py-3 text-sm leading-5',
  box: [
    'ui-check size-5 shrink-0 cursor-pointer appearance-none rounded-md border border-slate-300 bg-white transition-colors',
    'hover:border-brand-500 checked:border-brand-600 checked:bg-brand-600',
  ],
  err: 'text-sm text-red-600',
}
</script>

<template>
  <div>
    <label :class="classes.root">
      <input v-model="model" type="checkbox" :class="classes.box" />
      <span><slot>{{ label }}</slot></span>
    </label>
    <p v-if="error" :class="classes.err" role="alert">{{ error }}</p>
  </div>
</template>
