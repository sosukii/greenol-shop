<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useHead } from '@unhead/vue'
import { api } from '@/api'
import { asset } from '@/utils/format'
import { UiAlert, UiButton, UiInput } from '@/components/ui'

useHead({ title: 'Вход в админку — Greenol', meta: [{ name: 'robots', content: 'noindex, nofollow' }] })
const route = useRoute()
const router = useRouter()
const user = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function submit() {
  error.value = ''
  if (!user.value || !password.value) { error.value = 'Введите логин и пароль'; return }
  loading.value = true
  try {
    if (await api.admin.login(user.value.trim(), password.value)) {
      const next = typeof route.query.next === 'string' && route.query.next.startsWith('/admin') ? route.query.next : '/admin/orders'
      await router.push(next)
    } else error.value = 'Неверный логин или пароль'
  } catch { error.value = 'Не удалось войти. Попробуйте позже.' } finally { loading.value = false }
}

const classes = {
  root: 'flex min-h-dvh items-center justify-center bg-slate-50 p-4',
  card: 'flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm',
}
</script>

<template>
  <div :class="classes.root">
    <form :class="classes.card" novalidate @submit.prevent="submit">
      <img :src="asset('img/logo.webp')" width="444" height="88" class="h-8 w-auto self-start" alt="Greenol" />
      <h1 class="text-xl font-bold">Вход в админку</h1>
      <UiAlert v-if="error" tone="danger">{{ error }}</UiAlert>
      <UiInput v-model="user" label="Логин" autocomplete="username" />
      <UiInput v-model="password" label="Пароль" type="password" autocomplete="current-password" />
      <UiButton type="submit" size="lg" block :loading="loading">Войти</UiButton>
      <UiButton to="/" variant="ghost" block>На сайт</UiButton>
    </form>
  </div>
</template>
