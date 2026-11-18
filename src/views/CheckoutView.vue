<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/api'
import { estimateDelivery } from '@/core/delivery'
import { ValidationError, type PaymentMethod } from '@/core/types'
import { validateEmail, validatePhone, validateRequired } from '@/core/validation'
import { deliveryProviders, paymentMethods } from '@/config/site'
import { useCartStore } from '@/stores/cart'
import { formatPrice, plural } from '@/utils/format'
import { useSeo } from '@/composables/useSeo'
import { track } from '@/composables/analytics'
import { UiAlert, UiBreadcrumbs, UiButton, UiCheckbox, UiCityInput, UiEmptyState, UiInput, UiSkeleton, UiTextarea } from '@/components/ui'

useSeo({ title: 'Оформление заказа — Greenol', description: 'Оформление заказа в интернет-магазине Greenol.', path: '/checkout', noindex: true })

const cart = useCartStore()
const router = useRouter()
const form = reactive({ name: '', phone: '', email: '', comment: '', city: '', address: '', provider: 'cdek', payment: 'card' as PaymentMethod, consent: false })
const errors = reactive<Record<string, string>>({})
const submitting = ref(false)
const apiError = ref('')
const key = ref('')

onMounted(() => {
  // Ключ идемпотентности живёт, пока заказ не создан: двойной клик или обновление страницы не создадут дубль
  try {
    key.value = sessionStorage.getItem('greenol:order-key') || crypto.randomUUID()
    sessionStorage.setItem('greenol:order-key', key.value)
  } catch { key.value = crypto.randomUUID() }
  if (cart.items.length) track('begin_checkout', { items: cart.count })
})
watch(() => form.provider, (p) => track('select_delivery', { provider: p }))

const estimates = computed(() =>
  deliveryProviders.map((p) => {
    try { return { ...p, est: form.city.trim() ? estimateDelivery(p.id, form.city, cart.count) : null } } catch { return { ...p, est: null } }
  }),
)
const delivery = computed(() => estimates.value.find((e) => e.id === form.provider)?.est ?? null)
const total = computed(() => cart.subtotal + (delivery.value?.price ?? 0))

const rules: Record<string, (v: string) => string> = {
  name: validateRequired('имя'), phone: validatePhone, email: validateEmail, city: validateRequired('город'), address: validateRequired('адрес или пункт выдачи'),
}
const check = (f: string) => { errors[f] = rules[f]((form as never)[f]) }
function validate() {
  Object.keys(rules).forEach(check)
  errors.consent = form.consent ? '' : 'Необходимо согласие на обработку персональных данных'
  return Object.values(errors).every((e) => !e)
}

async function submit() {
  apiError.value = ''
  if (submitting.value) return
  if (!validate()) {
    await nextTick()
    document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
    return
  }
  submitting.value = true
  try {
    const utm = Object.fromEntries([...new URLSearchParams(location.search)].filter(([k]) => k.startsWith('utm_')))
    const order = await api.createOrder({
      idempotencyKey: key.value,
      customer: { name: form.name, phone: form.phone, email: form.email || undefined, comment: form.comment || undefined },
      delivery: { provider: form.provider, city: form.city, address: form.address },
      paymentMethod: form.payment,
      items: cart.items.map((i) => ({ sku: i.sku, qty: i.qty })),
      utm: Object.keys(utm).length ? utm : undefined,
    })
    if (form.payment === 'card') track('go_to_payment', { total: order.total })
    cart.clear()
    try { sessionStorage.removeItem('greenol:order-key') } catch { /* noop */ }
    await router.push({ path: '/order', query: { id: order.id } })
  } catch (e) {
    if (e instanceof ValidationError) {
      Object.assign(errors, e.fields)
      apiError.value = e.fields.items ? `${e.fields.items}. Проверьте корзину.` : 'Проверьте поля формы.'
    } else apiError.value = 'Не удалось оформить заказ. Проверьте соединение и повторите попытку — повторный заказ не создастся.'
  } finally {
    submitting.value = false
  }
}

const classes = {
  title: 'mb-5 text-2xl font-bold sm:text-3xl',
  layout: 'grid gap-6 lg:grid-cols-[1fr_24rem]',
  col: 'flex flex-col gap-5',
  card: 'flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5',
  h2: 'text-lg font-semibold',
  grid2: 'grid gap-4 sm:grid-cols-2',
  radio: 'flex min-h-14 cursor-pointer items-start gap-3 rounded-xl border border-slate-300 p-3 transition-colors hover:border-brand-500 has-[:checked]:border-brand-600 has-[:checked]:bg-brand-50',
  radioBox: 'mt-1 size-5 shrink-0 accent-brand-600',
  radioTitle: 'flex flex-wrap items-baseline justify-between gap-x-3 font-medium',
  radioSub: 'text-sm text-slate-500',
  summary: 'flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 lg:sticky lg:top-24 lg:self-start',
  line: 'flex justify-between gap-4 text-sm',
  total: 'flex justify-between border-t border-slate-200 pt-3 text-xl font-bold',
}
</script>

