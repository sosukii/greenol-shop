<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'ghost'
    size?: 'sm' | 'md' | 'lg'
    to?: string
    href?: string
    loading?: boolean
    disabled?: boolean
    block?: boolean
    type?: 'button' | 'submit'
  }>(),
  { variant: 'primary', size: 'md', type: 'button' },
)

const variants = {
  primary: 'bg-brand-500 text-white hover:bg-brand-600 disabled:bg-slate-300',
  secondary: 'bg-brand-50 text-brand-600 hover:bg-brand-100 disabled:text-slate-400',
  ghost: 'bg-transparent text-slate-700 hover:bg-slate-100 disabled:text-slate-400',
}
const sizes = { sm: 'h-9 px-3 text-sm', md: 'h-11 px-5 text-base', lg: 'h-12 px-6 text-base' }

const classes = {
  root: computed(() => [
    'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors',
    'disabled:cursor-not-allowed',
    variants[props.variant],
    sizes[props.size],
    props.block ? 'w-full' : '',
  ]),
  spinner: 'size-4 animate-spin rounded-full border-2 border-current border-t-transparent',
}
</script>

<template>
  <RouterLink v-if="to" :to="to" :class="classes.root.value"><slot /></RouterLink>
  <a v-else-if="href" :href="href" target="_blank" rel="noopener" :class="classes.root.value"><slot /></a>
  <button v-else :type="type" :disabled="disabled || loading" :class="classes.root.value">
    <span v-if="loading" :class="classes.spinner" aria-hidden="true" />
    <slot />
  </button>
</template>
