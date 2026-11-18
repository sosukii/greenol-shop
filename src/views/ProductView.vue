<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { site } from '@/config/site'
import { availabilityLabel, getBrand, getProduct, hasPrice, productCategory, relatedProducts } from '@/data/catalog'
import { MAX_QTY } from '@/core/orders'
import { formatPrice, asset } from '@/utils/format'
import { useCartStore } from '@/stores/cart'
import { absUrl, breadcrumbLd, useSeo } from '@/composables/useSeo'
import { ecommerce, track } from '@/composables/analytics'
import { toast } from '@/composables/useToast'
import ProductImage from '@/components/catalog/ProductImage.vue'
import ProductGrid from '@/components/catalog/ProductGrid.vue'
import { UiBadge, UiBreadcrumbs, UiButton, UiIcon, UiModal, UiQuantity } from '@/components/ui'
import NotFoundView from './NotFoundView.vue'

const route = useRoute()
const cart = useCartStore()
const product = computed(() => getProduct(route.params.slug as string))

const offerSku = ref('')
const qty = ref(1)
const imgIndex = ref(0)
const zoom = ref(false)
const added = ref(false)
let timer: ReturnType<typeof setTimeout>

watch(product, (p) => {
  if (!p) return
  offerSku.value = (p.offers.find((o) => hasPrice(o) && o.inStock) ?? p.offers.find(hasPrice) ?? p.offers[0]).sku
  qty.value = 1
  imgIndex.value = 0
  track('view_item', { id: p.id })
  const o = p.offers[0]
  ecommerce('detail', [{ id: o.sku, name: p.title, price: o.price, brand: p.brand }])
}, { immediate: true })

const offer = computed(() => product.value?.offers.find((o) => o.sku === offerSku.value))
const path = computed(() => productCategory(product.value!))
const crumbItems = computed(() => [
  { name: 'Главная', path: '/' }, { name: 'Каталог', path: '/catalog' },
  ...path.value.map((c) => ({ name: c.title, path: `/catalog/${c.slug}` })),
  { name: product.value?.title ?? '', path: `/product/${product.value?.slug}` },
])
const brand = computed(() => getBrand(product.value?.brand ?? '')?.title)

function productLd() {
  const p = product.value!
  const offers = p.offers.filter(hasPrice).map((o) => ({
    '@type': 'Offer', sku: o.sku, url: absUrl(`/product/${p.slug}`), priceCurrency: 'RUB', price: String(o.price),
    itemCondition: 'https://schema.org/NewCondition',
    availability: o.inStock ? 'https://schema.org/InStock' : 'https://schema.org/BackOrder',
    seller: { '@type': 'Organization', name: site.name },
  }))
  return {
    '@context': 'https://schema.org', '@type': 'Product', name: p.title, sku: p.offers[0].sku,
    description: p.summary, image: p.images.length ? p.images.map((id) => absUrl(`/img/p/${id}-640.webp`)) : [absUrl('/og-default.png')],
    brand: { '@type': 'Brand', name: brand.value }, ...(offers.length ? { offers: offers.length === 1 ? offers[0] : offers } : {}),
  }
}

useSeo(() => {
  const p = product.value
  if (!p) return { title: 'Товар не найден', description: '', path: route.path, noindex: true }
  const from = Math.min(...p.offers.filter(hasPrice).map((o) => o.price))
  return {
    title: `${p.title} — купить в ${site.name}`,
    description: `${p.summary}${Number.isFinite(from) ? ` Цена от ${formatPrice(from)}.` : ''} Официальный магазин производителя, доставка по России.`.slice(0, 300),
    path: `/product/${p.slug}`,
    image: p.images[0] ? `/img/p/${p.images[0]}-640.webp` : undefined,
    type: 'product',
    jsonLd: [breadcrumbLd(crumbItems.value), productLd()],
  }
})

function add() {
  const p = product.value, o = offer.value
  if (!p || !o || !hasPrice(o)) return
  cart.add(p, o, qty.value)
  track('add_to_cart', { id: o.sku })
  ecommerce('add', [{ id: o.sku, name: p.title, price: o.price, quantity: qty.value, variant: o.label ?? undefined, brand: p.brand }])
  toast(`«${p.title}» в корзине`, 'success', '/cart')
  added.value = true
  clearTimeout(timer)
  timer = setTimeout(() => (added.value = false), 1800)
}
onBeforeUnmount(() => clearTimeout(timer))

const specs = computed(() => {
  const p = product.value!
  return [
    ['Бренд', brand.value], ['Артикул', offer.value?.sku], ['Фасовка', offer.value?.label ?? ''],
    ['Категория', path.value.at(-1)?.title],
  ].filter(([, v]) => v) as [string, string][]
})
const related = computed(() => (product.value ? relatedProducts(product.value) : []))

const classes = {
  layout: 'grid gap-8 md:grid-cols-2',
  galleryMain: 'relative block w-full cursor-zoom-in overflow-hidden rounded-2xl border border-slate-200 bg-white',
  thumbs: 'mt-3 flex gap-2 overflow-x-auto pb-1',
  thumb: 'size-16 shrink-0 overflow-hidden rounded-lg border-2 border-transparent bg-white',
  thumbActive: '!border-brand-600',
  badges: 'mb-2 flex flex-wrap gap-1.5',
  title: 'mb-2 text-2xl font-bold leading-tight sm:text-3xl',
  meta: 'mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500',
  chips: 'flex flex-wrap gap-2',
  chip: 'min-h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium transition-colors hover:border-brand-500 aria-pressed:border-brand-600 aria-pressed:bg-brand-50 aria-pressed:text-brand-700',
  price: 'text-3xl font-bold',
  request: 'rounded-xl bg-slate-100 p-4 text-sm text-slate-700',
  buy: 'my-5 flex flex-wrap items-center gap-3',
  box: 'mt-6 rounded-2xl border border-slate-200 bg-white p-5',
  h2: 'mb-3 text-lg font-semibold',
  h3: 'mt-4 font-semibold',
  dl: 'grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm',
  dt: 'text-slate-500',
  prose: 'flex flex-col gap-3 text-sm leading-6 text-slate-700',
}
</script>

