export const normalizePhone = (v: string): string => {
  const d = v.replace(/\D/g, '')
  if (d.length === 11 && /^[78]/.test(d)) return '+7' + d.slice(1)
  if (d.length === 10) return '+7' + d
  return ''
}
export const validatePhone = (v: string) => (normalizePhone(v) ? '' : 'Введите телефон в формате +7 900 000-00-00')
export const validateRequired = (label: string) => (v: string) => (v.trim() ? '' : `Укажите ${label}`)
export const validateEmail = (v: string) =>
  !v.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Проверьте адрес электронной почты'
export const validateLength = (label: string, max: number) => (v: string) =>
  v.length > max ? `${label}: не более ${max} символов` : ''
/** Убирает управляющие символы и обрезает строку — защита от мусора и раздутых данных */
export const clean = (v: unknown, max = 500): string =>
  String(v ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max)
