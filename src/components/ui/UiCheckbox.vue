<script setup lang="ts">
defineProps<{ label?: string; error?: string }>()
const model = defineModel<boolean>({ default: false })
const classes = {
  root: 'flex min-h-11 cursor-pointer items-start gap-3 py-1.5 text-sm',
  box: 'mt-0.5 size-5 shrink-0 cursor-pointer accent-brand-600',
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
