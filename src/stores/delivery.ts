import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const KEY = 'greenol:city'

/** Город доставки: один на весь сайт (карточка товара, корзина, чекаут, калькулятор), хранится в браузере */
export const useDeliveryStore = defineStore('delivery', () => {
  const city = ref('')
  const ready = ref(false)

  function hydrate() {
    if (ready.value) return
    try { city.value = localStorage.getItem(KEY) ?? '' } catch { /* storage недоступен */ }
    ready.value = true
    watch(city, (v) => {
      try { localStorage.setItem(KEY, v) } catch { /* storage недоступен */ }
    })
  }

  return { city, ready, hydrate }
})
