<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'

const classes = { page: 'flex min-h-screen flex-col', main: 'mx-auto w-full max-w-6xl flex-1 px-4 py-6' }
</script>

<template>
  <div :class="classes.page">
    <AppHeader />
    <main :class="classes.main"><RouterView /></main>
    <AppFooter />
  </div>
</template>
