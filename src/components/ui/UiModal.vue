<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import UiIcon from './UiIcon.vue'

const props = defineProps<{ title: string; wide?: boolean }>()
const open = defineModel<boolean>({ default: false })
const panel = ref<HTMLElement>()
let previous: HTMLElement | null = null

watch(open, async (v) => {
  if (typeof document === 'undefined') return
  document.body.style.overflow = v ? 'hidden' : ''
  if (v) {
    previous = document.activeElement as HTMLElement
    await nextTick()
    panel.value?.focus()
  } else previous?.focus()
})

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') open.value = false
  if (e.key === 'Tab' && panel.value) {
    const f = [...panel.value.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])')]
    if (!f.length) return
    const first = f[0], last = f[f.length - 1]
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
  }
}

const classes = {
  overlay: 'fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4',
  panel: ['flex max-h-[92dvh] w-full flex-col rounded-t-2xl bg-white shadow-xl outline-none sm:rounded-2xl', props.wide ? 'sm:max-w-4xl' : 'sm:max-w-lg'],
  head: 'flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4',
  title: 'text-lg font-semibold',
  close: 'inline-flex size-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100',
  body: 'overflow-y-auto p-5',
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="open" :class="classes.overlay" @click.self="open = false" @keydown="onKey">
        <div ref="panel" :class="classes.panel" role="dialog" aria-modal="true" :aria-label="title" tabindex="-1">
          <div :class="classes.head">
            <h2 :class="classes.title">{{ title }}</h2>
            <button type="button" :class="classes.close" aria-label="Закрыть" @click="open = false"><UiIcon name="close" /></button>
          </div>
          <div :class="classes.body"><slot /></div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