<template>
  <NotFoundView v-if="!product" />
  <template v-else>
    <UiBreadcrumbs :items="crumbItems.slice(0, -1).map((c) => ({ label: c.name, to: c.path })).concat([{ label: product.title, to: undefined as never }])" />
    <div :class="classes.layout">
      <div>
        <button type="button" :class="classes.galleryMain" aria-label="Увеличить фото" @click="zoom = true">
          <ProductImage :id="product.images[imgIndex]" :alt="product.title" sizes="(min-width:768px) 50vw, 100vw" priority />
        </button>
        <div v-if="product.images.length > 1" :class="classes.thumbs" role="list">
          <button v-for="(id, i) in product.images" :key="id" type="button" role="listitem" :class="[classes.thumb, i === imgIndex && classes.thumbActive]" :aria-label="`Фото ${i + 1}`" @click="imgIndex = i">
            <ProductImage :id="id" :alt="`${product.title}, фото ${i + 1}`" sizes="64px" />
          </button>
        </div>
      </div>

      <div>
        <div :class="classes.badges">
          <UiBadge v-if="product.isNew" tone="brand">Новинка</UiBadge>
          <UiBadge v-if="product.hit" tone="warning">Хит продаж</UiBadge>
        </div>
        <h1 :class="classes.title">{{ product.title }}</h1>
        <p :class="classes.meta">
          <span>{{ brand }}</span><span>Артикул: {{ offer?.sku }}</span>
          <UiBadge v-if="offer" :tone="offer.inStock ? 'success' : 'neutral'">{{ availabilityLabel(offer) }}</UiBadge>
        </p>

        <div v-if="product.offers.length > 1" class="mb-4">
          <p class="mb-2 text-sm font-medium">Фасовка</p>
          <div :class="classes.chips" role="group" aria-label="Фасовка">
            <button v-for="o in product.offers" :key="o.sku" type="button" :class="classes.chip" :aria-pressed="o.sku === offerSku" @click="offerSku = o.sku">
              {{ o.label }}<span v-if="hasPrice(o)" class="ml-1.5 text-slate-500">{{ formatPrice(o.price) }}</span>
            </button>
          </div>
        </div>

        <template v-if="offer && hasPrice(offer)">
          <p :class="classes.price">{{ formatPrice(offer.price) }}</p>
          <p v-if="!offer.inStock" class="mt-1 text-sm text-slate-500">Товар поставляется под заказ — срок уточнит менеджер.</p>
          <div :class="classes.buy">
            <UiQuantity v-model="qty" :max="MAX_QTY" />
            <UiButton size="lg" :variant="added ? 'secondary' : 'primary'" @click="add">
              <UiIcon :name="added ? 'check' : 'cart'" />{{ added ? 'Добавлено' : 'В корзину' }}
            </UiButton>
          </div>
        </template>
        <div v-else :class="[classes.request, 'mt-2']">
          <p class="mb-3 font-medium">Цена по запросу</p>
          <p class="mb-3">Стоимость и наличие уточняйте у менеджера: {{ site.contacts.phone }}.</p>
          <UiButton :to="`/contacts?sku=${offer?.sku}#callback`">Запросить цену</UiButton>
        </div>

        <section :class="classes.box" aria-labelledby="p-specs">
          <h2 id="p-specs" :class="classes.h2">Характеристики</h2>
          <dl :class="classes.dl"><template v-for="[k, v] in specs" :key="k"><dt :class="classes.dt">{{ k }}</dt><dd>{{ v }}</dd></template></dl>
        </section>
        <section :class="classes.box" aria-labelledby="p-delivery">
          <h2 id="p-delivery" :class="classes.h2">Доставка и оплата</h2>
          <p class="text-sm text-slate-600">Доставка СДЭК и Ozon по России, стоимость рассчитывается при оформлении заказа. Оплата картой онлайн, наличными при получении или по счёту. <RouterLink to="/delivery" class="text-brand-600 hover:underline">Подробнее</RouterLink></p>
        </section>
      </div>
    </div>

    <section v-if="product.description.length" :class="classes.box" aria-labelledby="p-desc">
      <h2 id="p-desc" :class="classes.h2">Описание</h2>
      <div :class="classes.prose">
        <template v-for="(b, i) in product.description" :key="i">
          <h3 v-if="b.t === 'h'" :class="classes.h3">{{ b.text }}</h3>
          <p v-else :class="b.t === 'li' ? 'pl-4' : ''">{{ b.text }}</p>
        </template>
      </div>
    </section>

    <section v-if="related.length" class="mt-12" aria-labelledby="p-related">
      <h2 id="p-related" class="mb-4 text-xl font-bold">Похожие товары</h2>
      <ProductGrid :products="related" />
    </section>

    <UiModal v-model="zoom" :title="product.title" wide>
      <ProductImage :id="product.images[imgIndex]" :alt="product.title" sizes="90vw" />
    </UiModal>
  </template>
</template>
