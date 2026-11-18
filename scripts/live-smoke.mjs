// Дымовой тест задеплоенного сайта: заказ → оплата (песочница) → вход в админку → заказ виден.
// Запуск: LIVE_URL=https://.../greenol-shop ADMIN_PASSWORD=... node scripts/live-smoke.mjs
import { chromium } from '@playwright/test'

const base = (process.env.LIVE_URL ?? '').replace(/\/$/, '')
const pass = process.env.ADMIN_PASSWORD ?? ''
if (!base || !pass) throw new Error('Нужны LIVE_URL и ADMIN_PASSWORD')
const browser = await chromium.launch({ channel: 'chrome' })
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
const ok = (c, msg) => { if (!c) throw new Error('FAIL: ' + msg); console.log('ok  ' + msg) }

await page.goto(`${base}/product/raskoksovka-dvigatelya-reanimator`, { waitUntil: 'networkidle' }) // ждём гидратации prerender-страницы
await page.getByRole('button', { name: 'В корзину', exact: true }).click()
await page.getByRole('button', { name: 'Добавлено' }).waitFor()
await page.goto(`${base}/checkout`)
await page.getByLabel('Имя').fill('Проверка Живого')
await page.getByLabel('Телефон').fill('9160001234')
await page.getByRole('combobox', { name: 'Город' }).fill('Москва')
await page.getByLabel('Адрес или пункт выдачи').fill('ул. Живая, 1')
await page.getByLabel(/Согласен на обработку/).check()
await page.getByRole('button', { name: 'Оплатить' }).click()
await page.waitForURL(/\/order\?id=/)
const number = (await page.locator('h1').innerText()).replace('Заказ № ', '')
ok(/^GR-\d{5}$/.test(number), `заказ создан: ${number}`)
await page.getByRole('button', { name: 'Оплата прошла успешно' }).click()
await page.getByText('Оплата получена').waitFor()
ok(true, 'оплата (песочница) подтверждена')

await page.goto(`${base}/admin/orders`)
await page.waitForURL(/\/admin\/login/, { timeout: 15000 })
ok(true, 'без входа админка закрыта (редирект на логин)')
await page.getByLabel('Логин').fill('admin')
await page.getByLabel('Пароль').fill(pass)
await page.getByRole('button', { name: 'Войти' }).click()
await page.getByRole('link', { name: number }).waitFor()
ok(true, 'заказ виден в списке админки')
await page.getByRole('link', { name: number }).first().click()
await page.getByRole('heading', { name: `Заказ ${number}` }).waitFor()
ok(await page.getByText('Проверка Живого').first().isVisible(), 'покупатель в карточке')
ok(await page.getByText('Оплачен').first().isVisible(), 'карточка: покупатель и статус «Оплачен» корректны')
ok(errors.length === 0, 'ошибок консоли нет ' + JSON.stringify(errors))
await browser.close()
