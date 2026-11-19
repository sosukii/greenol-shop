import type { CreateLeadInput, CreateOrderInput, Lead, LeadStatus, Order, OrderStatus } from '@/core/types'

export type PublicOrder = Omit<Order, 'history' | 'idempotencyKey' | 'utm'>
export type PaymentOutcome = 'paid' | 'failed' | 'cancelled'

export interface Api {
  mode: 'local' | 'http'
  createOrder(input: CreateOrderInput): Promise<PublicOrder>
  getOrder(id: string): Promise<PublicOrder | null>
  /** Песочница платёжного шлюза: имитирует webhook банка */
  simulatePayment(id: string, outcome: PaymentOutcome): Promise<PublicOrder>
  retryPayment(id: string): Promise<PublicOrder>
  createLead(input: CreateLeadInput): Promise<void>
  /** Город посетителя (по IP на стороне сервера) для подстановки в расчёт доставки; null — не определён */
  geoCity(): Promise<string | null>
  admin: {
    login(user: string, password: string): Promise<boolean>
    logout(): Promise<void>
    isAuthed(): Promise<boolean>
    listOrders(): Promise<Order[]>
    getOrder(id: string): Promise<Order | null>
    setOrderStatus(id: string, status: OrderStatus, note?: string): Promise<Order>
    markPaid(id: string, reason: string): Promise<Order>
    listLeads(): Promise<Lead[]>
    setLeadStatus(id: string, status: LeadStatus): Promise<Lead>
  }
}
