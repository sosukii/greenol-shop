const rub = new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 })
export const formatPrice = (v: number) => rub.format(v).replace(/ /g, ' ')

const dateFmt = new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
export const formatDate = (iso: string) => dateFmt.format(new Date(iso))

/** Путь к статике с учётом base (GitHub Pages живёт в подпапке) */
export const asset = (p: string) => import.meta.env.BASE_URL + p.replace(/^\//, '')

export const plural = (n: number, one: string, few: string, many: string) => {
  const m10 = n % 10, m100 = n % 100
  if (m10 === 1 && m100 !== 11) return one
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few
  return many
}

const dayMonth = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' })
const addDays = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return d }

/** «21–25 ноября» или «28 ноября – 2 декабря» — календарные сроки по числу дней в пути */
export function deliveryDates(daysMin: number, daysMax: number) {
  const a = addDays(daysMin), b = addDays(daysMax)
  if (a.getMonth() === b.getMonth()) return `${a.getDate()}–${dayMonth.format(b)}`
  return `${dayMonth.format(a)} – ${dayMonth.format(b)}`
}
