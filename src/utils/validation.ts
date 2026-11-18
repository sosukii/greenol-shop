export const normalizePhone = (v: string) => v.replace(/[^\d+]/g, '')

export function validatePhone(v: string): string {
  const digits = v.replace(/\D/g, '')
  return digits.length === 11 && /^[78]/.test(digits) ? '' : 'Введите телефон в формате +7 900 000-00-00'
}
export const validateRequired = (label: string) => (v: string) => (v.trim() ? '' : `Укажите ${label}`)
export const validateEmail = (v: string) =>
  !v.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'Проверьте адрес электронной почты'
