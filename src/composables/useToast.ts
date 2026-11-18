import { ref } from 'vue'

export interface Toast { id: number; text: string; tone: 'success' | 'info' | 'danger'; to?: string }
export const toasts = ref<Toast[]>([])
let seq = 0

export function toast(text: string, tone: Toast['tone'] = 'success', to?: string, ms = 3500) {
  const id = ++seq
  toasts.value = [...toasts.value.slice(-2), { id, text, tone, to }]
  setTimeout(() => { toasts.value = toasts.value.filter((t) => t.id !== id) }, ms)
}
