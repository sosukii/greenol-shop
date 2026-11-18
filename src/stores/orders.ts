import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { CartItem } from './cart'

export type PaymentStatus = 'pending' | 'paid' | 'cancelled' | 'failed'

export interface Order {
  id: string
  createdAt: string
  items: CartItem[]
  subtotal: number
  deliveryPrice: number
  deliveryProvider: string
  total: number
  paymentStatus: PaymentStatus
}

const KEY = 'max-shop:orders:v1'
const load = (): Order[] => {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') } catch { return [] }
}

/**
 * MOCK: заказы хранятся в браузере. В реальной версии заказ создаёт сервер,
 * а статус оплаты подтверждается webhook банка, а не возвратом пользователя.
 */
export const useOrdersStore = defineStore('orders', () => {
  const orders = ref<Order[]>(load())
  watch(orders, (v) => { try { localStorage.setItem(KEY, JSON.stringify(v)) } catch { /* noop */ } }, { deep: true })

  const get = (id: string) => orders.value.find((o) => o.id === id)

  function create(data: Omit<Order, 'id' | 'createdAt' | 'paymentStatus'>): Order {
    const order: Order = { ...data, id: crypto.randomUUID().slice(0, 8).toUpperCase(), createdAt: new Date().toISOString(), paymentStatus: 'pending' }
    orders.value.push(order)
    return order
  }

  function setStatus(id: string, status: PaymentStatus) {
    const o = get(id)
    // Повторная оплата уже оплаченного заказа невозможна
    if (o && o.paymentStatus !== 'paid') o.paymentStatus = status
  }

  return { orders, get, create, setStatus }
})
