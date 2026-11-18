// Локальный режим: «бэкенд» работает в браузере (localStorage) на тех же правилах, что и сервер
// (общее ядро src/core). Подходит для демонстрации на статическом хостинге.
import { demoAdmin } from '@/config/admin-demo'
import { verifyPassword } from '@/core/auth'
import { applyPaymentEvent, createLead, createOrder, markPaidManually, retryPayment, setLeadStatus, setOrderStatus, type Store } from '@/core/orders'
import type { Lead, Order } from '@/core/types'
import type { Api, PublicOrder } from './types'

const read = <T>(k: string): T[] => {
  try { return JSON.parse(localStorage.getItem(k) ?? '[]') } catch { return [] }
}
const write = (k: string, v: unknown) => localStorage.setItem(k, JSON.stringify(v))
const upsert = <T extends { id: string }>(k: string, item: T) => {
  const all = read<T>(k)
  const i = all.findIndex((x) => x.id === item.id)
  if (i >= 0) all[i] = item
  else all.push(item)
  write(k, all)
}

const store: Store = {
  listOrders: async () => read<Order>('greenol:orders'),
  saveOrder: async (o) => upsert('greenol:orders', o),
  listLeads: async () => read<Lead>('greenol:leads'),
  saveLead: async (l) => upsert('greenol:leads', l),
}

const pub = ({ history: _h, idempotencyKey: _k, utm: _u, ...rest }: Order): PublicOrder => rest
const SESSION = 'greenol:admin'
const requireAuth = () => {
  if (sessionStorage.getItem(SESSION) !== '1') throw new Error('unauthorized')
}
const find = async (id: string) => (await store.listOrders()).find((o) => o.id === id) ?? null

export const localApi: Api = {
  mode: 'local',
  createOrder: async (i) => pub(await createOrder(store, i)),
  getOrder: async (id) => {
    const o = await find(id)
    return o ? pub(o) : null
  },
  simulatePayment: async (id, outcome) => pub(await applyPaymentEvent(store, id, outcome)),
  retryPayment: async (id) => pub(await retryPayment(store, id)),
  createLead: async (i) => {
    await createLead(store, i)
  },
  admin: {
    async login(user, password) {
      const ok = user === demoAdmin.user && (await verifyPassword(password, demoAdmin.hash))
      if (ok) sessionStorage.setItem(SESSION, '1')
      return ok
    },
    logout: async () => sessionStorage.removeItem(SESSION),
    isAuthed: async () => sessionStorage.getItem(SESSION) === '1',
    async listOrders() {
      requireAuth()
      return (await store.listOrders()).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    },
    async getOrder(id) {
      requireAuth()
      return find(id)
    },
    async setOrderStatus(id, status, note) {
      requireAuth()
      return setOrderStatus(store, id, status, 'admin', note)
    },
    async markPaid(id, reason) {
      requireAuth()
      return markPaidManually(store, id, 'admin', reason)
    },
    async listLeads() {
      requireAuth()
      return (await store.listLeads()).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    },
    async setLeadStatus(id, status) {
      requireAuth()
      return setLeadStatus(store, id, status)
    },
  },
}
