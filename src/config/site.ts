// Центральная конфигурация магазина: бренд, контакты, юридические данные, оплата, доставка.
// Меняйте значения здесь — они используются в шапке, подвале, SEO и на страницах.
const env = ((import.meta as unknown as { env?: Record<string, string> }).env ?? {}) as Record<string, string | undefined>

export const site = {
  name: 'Greenol',
  fullName: 'Официальный интернет-магазин производителя Greenol',
  description:
    'Официальный интернет-магазин производителя Greenol: автохимия, раскоксовка двигателя, промывки, моторные масла Тотек и защитные материалы для автосервиса.',
  /** Публичный адрес сайта (для canonical, sitemap, Open Graph). Задаётся VITE_SITE_URL. */
  url: ((env.VITE_SITE_URL as string | undefined) ?? 'https://sosukii.github.io/greenol-shop').replace(/\/$/, ''),
  locale: 'ru_RU',
  logo: '/img/logo.webp',
  contacts: {
    phone: '+7 (916) 245-45-24',
    phoneRaw: '+79162454524',
    email: 'msk@greenol.ru',
    address: 'г. Москва, ул. Стартовая, 14Т',
    hours: [
      'Пн–Пт: 08:00–20:00',
      'Сб–Вс: 10:00–19:00',
    ],
    hoursNote: 'Время московское',
    /** Ссылки на мессенджеры: пустые значения не отображаются. */
    messengers: { max: '', telegram: '', whatsapp: '' } as Record<'max' | 'telegram' | 'whatsapp', string>,
  },
  legal: {
    name: 'Индивидуальный предприниматель Панькин Максим Владимирович',
    ogrnip: '318784700350947',
    inn: '781912509855',
    region: 'Представительство компании Greenol в Центральном и Северо-Западном регионах России',
  },
  /** ID счётчика Яндекс Метрики (VITE_YM_ID). Пусто — счётчик не подключается. */
  metrikaId: (env.VITE_YM_ID as string | undefined) ?? '',
  /** sandbox — оплата имитируется; live — только после подключения банка и подтверждения заказчика. */
  paymentMode: ((env.VITE_PAYMENT_MODE as string | undefined) ?? 'sandbox') as 'sandbox' | 'live',
  /** Адрес бэкенда. Пусто — встроенный локальный режим (данные хранятся в браузере). */
  apiUrl: (env.VITE_API_URL as string | undefined) ?? '',
  pageSize: 12,
}

export const paymentMethods = [
  { id: 'card', title: 'Картой онлайн', text: 'Оплата банковской картой на защищённой странице платёжного сервиса. Данные карты на сайте не вводятся.' },
  { id: 'cash', title: 'Наличными при получении', text: 'Вы оформляете заказ, оставляете контактную информацию и выбираете оплату «Наличными». Оплата — курьеру при получении заказа.' },
  { id: 'invoice', title: 'Безналичный расчёт по счёту', text: 'Подходит для организаций. Вы оформляете заказ, мы выставляем счёт на оплату, после оплаты согласовываем дату получения заказа.' },
] as const

export type PaymentMethodId = (typeof paymentMethods)[number]['id']

/**
 * Тарифы доставки. Реальные API СДЭК/Ozon не подключены (нет договоров и ключей),
 * поэтому стоимость ориентировочная и пересчитывается менеджером при подтверждении заказа.
 */
export const deliveryProviders = [
  { id: 'cdek', title: 'СДЭК', base: 350, perItem: 40, daysMin: 2, daysMax: 6 },
  { id: 'ozon', title: 'Ozon Доставка', base: 300, perItem: 45, daysMin: 3, daysMax: 7 },
] as const

export type DeliveryProviderId = (typeof deliveryProviders)[number]['id']
