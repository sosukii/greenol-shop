<script setup lang="ts">
defineProps<{ class?: string }>()
const classes = { root: 'animate-pulse rounded-lg bg-slate-200' }
</script>

<template>
  <div :class="[classes.root, $props.class]" aria-hidden="true" />
</template>
