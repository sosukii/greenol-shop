<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { site } from '@/config/site'
import { asset } from '@/utils/format'
import { childCategories } from '@/data/catalog'

const top = childCategories(null)
const messengers = computed(() =>
  (['max', 'telegram', 'whatsapp'] as const)
    .map((k) => ({ label: { max: 'MAX', telegram: 'Telegram', whatsapp: 'WhatsApp' }[k], href: site.contacts.messengers[k] }))
    .filter((m) => m.href),
)

const classes = {
  root: 'mt-16 border-t border-slate-200 bg-white pb-20 md:pb-0',
  inner: 'mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4',
  title: 'mb-3 font-semibold text-slate-900',
  list: 'flex flex-col gap-2 text-slate-600',
  link: 'hover:text-brand-600',
  text: 'text-sm leading-6 text-slate-600',
  legal: 'border-t border-slate-200 bg-slate-50',
  legalInner: 'mx-auto max-w-6xl px-4 py-5 text-xs leading-5 text-slate-500',
}
</script>

<template>
  <footer :class="classes.root">
    <div :class="classes.inner">
      <div>
        <img :src="asset('img/logo.webp')" width="444" height="88" class="mb-3 h-8 w-auto" alt="Greenol" loading="lazy" />
        <p :class="classes.text">{{ site.fullName }}. Дилерские продажи продукции компании-производителя Greenol на территории России.</p>
      </div>
      <nav aria-label="Каталог">
        <p :class="classes.title">Каталог</p>
        <ul :class="classes.list">
          <li v-for="c in top" :key="c.id"><RouterLink :to="`/catalog/${c.slug}`" :class="classes.link">{{ c.title }}</RouterLink></li>
        </ul>
      </nav>
      <nav aria-label="Покупателям">
        <p :class="classes.title">Покупателям</p>
        <ul :class="classes.list">
          <li><RouterLink to="/about" :class="classes.link">О магазине</RouterLink></li>
          <li><RouterLink to="/delivery" :class="classes.link">Доставка и оплата</RouterLink></li>
          <li><RouterLink to="/contacts" :class="classes.link">Контакты</RouterLink></li>
          <li><RouterLink to="/cart" :class="classes.link">Корзина</RouterLink></li>
        </ul>
      </nav>
      <div>
        <p :class="classes.title">Контакты</p>
        <address :class="[classes.text, 'not-italic']">
          <a :href="`tel:${site.contacts.phoneRaw}`" :class="classes.link">{{ site.contacts.phone }}</a><br />
          <a :href="`mailto:${site.contacts.email}`" :class="classes.link">{{ site.contacts.email }}</a><br />
          {{ site.contacts.address }}<br />
          <span v-for="h in site.contacts.hours" :key="h">{{ h }}<br /></span>
          {{ site.contacts.hoursNote }}
        </address>
        <ul v-if="messengers.length" class="mt-3 flex flex-wrap gap-3 text-sm">
          <li v-for="m in messengers" :key="m.label"><a :href="m.href" target="_blank" rel="noopener noreferrer" :class="classes.link">{{ m.label }}</a></li>
        </ul>
      </div>
    </div>
    <div :class="classes.legal">
      <p :class="classes.legalInner">
        {{ site.legal.name }}. ОГРНИП {{ site.legal.ogrnip }}, ИНН {{ site.legal.inn }}. {{ site.legal.region }}.<br />
        © {{ new Date().getFullYear() }} Greenol. Все права защищены.
      </p>
    </div>
  </footer>
</template>
