<script setup lang="ts">
defineProps<{ title: string; text?: string }>()
const classes = {
  root: 'flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center',
  title: 'text-lg font-semibold',
  text: 'max-w-md text-slate-500',
}
</script>

<template>
  <div :class="classes.root">
    <h2 :class="classes.title">{{ title }}</h2>
    <p v-if="text" :class="classes.text">{{ text }}</p>
    <slot />
  </div>
</template>
