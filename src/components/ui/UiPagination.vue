<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ page: number; pages: number }>()
const emit = defineEmits<{ change: [page: number] }>()

const list = computed(() => {
  const out: (number | '…')[] = []
  for (let i = 1; i <= props.pages; i++) {
    if (i === 1 || i === props.pages || Math.abs(i - props.page) <= 1) out.push(i)
    else if (out[out.length - 1] !== '…') out.push('…')
  }
  return out
})

const classes = {
  root: 'mt-8 flex flex-wrap items-center justify-center gap-1.5',
  btn: 'inline-flex size-11 items-center justify-center rounded-xl border border-slate-300 bg-white text-sm font-medium hover:border-brand-500 disabled:opacity-40',
  active: 'border-brand-600 bg-brand-600 text-white hover:border-brand-600',
  dots: 'px-1 text-slate-400',
}
</script>

<template>
  <nav v-if="pages > 1" :class="classes.root" aria-label="Страницы">
    <button type="button" :class="classes.btn" :disabled="page <= 1" aria-label="Предыдущая страница" @click="emit('change', page - 1)">‹</button>
    <template v-for="(p, i) in list" :key="i">
      <span v-if="p === '…'" :class="classes.dots">…</span>
      <button v-else type="button" :class="[classes.btn, p === page && classes.active]" :aria-current="p === page ? 'page' : undefined" :aria-label="`Страница ${p}`" @click="emit('change', p)">{{ p }}</button>
    </template>
    <button type="button" :class="classes.btn" :disabled="page >= pages" aria-label="Следующая страница" @click="emit('change', page + 1)">›</button>
  </nav>
</template>