<template>
  <UiBreadcrumbs :items="[{ label: 'Главная', to: '/' }, { label: 'Корзина', to: '/cart' }, { label: 'Оформление заказа' }]" />
  <h1 :class="classes.title">Оформление заказа</h1>
  <div v-if="!cart.ready"><UiSkeleton class="h-64" /></div>
  <UiEmptyState v-else-if="!cart.items.length" title="Корзина пуста" text="Добавьте товары, чтобы оформить заказ.">
    <UiButton to="/catalog">В каталог</UiButton>
  </UiEmptyState>
  <form v-else :class="classes.layout" novalidate @submit.prevent="submit">
    <div :class="classes.col">
      <UiAlert v-if="apiError" tone="danger" title="Заказ не оформлен">{{ apiError }} <RouterLink v-if="apiError.includes('корзин')" to="/cart" class="font-semibold underline">Открыть корзину</RouterLink></UiAlert>

      <section :class="classes.card" aria-labelledby="c-contacts">
        <h2 id="c-contacts" :class="classes.h2">Контакты</h2>
        <div :class="classes.grid2">
          <UiInput v-model="form.name" label="Имя" autocomplete="name" :error="errors.name" @focusout="check('name')" />
          <UiInput v-model="form.phone" label="Телефон" type="tel" inputmode="tel" autocomplete="tel" placeholder="+7 900 000-00-00" :error="errors.phone" @focusout="check('phone')" />
        </div>
        <UiInput v-model="form.email" label="Email (необязательно)" type="email" inputmode="email" autocomplete="email" :error="errors.email" @focusout="check('email')" />
      </section>

      <section :class="classes.card" aria-labelledby="c-delivery">
        <h2 id="c-delivery" :class="classes.h2">Доставка</h2>
        <div :class="classes.grid2">
          <UiCityInput v-model="form.city" label="Город" placeholder="Например, Казань" :error="errors.city" @focusout="check('city')" />
          <UiInput v-model="form.address" label="Адрес или пункт выдачи" autocomplete="street-address" :error="errors.address" @focusout="check('address')" />
        </div>
        <fieldset class="flex flex-col gap-2">
          <legend class="mb-2 text-sm font-medium text-slate-700">Служба доставки</legend>
          <label v-for="e in estimates" :key="e.id" :class="classes.radio">
            <input v-model="form.provider" type="radio" name="provider" :value="e.id" :class="classes.radioBox" />
            <span class="flex-1">
              <span :class="classes.radioTitle"><span>{{ e.title }}</span><span v-if="e.est">{{ formatPrice(e.est.price) }}</span></span>
              <span :class="classes.radioSub">{{ e.est ? `${e.est.daysMin}–${e.est.daysMax} дн. · ориентировочно` : 'Укажите город — рассчитаем стоимость' }}</span>
            </span>
          </label>
        </fieldset>
        <p class="text-sm text-slate-500">Стоимость и срок доставки ориентировочные. Окончательный расчёт подтвердит менеджер после оформления заказа.</p>
      </section>

      <section :class="classes.card" aria-labelledby="c-pay">
        <h2 id="c-pay" :class="classes.h2">Оплата</h2>
        <fieldset class="flex flex-col gap-2">
          <legend class="sr-only">Способ оплаты</legend>
          <label v-for="m in paymentMethods" :key="m.id" :class="classes.radio">
            <input v-model="form.payment" type="radio" name="payment" :value="m.id" :class="classes.radioBox" />
            <span><span :class="classes.radioTitle">{{ m.title }}</span><span :class="classes.radioSub">{{ m.text }}</span></span>
          </label>
        </fieldset>
        <UiTextarea v-model="form.comment" label="Комментарий к заказу (необязательно)" />
      </section>
    </div>

    <aside :class="classes.summary" aria-label="Ваш заказ">
      <h2 :class="classes.h2">Ваш заказ</h2>
      <ul class="flex flex-col gap-2">
        <li v-for="i in cart.items" :key="i.sku" :class="classes.line">
          <span>{{ i.title }}{{ i.label ? `, ${i.label}` : '' }} × {{ i.qty }}</span><span class="shrink-0">{{ formatPrice(i.price * i.qty) }}</span>
        </li>
      </ul>
      <div :class="[classes.line, 'border-t border-slate-100 pt-3']"><span>{{ cart.count }} {{ plural(cart.count, 'товар', 'товара', 'товаров') }}</span><span>{{ formatPrice(cart.subtotal) }}</span></div>
      <div :class="classes.line"><span>Доставка (ориентировочно)</span><span v-if="delivery">{{ formatPrice(delivery.price) }}</span><span v-else class="text-slate-500">укажите город</span></div>
      <div :class="classes.total"><span>Итого</span><span>{{ formatPrice(total) }}</span></div>
      <UiCheckbox v-model="form.consent" :error="errors.consent">Согласен на обработку персональных данных для оформления и доставки заказа</UiCheckbox>
      <UiButton type="submit" size="lg" block :loading="submitting">{{ form.payment === 'card' ? 'Оплатить' : 'Оформить заказ' }}</UiButton>
    </aside>
  </form>
</template>
