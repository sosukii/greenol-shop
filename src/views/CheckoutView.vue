<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useCartStore } from '@/stores/cart'
import { deliveryProviders, type DeliveryQuote } from '@/services/delivery'
import { validateEmail, validatePhone, validateRequired } from '@/utils/validation'
import { formatPrice } from '@/utils/format'
import { UiAlert, UiBreadcrumbs, UiButton, UiEmptyState, UiInput, UiSkeleton } from '@/components/ui'

const cart = useCartStore()

const form = reactive({ name: '', phone: '', email: '', city: '', address: '', provider: 'cdek', consent: false })
const errors = reactive<Record<string, string>>({})
const submitted = ref(false)

const quote = ref<DeliveryQuote | null>(null)
const quoteLoading = ref(false)
const quoteError = ref('')
let seq = 0

// Пересчёт «на лету» при смене города, способа доставки и состава корзины
let timer: ReturnType<typeof setTimeout>
watch([() => form.city, () => form.provider, () => cart.count], () => {
  clearTimeout(timer)
  quote.value = null
  quoteError.value = ''
  if (!form.city.trim()) return
  quoteLoading.value = true
  timer = setTimeout(async () => {
    const id = ++seq
    try {
      const provider = deliveryProviders.find((p) => p.id === form.provider)!
      const q = await provider.quote({ city: form.city, itemsCount: cart.count, subtotal: cart.subtotal })
      if (id === seq) quote.value = q
    } catch {
      if (id === seq) quoteError.value = 'Не удалось рассчитать доставку. Попробуйте ещё раз.'
    } finally {
      if (id === seq) quoteLoading.value = false
    }
  }, 400)
})

const total = computed(() => cart.subtotal + (quote.value?.price ?? 0))

function validate() {
  errors.name = validateRequired('имя')(form.name)
  errors.phone = validatePhone(form.phone)
  errors.email = validateEmail(form.email)
  errors.city = validateRequired('город')(form.city)
  errors.address = validateRequired('адрес')(form.address)
  errors.consent = form.consent ? '' : 'Нужно согласие на обработку данных'
  return Object.values(errors).every((e) => !e)
}

function submit() {
  submitted.value = true
  if (!validate() || !quote.value) return
  // Создание заказа и оплата — в следующем коммите
}

const classes = {
  title: 'mb-4 text-2xl font-bold sm:text-3xl',
  layout: 'grid gap-6 lg:grid-cols-[1fr_22rem]',
  form: 'flex flex-col gap-6',
  card: 'flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5',
  h2: 'text-lg font-semibold',
  radio: 'flex cursor-pointer items-center gap-3 rounded-xl border border-slate-300 p-3 has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50',
  summary: 'flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 lg:self-start',
  line: 'flex justify-between',
  total: 'flex justify-between text-xl font-bold',
  consent: 'flex items-start gap-2 text-sm',
  err: 'text-sm text-red-600',
}
</script>

<template>
  <UiBreadcrumbs :items="[{ label: 'Главная', to: '/' }, { label: 'Корзина', to: '/cart' }, { label: 'Оформление' }]" />
  <h1 :class="classes.title">Оформление заказа</h1>
  <UiEmptyState v-if="!cart.items.length" title="Корзина пуста" text="Добавьте товары, чтобы оформить заказ.">
    <UiButton to="/catalog">В каталог</UiButton>
  </UiEmptyState>
  <form v-else :class="classes.layout" novalidate @submit.prevent="submit">
    <div :class="classes.form">
      <section :class="classes.card">
        <h2 :class="classes.h2">Контакты</h2>
        <UiInput v-model="form.name" label="Имя" autocomplete="name" :error="errors.name" />
        <UiInput v-model="form.phone" label="Телефон" type="tel" autocomplete="tel" placeholder="+7 900 000-00-00" :error="errors.phone" />
        <UiInput v-model="form.email" label="Email (необязательно)" type="email" autocomplete="email" :error="errors.email" />
      </section>
      <section :class="classes.card">
        <h2 :class="classes.h2">Доставка</h2>
        <UiInput v-model="form.city" label="Город" autocomplete="address-level2" :error="errors.city" />
        <UiInput v-model="form.address" label="Адрес или пункт выдачи" autocomplete="street-address" :error="errors.address" />
        <label v-for="p in deliveryProviders" :key="p.id" :class="classes.radio">
          <input v-model="form.provider" type="radio" :value="p.id" /> {{ p.title }}
        </label>
        <UiAlert tone="warning" title="Тестовый расчёт">
          Стоимость доставки условная: реальные API СДЭК и Ozon пока не подключены.
        </UiAlert>
      </section>
    </div>
    <aside :class="classes.summary">
      <h2 :class="classes.h2">Ваш заказ</h2>
      <div v-for="i in cart.items" :key="i.key" :class="classes.line">
        <span>{{ i.title }} × {{ i.qty }}</span><span>{{ formatPrice(i.price * i.qty) }}</span>
      </div>
      <div :class="classes.line"><span>Товары</span><span>{{ formatPrice(cart.subtotal) }}</span></div>
      <div :class="classes.line">
        <span>Доставка</span>
        <UiSkeleton v-if="quoteLoading" class="h-5 w-20" />
        <span v-else-if="quote">{{ formatPrice(quote.price) }} (тест)</span>
        <span v-else class="text-slate-500">укажите город</span>
      </div>
      <p v-if="quote" class="text-sm text-slate-500">Срок: {{ quote.daysMin }}–{{ quote.daysMax }} дн. (тест)</p>
      <p v-if="quoteError" :class="classes.err" role="alert">{{ quoteError }}</p>
      <div :class="classes.total"><span>Итого</span><span>{{ formatPrice(total) }}</span></div>
      <label :class="classes.consent">
        <input v-model="form.consent" type="checkbox" class="mt-1" />
        Согласен на обработку персональных данных (текст согласия предоставит заказчик)
      </label>
      <p v-if="errors.consent" :class="classes.err" role="alert">{{ errors.consent }}</p>
      <p v-if="submitted && !quote && !quoteLoading" :class="classes.err" role="alert">Сначала рассчитайте доставку: укажите город.</p>
      <UiButton type="submit" size="lg" block :disabled="quoteLoading">Оплатить</UiButton>
    </aside>
  </form>
</template>
