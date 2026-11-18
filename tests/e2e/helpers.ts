import { expect, type Page } from '@playwright/test'

export const ADMIN_USER = 'admin'
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? ''

/** Собирает ошибки консоли и необработанные исключения страницы */
export function watchErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push('console: ' + m.text())
  })
  return errors
}

export async function adminLogin(page: Page, password = ADMIN_PASSWORD) {
  await page.goto('/admin/login')
  await page.getByLabel('Логин').fill(ADMIN_USER)
  await page.getByLabel('Пароль').fill(password)
  await page.getByRole('button', { name: 'Войти' }).click()
}

export async function fillCheckout(page: Page, opts: { payment?: 'card' | 'cash' | 'invoice'; name?: string } = {}) {
  await page.getByLabel('Имя').fill(opts.name ?? 'Анна Тестова')
  await page.getByLabel('Телефон').fill('8 (916) 111-22-33')
  await page.getByRole('combobox', { name: 'Город' }).fill('Москва')
  await page.getByLabel('Адрес или пункт выдачи').fill('ул. Тверская, 1')
  if (opts.payment) await page.getByRole('radio', { name: new RegExp({ card: 'Картой онлайн', cash: 'Наличными', invoice: 'по счёту' }[opts.payment], 'i') }).check()
  await page.getByLabel(/Согласен на обработку/).check()
}

export async function addProduct(page: Page, slug: string) {
  await page.goto(`/product/${slug}`)
  await page.getByRole('button', { name: 'В корзину', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Добавлено' })).toBeVisible()
}

/** Выбор значения в выпадающем списке (Headless UI Listbox): открыть и кликнуть опцию по названию */
export async function pickOption(page: Page, label: string | RegExp, option: string) {
  await page.getByLabel(label).first().click()
  await page.getByRole('option', { name: option, exact: true }).click()
}
