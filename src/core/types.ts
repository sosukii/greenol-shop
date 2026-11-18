export type OrderStatus = 'new' | 'confirmed' | 'shipped' | 'completed' | 'cancelled'
export type PaymentStatus = 'unpaid' | 'pending' | 'paid' | 'failed' | 'cancelled'
export type PaymentMethod = 'card' | 'cash' | 'invoice'
export type LeadStatus = 'new' | 'in_progress' | 'done' | 'spam'

export interface OrderItem {
  sku: string
  productId: string
  title: string
  label: string | null
  price: number
  qty: number
}

export interface HistoryEntry { at: string; by: string; action: string; note?: string }

export interface Order {
  id: string
  number: string
  createdAt: string
  updatedAt: string
  idempotencyKey: string
  customer: { name: string; phone: string; email?: string; comment?: string }
  delivery: { provider: string; providerTitle: string; city: string; address: string; price: number; daysMin: number; daysMax: number; estimated: boolean }
  payment: { method: PaymentMethod; status: PaymentStatus; externalId?: string }
  items: OrderItem[]
  subtotal: number
  total: number
  status: OrderStatus
  utm?: Record<string, string>
  history: HistoryEntry[]
}

export interface Lead {
  id: string
  createdAt: string
  name: string
  phone: string
  message?: string
  source: string
  utm?: Record<string, string>
  status: LeadStatus
}

export interface CreateOrderInput {
  idempotencyKey: string
  customer: { name: string; phone: string; email?: string; comment?: string }
  delivery: { provider: string; city: string; address: string }
  paymentMethod: PaymentMethod
  items: { sku: string; qty: number }[]
  utm?: Record<string, string>
}

export interface CreateLeadInput {
  name: string
  phone: string
  message?: string
  source: string
  utm?: Record<string, string>
  /** honeypot: у людей всегда пустое */
  website?: string
}

export class ValidationError extends Error {
  constructor(public fields: Record<string, string>) {
    super('validation')
  }
}
