import { createRouter, createWebHashHistory } from 'vue-router'

// Hash-режим: GitHub Pages не умеет SPA-fallback для вложенных путей.
export const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    { path: '/', name: 'home', component: () => import('@/views/HomeView.vue') },
    { path: '/catalog/:slug?', name: 'catalog', component: () => import('@/views/CatalogView.vue') },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/views/NotFoundView.vue') },
  ],
})
