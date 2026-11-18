<script setup lang="ts">
import { computed } from 'vue'
import manifest from '@/data/images.json'
import { asset } from '@/utils/format'
import { UiIcon } from '@/components/ui'

const props = defineProps<{ id?: string; alt: string; sizes?: string; priority?: boolean; size?: 'card' | 'full' }>()
const info = computed(() => (props.id ? (manifest as Record<string, { w: number; h: number; widths: number[] }>)[props.id] : undefined))
const srcset = computed(() => info.value?.widths.map((w) => `${asset(`img/p/${props.id}-${w}.webp`)} ${w}w`).join(', '))
const src = computed(() => info.value && asset(`img/p/${props.id}-${info.value.widths[Math.min(1, info.value.widths.length - 1)]}.webp`))

const classes = {
  box: 'relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl bg-white',
  img: 'size-full object-contain',
  empty: 'flex size-full flex-col items-center justify-center gap-2 bg-slate-100 text-slate-400',
  emptyText: 'text-xs',
}
</script>

<template>
  <div :class="classes.box">
    <img
      v-if="info"
      :src="src"
      :srcset="srcset"
      :sizes="sizes ?? '(min-width:1024px) 280px, (min-width:640px) 33vw, 50vw'"
      :width="info.w"
      :height="info.h"
      :alt="alt"
      :loading="priority ? 'eager' : 'lazy'"
      :fetchpriority="priority ? 'high' : 'auto'"
      decoding="async"
      :class="classes.img"
    />
    <div v-else :class="classes.empty" role="img" :aria-label="`${alt} — фото скоро появится`">
      <UiIcon name="image" :size="40" />
      <span :class="classes.emptyText">Фото скоро появится</span>
    </div>
  </div>
</template>
