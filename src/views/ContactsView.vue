<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '@/api'
import { site } from '@/config/site'
import { ValidationError } from '@/core/types'
import { validatePhone, validateRequired } from '@/core/validation'
import { getOfferBySku } from '@/data/catalog'
import { breadcrumbLd, organizationLd, useSeo } from '@/composables/useSeo'
import { track } from '@/composables/analytics'
import PageShell from '@/components/layout/PageShell.vue'
import { UiAlert, UiButton, UiCheckbox, UiIcon, UiInput, UiTextarea } from '@/components/ui'

useSeo({
  title: `Контакты — ${site.name}`,
  description: `Телефон ${site.contacts.phone}, e-mail ${site.contacts.email}, ${site.contacts.address}. Режим работы менеджеров.`,
  path: '/contacts',
  jsonLd: [breadcrumbLd([{ name: 'Главная', path: '/' }, { name: 'Контакты', path: '/contacts' }]), organizationLd()],
})

const route = useRoute()
const form = reactive({ name: '', phone: '', message: '', consent: false, website: '' })
const errors = reactive<Record<string, string>>({})
const sending = ref(false)
const done = ref(false)
const failed = ref(false)

onMounted(() => {
  // «Запросить цену» со страницы товара подставляет название и артикул в сообщение
  const sku = route.query.sku
  const f = typeof sku === 'string' ? getOfferBySku(sku) : undefined
  if (f) form.message = `Прошу сообщить цену и наличие: ${f.product.title}${f.offer.label ? ', ' + f.offer.label : ''} (арт. ${f.offer.sku}).`
})

const messengers = computed(() =>
  (['max', 'telegram', 'whatsapp'] as const)
    .map((k) => ({ label: { max: 'MAX', telegram: 'Telegram', whatsapp: 'WhatsApp' }[k], href: site.contacts.messengers[k] }))
    .filter((m) => m.href),
)

async function submit() {
  failed.value = false
  errors.name = validateRequired('имя')(form.name)
  errors.phone = validatePhone(form.phone)
  errors.consent = form.consent ? '' : 'Необходимо согласие на обработку персональных данных'
  if (Object.values(errors).some(Boolean)) return
  sending.value = true
  try {
    const utm = Object.fromEntries([...new URLSearchParams(location.search)].filter(([k]) => k.startsWith('utm_')))
    await api.createLead({ name: form.name, phone: form.phone, message: form.message || undefined, source: typeof route.query.sku === 'string' ? 'price-request' : 'contacts', website: form.website, utm: Object.keys(utm).length ? utm : undefined })
    track('lead_submit')
    done.value = true
  } catch (e) {
    if (e instanceof ValidationError) Object.assign(errors, e.fields)
    else failed.value = true
  } finally {
    sending.value = false
  }
}

const classes = {
  grid: 'grid gap-6 lg:grid-cols-2',
  card: 'rounded-2xl border border-slate-200 bg-white p-5',
  h2: 'mb-3 text-xl font-semibold',
  list: 'flex flex-col gap-3 text-slate-700',
  row: 'flex items-start gap-3',
  form: 'flex flex-col gap-4',
  hp: 'absolute -left-[9999px] h-0 w-0 overflow-hidden',
}
</script>

<template>
  <PageShell title="Контакты">
    <div :class="classes.grid" class="max-w-none">
      <section :class="classes.card" aria-labelledby="k-info">
        <h2 id="k-info" :class="classes.h2">Как с нами связаться</h2>
        <ul :class="classes.list">
          <li :class="classes.row"><UiIcon name="phone" class="mt-1 shrink-0 text-brand-600" /><span><a :href="`tel:${site.contacts.phoneRaw}`" class="font-semibold hover:text-brand-600">{{ site.contacts.phone }}</a><br /><span class="text-sm text-slate-500">телефон интернет-магазина</span></span></li>
          <li :class="classes.row"><UiIcon name="mail" class="mt-1 shrink-0 text-brand-600" /><a :href="`mailto:${site.contacts.email}`" class="hover:text-brand-600">{{ site.contacts.email }}</a></li>
          <li :class="classes.row"><UiIcon name="pin" class="mt-1 shrink-0 text-brand-600" /><span>{{ site.contacts.address }}<br /><span class="text-sm text-slate-500">{{ site.legal.region }}</span></span></li>
        </ul>
        <h3 class="mb-1 mt-5 font-semibold">Режим работы менеджеров</h3>
        <p class="text-sm text-slate-600"><span v-for="h in site.contacts.hours" :key="h">{{ h }}<br /></span>{{ site.contacts.hoursNote }}</p>
        <div v-if="messengers.length" class="mt-5 flex flex-wrap gap-2">
          <UiButton v-for="m in messengers" :key="m.label" :href="m.href" variant="secondary">{{ m.label }}</UiButton>
        </div>
        <p class="mt-5 text-xs leading-5 text-slate-500">{{ site.legal.name }}, ОГРНИП {{ site.legal.ogrnip }}, ИНН {{ site.legal.inn }}</p>
      </section>

      <section id="callback" :class="classes.card" aria-labelledby="k-form">
        <h2 id="k-form" :class="classes.h2">Обратный звонок</h2>
        <UiAlert v-if="done" tone="success" title="Заявка отправлена">Мы перезвоним вам в рабочее время.</UiAlert>
        <form v-else :class="classes.form" novalidate @submit.prevent="submit">
          <UiAlert v-if="failed" tone="danger">Не удалось отправить заявку. Попробуйте ещё раз или позвоните нам.</UiAlert>
          <UiInput v-model="form.name" label="Имя" autocomplete="name" :error="errors.name" />
          <UiInput v-model="form.phone" label="Телефон" type="tel" inputmode="tel" autocomplete="tel" placeholder="+7 900 000-00-00" :error="errors.phone" />
          <UiTextarea v-model="form.message" label="Сообщение (необязательно)" />
          <div :class="classes.hp" aria-hidden="true"><label>Не заполняйте это поле<input v-model="form.website" type="text" name="website" tabindex="-1" autocomplete="off" /></label></div>
          <UiCheckbox v-model="form.consent" :error="errors.consent">Согласен на обработку персональных данных для обратной связи</UiCheckbox>
          <UiButton type="submit" :loading="sending">Отправить заявку</UiButton>
        </form>
      </section>
    </div>
  </PageShell>
</template>
