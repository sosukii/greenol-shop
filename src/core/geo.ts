// Сопоставление названия города из геолокации по IP (латиницей, например «Nizhniy Novgorod»)
// с нашим справочником городов (кириллицей). Работает без внешних сервисов: обе записи приводятся
// к «скелету» из согласных, по которому города однозначно различаются.

/** Англоязычные названия, которые не совпадают с русскими фонетически */
const aliases: Record<string, string> = {
  'saint petersburg': 'Санкт-Петербург', 'st petersburg': 'Санкт-Петербург', 'sankt-peterburg': 'Санкт-Петербург',
  'rostov-on-don': 'Ростов-на-Дону', 'rostov on don': 'Ростов-на-Дону', 'rostov': 'Ростов-на-Дону',
  'komsomolsk-on-amur': 'Комсомольск-на-Амуре', 'petropavlovsk-kamchatsky': 'Петропавловск-Камчатский',
  'veliky novgorod': 'Великий Новгород', 'velikiy novgorod': 'Великий Новгород',
  'yuzhno-sakhalinsk': 'Южно-Сахалинск', 'novyy urengoy': 'Новый Уренгой', 'novy urengoy': 'Новый Уренгой',
}

const ru2lat: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o',
  п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sh', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
}
const translit = (s: string) => [...s.toLowerCase()].map((c) => ru2lat[c] ?? c).join('')

/** «Скелет» названия: согласные с учётом типичных расхождений в транслитерации (c→k, w→v, x→ks, ch/sh/zh/ts как единые звуки) */
export function skeleton(latin: string): string {
  return latin
    .toLowerCase()
    .replace(/[^a-z]/g, '')
    .replace(/shch|sch/g, 'S')
    .replace(/sh/g, 'S')
    .replace(/zh/g, 'Z')
    .replace(/ch/g, 'C')
    .replace(/kh/g, '')
    .replace(/ts/g, 'T')
    .replace(/c/g, 'k')
    .replace(/w/g, 'v')
    .replace(/x/g, 'ks')
    .replace(/q/g, 'k')
    .replace(/[aeiouyhj]/g, '')
    .replace(/(.)\1+/g, '$1')
}

/** Находит город справочника по латинскому названию из геолокации; если не нашёлся однозначно — null */
export function matchCity(latin: string | undefined | null, cities: string[]): string | null {
  if (!latin) return null
  const key = latin.trim().toLowerCase().replace(/\s+/g, ' ')
  if (aliases[key]) return aliases[key]
  // 1) точное совпадение транслита (для коротких названий вроде Ufa, Tula, Sochi)
  const plain = key.replace(/[^a-z]/g, '')
  const exact = cities.filter((c) => translit(c).replace(/[^a-z]/g, '') === plain)
  if (exact.length === 1) return exact[0]
  // 2) совпадение по «скелету» согласных (разные варианты транслитерации); короткие скелеты слишком неоднозначны
  const sk = skeleton(latin)
  if (sk.length < 3) return null
  const found = cities.filter((c) => skeleton(translit(c)) === sk)
  return found.length === 1 ? found[0] : null
}
