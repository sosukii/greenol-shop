<script setup lang="ts">
// Поле «Город» с подсказками на Headless UI (Combobox). Справочник — src/data/cities.ts;
// ввод свободный: если города нет в списке, остаётся то, что набрано.
import { Combobox, ComboboxInput, ComboboxLabel, ComboboxOption, ComboboxOptions } from '@headlessui/vue'
import { computed, watch, ref } from 'vue'
import { suggestCities } from '@/data/cities'

const props = defineProps<{ label: string; placeholder?: string; error?: string }>()
const model = defineModel<string>({ default: '' })
const items = computed(() => suggestCities(model.value))

// при открытии прокручиваем страницу так, чтобы список целиком был виден (над нижней панелью на телефоне)
const listRef = ref<{ $el: HTMLElement } | null>(null)
watch(listRef, (c) => c?.$el?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' }))

const classes = {
  root: 'relative flex flex-col gap-1.5',
  label: 'text-sm font-medium text-slate-700',
  input: computed(() => [
    'h-11 w-full rounded-xl border bg-white px-3.5 text-base outline-none transition-colors',
    'placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100',
    props.error ? 'border-red-500' : 'border-slate-300',
  ]),
  list: 'scroll-mb-24 absolute left-0 right-0 top-full z-30 mt-1 max-h-64 overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg outline-none',
  option: (active: boolean) => ['cursor-pointer px-3.5 py-2.5 text-base', active ? 'bg-brand-50 text-brand-700' : 'text-slate-800'],
  error: 'text-sm text-red-600',
}
</script>

<template>
  <Combobox v-model="model" as="div" nullable :class="classes.root">
    <ComboboxLabel :class="classes.label">{{ label }}</ComboboxLabel>
    <ComboboxInput
      :class="classes.input.value"
      :display-value="(v) => (v as string) ?? ''"
      :placeholder="placeholder"
      autocomplete="off"
      :aria-invalid="!!error"
      @input="model = ($event.target as HTMLInputElement).value"
      @focus="($event.target as HTMLInputElement).click()"
    />
    <ComboboxOptions v-if="items.length" ref="listRef" :class="classes.list">
      <ComboboxOption v-for="c in items" :key="c" v-slot="{ active }" :value="c" as="template">
        <li :class="classes.option(active)">{{ c }}</li>
      </ComboboxOption>
    </ComboboxOptions>
    <p v-if="error" role="alert" :class="classes.error">{{ error }}</p>
  </Combobox>
</template>
