<script setup lang="ts">
import { UiButton, UiEmptyState } from '@/components/ui'
</script>

<template>
  <UiEmptyState title="Страница не найдена" text="Возможно, ссылка устарела или адрес введён с ошибкой.">
    <UiButton to="/">На главную</UiButton>
  </UiEmptyState>
</template>
