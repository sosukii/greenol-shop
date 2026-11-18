import type { LeadStatus, OrderStatus, PaymentMethod, PaymentStatus } from '@/core/types'

export const orderStatusLabels: Record<OrderStatus, string> = {
  new: 'Новый', confirmed: 'Подтверждён', shipped: 'Отправлен', completed: 'Выполнен', cancelled: 'Отменён',
}
export const orderStatusTone: Record<OrderStatus, 'brand' | 'warning' | 'success' | 'neutral' | 'danger'> = {
  new: 'brand', confirmed: 'warning', shipped: 'warning', completed: 'success', cancelled: 'danger',
}
export const paymentStatusLabels: Record<PaymentStatus, string> = {
  unpaid: 'Не оплачен', pending: 'Ожидает оплаты', paid: 'Оплачен', failed: 'Ошибка оплаты', cancelled: 'Оплата отменена',
}
export const paymentStatusTone: Record<PaymentStatus, 'brand' | 'warning' | 'success' | 'neutral' | 'danger'> = {
  unpaid: 'neutral', pending: 'warning', paid: 'success', failed: 'danger', cancelled: 'neutral',
}
export const paymentMethodLabels: Record<PaymentMethod, string> = { card: 'Картой онлайн', cash: 'Наличными', invoice: 'По счёту' }
export const leadStatusLabels: Record<LeadStatus, string> = { new: 'Новая', in_progress: 'В работе', done: 'Обработана', spam: 'Спам' }
export const leadStatusTone: Record<LeadStatus, 'brand' | 'warning' | 'success' | 'neutral' | 'danger'> = {
  new: 'brand', in_progress: 'warning', done: 'success', spam: 'neutral',
}
export const opts = <T extends string>(labels: Record<T, string>, all?: string) => [
  ...(all ? [{ value: '', label: all }] : []),
  ...(Object.entries(labels) as [T, string][]).map(([value, label]) => ({ value, label })),
]
