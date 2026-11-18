// HTTP-режим: работает с бэкендом из server/ (VITE_API_URL).
import { ValidationError } from '@/core/types'
import type { Api } from './types'

export function createHttpApi(base: string): Api {
  async function req<T>(path: string, init?: RequestInit): Promise<T> {
    const r = await fetch(base + path, {
      ...init,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    })
    if (r.status === 422) throw new ValidationError((await r.json()).fields ?? {})
    if (r.status === 401) throw new Error('unauthorized')
    if (r.status === 404) return null as T
    if (!r.ok) throw new Error('api-error')
    return r.status === 204 ? (undefined as T) : r.json()
  }
  const post = <T>(path: string, body?: unknown) => req<T>(path, { method: 'POST', body: JSON.stringify(body ?? {}) })
  return {
    mode: 'http',
    createOrder: (i) => post('/api/orders', i),
    getOrder: (id) => req(`/api/orders/${id}`),
    simulatePayment: (id, outcome) => post(`/api/payments/sandbox/${id}/${outcome}`),
    retryPayment: (id) => post(`/api/orders/${id}/retry-payment`),
    createLead: (i) => post('/api/leads', i),
    admin: {
      login: async (user, password) => {
        try {
          await post('/api/admin/login', { user, password })
          return true
        } catch {
          return false
        }
      },
      logout: () => post('/api/admin/logout'),
      isAuthed: async () => {
        try {
          await req('/api/admin/me')
          return true
        } catch {
          return false
        }
      },
      listOrders: () => req('/api/admin/orders'),
      getOrder: (id) => req(`/api/admin/orders/${id}`),
      setOrderStatus: (id, status, note) => post(`/api/admin/orders/${id}/status`, { status, note }),
      markPaid: (id, reason) => post(`/api/admin/orders/${id}/mark-paid`, { reason }),
      listLeads: () => req('/api/admin/leads'),
      setLeadStatus: (id, status) => post(`/api/admin/leads/${id}/status`, { status }),
    },
  }
}
