import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { api } from '@/api'

const KEY = 'greenol:city'
const KEY_RECENT = 'greenol:cities-recent'

/**
 * Город доставки: один на весь сайт (карточка товара, корзина, чекаут, калькулятор).
 * Запоминается в браузере вместе с тремя последними городами; если города ещё нет —
 * тихо определяется по IP через наш сервер (без всплывающих вопросов).
 */
export const useDeliveryStore = defineStore('delivery', () => {
  const city = ref('')
  const recent = ref<string[]>([])
  const ready = ref(false)
  const autoCity = ref('')
  /** Город подставлен автоматически и пользователь его не менял */
  const isAuto = computed(() => !!autoCity.value && city.value === autoCity.value)

  function hydrate() {
    if (ready.value) return
    try {
      city.value = localStorage.getItem(KEY) ?? ''
      recent.value = JSON.parse(localStorage.getItem(KEY_RECENT) ?? '[]')
    } catch { /* storage недоступен */ }
    ready.value = true
    watch(city, (v) => { try { localStorage.setItem(KEY, v) } catch { /* ignore */ } })
    watch(recent, (v) => { try { localStorage.setItem(KEY_RECENT, JSON.stringify(v)) } catch { /* ignore */ } }, { deep: true })
    if (!city.value) void detect()
  }

  async function detect() {
    const c = await api.geoCity()
    if (c && !city.value) { city.value = c; autoCity.value = c }
  }

  /** Запоминает город как «последний указанный» (максимум три, без повторов) */
  function remember(value: string) {
    const v = value.trim()
    if (v.length < 2) return
    recent.value = [v, ...recent.value.filter((x) => x.toLowerCase() !== v.toLowerCase())].slice(0, 3)
  }

  return { city, recent, ready, isAuto, hydrate, remember }
})
