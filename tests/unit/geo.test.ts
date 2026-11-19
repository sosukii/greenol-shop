import { describe, expect, it } from 'vitest'
import { cities } from '@/data/cities'
import { matchCity, skeleton } from '@/core/geo'

describe('город по геолокации', () => {
  const cases: [string, string][] = [
    ['Moscow', 'Москва'], ['Saint Petersburg', 'Санкт-Петербург'], ['Novosibirsk', 'Новосибирск'], ['Yekaterinburg', 'Екатеринбург'],
    ['Kazan', 'Казань'], ['Nizhniy Novgorod', 'Нижний Новгород'], ['Krasnoyarsk', 'Красноярск'], ['Chelyabinsk', 'Челябинск'],
    ['Samara', 'Самара'], ['Ufa', 'Уфа'], ['Rostov-on-Don', 'Ростов-на-Дону'], ['Krasnodar', 'Краснодар'], ['Voronezh', 'Воронеж'],
    ['Perm', 'Пермь'], ['Volgograd', 'Волгоград'], ['Tyumen', 'Тюмень'], ['Tolyatti', 'Тольятти'], ['Izhevsk', 'Ижевск'],
    ['Khabarovsk', 'Хабаровск'], ['Vladivostok', 'Владивосток'], ['Yaroslavl', 'Ярославль'], ['Naberezhnyye Chelny', 'Набережные Челны'],
    ['Orel', 'Орёл'], ['Sochi', 'Сочи'], ['Tula', 'Тула'], ['Kaliningrad', 'Калининград'], ['Ulan-Ude', 'Улан-Удэ'],
  ]
  for (const [latin, ru] of cases) it(`${latin} → ${ru}`, () => expect(matchCity(latin, cities)).toBe(ru))

  it('неизвестный или неоднозначный город — null, а не неверный', () => {
    expect(matchCity('Springfield', cities)).toBeNull()
    expect(matchCity('', cities)).toBeNull()
    expect(matchCity(undefined, cities)).toBeNull()
  })
  it('скелет устойчив к вариантам транслитерации', () => {
    expect(skeleton('Moscow')).toBe(skeleton('Moskva'))
    expect(skeleton('Yekaterinburg')).toBe(skeleton('Ekaterinburg'))
  })
})
