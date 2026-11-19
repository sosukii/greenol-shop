<script setup lang="ts">
import { computed, useId } from 'vue'

const props = defineProps<{
  label: string
  type?: string
  placeholder?: string
  error?: string
  hint?: string
  autocomplete?: string
  inputmode?: 'text' | 'tel' | 'email' | 'numeric'
  /** без цветной обводки при фокусе */
  quiet?: boolean
}>()
const model = defineModel<string>({ default: '' })
const id = useId()

const classes = {
  root: 'flex flex-col gap-1.5',
  label: 'text-sm font-medium text-slate-700',
  input: computed(() => [
    'h-11 w-full rounded-xl border bg-white px-3.5 text-base outline-none transition-colors',
    'placeholder:text-slate-400 disabled:bg-slate-100',
    'field-quiet',
    props.error ? 'border-red-500' : 'border-slate-300',
  ]),
  error: 'text-sm text-red-600',
  hint: 'text-sm text-slate-500',
}
</script>

<template>
  <div :class="classes.root">
    <label :for="id" :class="classes.label">{{ label }}</label>
    <input
      :id="id"
      v-model="model"
      :type="type ?? 'text'"
      :placeholder="placeholder"
      :autocomplete="autocomplete"
      :inputmode="inputmode"
      :aria-invalid="!!error"
      :aria-describedby="error || hint ? id + '-msg' : undefined"
      :class="classes.input.value"
    />
    <p v-if="error" :id="id + '-msg'" :class="classes.error" role="alert">{{ error }}</p>
    <p v-else-if="hint" :id="id + '-msg'" :class="classes.hint">{{ hint }}</p>
  </div>
</template>
