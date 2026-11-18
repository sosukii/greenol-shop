import type { RouteRecordRaw } from 'vue-router'

export const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: () => import('@/views/HomeView.vue') },
  { path: '/catalog/:slug?', name: 'catalog', component: () => import('@/views/CatalogView.vue') },
  { path: '/product/:slug', name: 'product', component: () => import('@/views/ProductView.vue') },
  { path: '/cart', name: 'cart', component: () => import('@/views/CartView.vue') },
  { path: '/checkout', name: 'checkout', component: () => import('@/views/CheckoutView.vue') },
  { path: '/order', name: 'order', component: () => import('@/views/OrderView.vue') },
  { path: '/about', name: 'about', component: () => import('@/views/AboutView.vue') },
  { path: '/delivery', name: 'delivery', component: () => import('@/views/DeliveryView.vue') },
  { path: '/contacts', name: 'contacts', component: () => import('@/views/ContactsView.vue') },
  {
    path: '/admin',
    component: () => import('@/views/admin/AdminLayout.vue'),
    meta: { admin: true },
    children: [
      { path: '', redirect: '/admin/orders' },
      { path: 'orders', name: 'admin-orders', component: () => import('@/views/admin/OrdersView.vue') },
      { path: 'order', name: 'admin-order', component: () => import('@/views/admin/OrderDetailView.vue') },
      { path: 'leads', name: 'admin-leads', component: () => import('@/views/admin/LeadsView.vue') },
      { path: 'analytics', name: 'admin-analytics', component: () => import('@/views/admin/AnalyticsView.vue') },
    ],
  },
  { path: '/admin/login', name: 'admin-login', component: () => import('@/views/admin/LoginView.vue') },
  { path: '/404', name: 'not-found-static', component: () => import('@/views/NotFoundView.vue') },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/views/NotFoundView.vue') },
]
