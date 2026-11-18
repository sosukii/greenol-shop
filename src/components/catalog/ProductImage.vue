<script setup lang="ts">
// Реальных фото пока нет — нейтральная заглушка вместо выдуманных изображений.
const classes = {
  root: 'flex aspect-square w-full items-center justify-center rounded-xl bg-slate-100 text-slate-400',
  icon: 'size-12',
  text: 'sr-only',
}
</script>

<template>
  <div :class="classes.root" role="img" aria-label="Фото будет добавлено">
    <svg :class="classes.icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="1.5" /><path d="m4 18 5-5 4 4 3-3 4 4" />
    </svg>
    <span :class="classes.text">Фото будет добавлено</span>
  </div>
</template>
