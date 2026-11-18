import type { Store } from '@/core/orders'
import type { CreateOrderInput, Lead, Order } from '@/core/types'
import { products } from '@/data/catalog'

export function memoryStore(): Store & { orders: Order[]; leads: Lead[] } {
  const s = {
    orders: [] as Order[],
    leads: [] as Lead[],
    listOrders: async () => s.orders,
    saveOrder: async (o: Order) => {
      const i = s.orders.findIndex((x) => x.id === o.id)
      if (i >= 0) s.orders[i] = o
      else s.orders.push(o)
    },
    listLeads: async () => s.leads,
    saveLead: async (l: Lead) => {
      const i = s.leads.findIndex((x) => x.id === l.id)
      if (i >= 0) s.leads[i] = l
      else s.leads.push(l)
    },
  }
  return s
}

export const firstSku = products[0].offers[0].sku

export const orderInput = (over: Partial<CreateOrderInput> = {}): CreateOrderInput => ({
  idempotencyKey: 'key-' + Math.random().toString(36).slice(2),
  customer: { name: 'Иван', phone: '+7 916 000-00-00' },
  delivery: { provider: 'cdek', city: 'Москва', address: 'ул. Пример, 1' },
  paymentMethod: 'card',
  items: [{ sku: firstSku, qty: 2 }],
  ...over,
})
