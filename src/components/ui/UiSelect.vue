<script setup lang="ts">
// Выпадающий список на Headless UI (Listbox): раскрывается под полем, клавиатура и ARIA из коробки.
import { Listbox, ListboxButton, ListboxLabel, ListboxOption, ListboxOptions } from '@headlessui/vue'
import { computed, watch, ref } from 'vue'
import UiIcon from './UiIcon.vue'

const props = defineProps<{ label?: string; options: { value: string; label: string }[] }>()
const model = defineModel<string>({ default: '' })
const current = computed(() => props.options.find((o) => o.value === model.value))

// при открытии прокручиваем страницу так, чтобы список целиком был виден (над нижней панелью на телефоне)
const listRef = ref<{ $el: HTMLElement } | null>(null)
watch(listRef, (c) => c?.$el?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' }))

const classes = {
  root: 'relative flex flex-col gap-1.5',
  label: 'text-sm font-medium text-slate-700',
  button:
    'flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-slate-300 bg-white pl-3.5 pr-3 text-left text-base field-quiet transition-colors data-[headlessui-state~=open]:border-slate-400',
  value: 'truncate',
  chevron: 'shrink-0 text-slate-500',
  list: 'scroll-mb-24 absolute left-0 right-0 top-full z-30 mt-1 max-h-64 overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg outline-none',
  option: (active: boolean, selected: boolean) => [
    'flex cursor-pointer items-center justify-between gap-2 px-3.5 py-2.5 text-base',
    active ? 'bg-brand-50 text-brand-700' : 'text-slate-800',
    selected ? 'font-medium' : '',
  ],
}
</script>

<template>
  <Listbox v-model="model" as="div" :class="classes.root">
    <ListboxLabel v-if="label" :class="classes.label">{{ label }}</ListboxLabel>
    <ListboxButton :class="classes.button">
      <span :class="classes.value">{{ current?.label ?? '' }}</span>
      <UiIcon name="chevronDown" :size="18" :class="classes.chevron" />
    </ListboxButton>
    <ListboxOptions ref="listRef" :class="classes.list">
      <ListboxOption v-for="o in options" :key="o.value" v-slot="{ active, selected }" :value="o.value" as="template">
        <li :class="classes.option(active, selected)">
          <span class="truncate">{{ o.label }}</span>
          <UiIcon v-if="selected" name="check" :size="16" class="shrink-0 text-brand-600" />
        </li>
      </ListboxOption>
    </ListboxOptions>
  </Listbox>
</template>
