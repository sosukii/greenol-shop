import { ViteSSG } from 'vite-ssg'
import { createPinia } from 'pinia'
import App from './App.vue'
import { routes } from './router/routes'
import { api } from './api'
import { initMetrika, trackHit } from './composables/analytics'
import './style.css'

export const createApp = ViteSSG(
  App,
  { routes, base: import.meta.env.BASE_URL, scrollBehavior: (to, _from, saved) => saved ?? (to.hash ? { el: to.hash, behavior: 'smooth' } : { top: 0 }) },
  ({ app, router, isClient, initialState }) => {
    const pinia = createPinia()
    app.use(pinia)
    if (import.meta.env.SSR) initialState.pinia = pinia.state.value
    else pinia.state.value = initialState.pinia || {}

    if (isClient) {
      // Админка: доступ только после авторизации (в HTTP-режиме проверяет сервер)
      router.beforeEach(async (to) => {
        if (to.matched.some((r) => r.meta.admin) && !(await api.admin.isAuthed())) {
          return { name: 'admin-login', query: { next: to.fullPath } }
        }
      })
      initMetrika()
      let first = true
      router.afterEach((to) => {
        if (first) { first = false; return }
        trackHit(to.fullPath)
      })
    }
  },
)
