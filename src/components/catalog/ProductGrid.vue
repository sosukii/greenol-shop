<script setup lang="ts">
import type { Product } from '@/data/types'
import ProductCard from './ProductCard.vue'

defineProps<{ products: Product[]; priorityCount?: number }>()
const classes = { grid: 'grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4', item: 'animate-fade-up' }
</script>

<template>
  <ul :class="classes.grid">
    <li v-for="(p, i) in products" :key="p.id" :class="classes.item" :style="{ animationDelay: Math.min(i, 8) * 40 + 'ms' }">
      <ProductCard :product="p" :priority="i < (priorityCount ?? 0)" />
    </li>
  </ul>
</template>
