<script setup lang="ts">
import { computed } from 'vue'
import UiIcon from './UiIcon.vue'

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

// Состояния собираются целиком, а не наслаиваются: иначе bg-white перебивает цвет текущей страницы.
// enabled: — hover только у доступных кнопок, у неактивных стрелок его нет.
const base = 'inline-flex size-11 items-center justify-center rounded-xl border text-sm font-medium transition-colors'
const classes = {
  root: 'mt-8 flex flex-wrap items-center justify-center gap-1.5',
  page: `${base} border-slate-300 bg-white text-slate-800 hover:border-brand-500`,
  current: `${base} border-brand-600 bg-brand-600 text-white`,
  arrow: `${base} border-slate-300 bg-white text-slate-700 enabled:hover:border-brand-500 disabled:cursor-not-allowed disabled:opacity-40`,
  dots: 'px-1 text-slate-400',
}
</script>

<template>
  <nav v-if="pages > 1" :class="classes.root" aria-label="Страницы">
    <button type="button" :class="classes.arrow" :disabled="page <= 1" aria-label="Предыдущая страница" @click="emit('change', page - 1)">
      <UiIcon name="chevronLeft" :size="18" />
    </button>
    <template v-for="(p, i) in list" :key="i">
      <span v-if="p === '…'" :class="classes.dots">…</span>
      <button v-else type="button" :class="p === page ? classes.current : classes.page" :aria-current="p === page ? 'page' : undefined" :aria-label="`Страница ${p}`" @click="emit('change', p)">{{ p }}</button>
    </template>
    <button type="button" :class="classes.arrow" :disabled="page >= pages" aria-label="Следующая страница" @click="emit('change', page + 1)">
      <UiIcon name="chevron" :size="18" />
    </button>
  </nav>
</template>
