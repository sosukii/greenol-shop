<script setup lang="ts">
import { useSeo } from '@/composables/useSeo'
import { UiButton, UiEmptyState } from '@/components/ui'

useSeo({ title: 'Страница не найдена — Greenol', description: 'Запрошенная страница не найдена.', path: '/404', noindex: true })
</script>

<template>
  <UiEmptyState title="Страница не найдена" text="Возможно, ссылка устарела или адрес введён с ошибкой.">
    <h1 class="sr-only">Страница не найдена (404)</h1>
    <div class="flex flex-wrap justify-center gap-2">
      <UiButton to="/catalog">Перейти в каталог</UiButton>
      <UiButton to="/" variant="ghost">На главную</UiButton>
    </div>
  </UiEmptyState>
</template>
