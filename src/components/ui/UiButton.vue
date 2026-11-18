<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'ghost' | 'outline'
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
  primary: 'bg-brand-600 text-white hover:bg-brand-700 disabled:bg-slate-300',
  secondary: 'bg-brand-50 text-brand-700 hover:bg-brand-100 disabled:bg-slate-100 disabled:text-slate-400',
  outline: 'border border-slate-300 bg-white text-slate-800 hover:border-brand-500 hover:text-brand-600 disabled:text-slate-400',
  ghost: 'bg-transparent text-slate-700 hover:bg-slate-100 disabled:text-slate-400',
}
const sizes = { sm: 'min-h-10 px-3 text-sm', md: 'min-h-11 px-5 text-base', lg: 'min-h-12 px-6 text-base' }

const classes = {
  root: computed(() => [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap [&>svg]:shrink-0 rounded-xl font-semibold transition-[background-color,transform] duration-150 active:scale-[0.98]',
    'disabled:cursor-not-allowed disabled:active:scale-100',
    variants[props.variant],
    sizes[props.size],
    props.block ? 'w-full' : '',
  ]),
  spinner: 'size-4 animate-spin rounded-full border-2 border-current border-t-transparent',
}
</script>

<template>
  <RouterLink v-if="to" :to="to" :class="classes.root.value"><slot /></RouterLink>
  <a v-else-if="href" :href="href" target="_blank" rel="noopener noreferrer" :class="classes.root.value"><slot /></a>
  <button v-else :type="type" :disabled="disabled || loading" :class="classes.root.value">
    <span v-if="loading" :class="classes.spinner" aria-hidden="true" />
    <slot />
  </button>
</template>
