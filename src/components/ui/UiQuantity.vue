<script setup lang="ts">
import UiIcon from './UiIcon.vue'
const props = withDefaults(defineProps<{ min?: number; max?: number }>(), { min: 1, max: 99 })
const model = defineModel<number>({ default: 1 })

function set(v: number) {
  model.value = Math.min(props.max, Math.max(props.min, v))
}

const classes = {
  root: 'inline-flex h-11 items-center rounded-xl border border-slate-300 bg-white',
  btn: 'inline-flex size-11 items-center justify-center text-slate-700 hover:text-brand-600 disabled:text-slate-300',
  value: 'min-w-8 text-center font-semibold tabular-nums',
}
</script>

<template>
  <div :class="classes.root">
    <button type="button" :class="classes.btn" :disabled="model <= min" aria-label="Уменьшить" @click="set(model - 1)"><UiIcon name="minus" :size="20" /></button>
    <span :class="classes.value" aria-live="polite">{{ model }}</span>
    <button type="button" :class="classes.btn" :disabled="model >= max" aria-label="Увеличить" @click="set(model + 1)"><UiIcon name="plus" :size="20" /></button>
  </div>
</template>
