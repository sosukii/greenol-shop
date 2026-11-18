import { expect, test } from '@playwright/test'
import { addProduct, adminLogin, fillCheckout, pickOption, watchErrors, ADMIN_PASSWORD } from './helpers'

test.skip(!ADMIN_PASSWORD, 'Нужна переменная ADMIN_PASSWORD')

test.describe('админка', () => {
  test('без входа: редирект на логин; неверный пароль отклоняется', async ({ page }) => {
    await page.goto('/admin/orders')
    await expect(page).toHaveURL(/\/admin\/login/)
    await adminLogin(page, 'wrong-password')
    await expect(page.getByText('Неверный логин или пароль')).toBeVisible()
    await page.goto('/admin/leads')
    await expect(page).toHaveURL(/\/admin\/login/)
  })

  test('сценарий владельца: заказ с сайта → список → поиск → карточка → статус → оплата → лид → аналитика', async ({ page }) => {
    const errors = watchErrors(page)
    // 1. покупатель оформляет заказ (счёт — чтобы затем отметить оплату вручную)
    await addProduct(page, 'raskoksovka-dvigatelya-reanimator') // 1 090
    await addProduct(page, 'raskoksovka-dvigatelya-reanimator')
    await page.goto('/checkout')
    await fillCheckout(page, { payment: 'invoice', name: 'Ольга Проверкина' })
    await page.getByRole('button', { name: 'Оформить заказ' }).click()
    await expect(page.getByText('Заказ принят')).toBeVisible()
    const number = (await page.locator('h1').innerText()).replace('Заказ № ', '')

    // 2. лид с контактной формы
    await page.goto('/contacts')
    await page.getByLabel('Имя').fill('Лид Тестов')
    await page.getByLabel('Телефон').fill('9165554433')
    await page.getByLabel(/Сообщение/).fill('Нужна консультация')
    await page.getByLabel(/Согласен/).check()
    await page.getByRole('button', { name: 'Отправить заявку' }).click()
    await expect(page.getByText('Заявка отправлена')).toBeVisible()

    // 3. владелец входит и находит заказ
    await adminLogin(page)
    await expect(page).toHaveURL(/\/admin\/orders/)
    await expect(page.getByRole('link', { name: number }).first()).toBeVisible()
    await page.getByLabel('Поиск').fill('Проверкина')
    await expect(page.getByRole('link', { name: number }).first()).toBeVisible()
    await page.getByLabel('Поиск').fill('нет такого клиента')
    await expect(page.getByText('Ничего не найдено')).toBeVisible()
    await page.getByLabel('Поиск').fill('')
    await pickOption(page, 'Статус оплаты', 'Оплачен')
    await expect(page.getByRole('link', { name: number })).toHaveCount(0)
    await pickOption(page, 'Статус оплаты', 'Все')

    // 4. карточка заказа: данные корректны
    await page.getByRole('link', { name: number }).first().click()
    await expect(page.getByRole('heading', { name: `Заказ ${number}` })).toBeVisible()
    await expect(page.getByText('Ольга Проверкина')).toBeVisible()
    await expect(page.getByText('+79161112233')).toBeVisible()
    await expect(page.getByText('ул. Тверская, 1')).toBeVisible()
    await expect(page.getByText('Раскоксовка двигателя - Реаниматор 450 мл').first()).toBeVisible()
    await expect(page.getByText('2 180 ₽').first()).toBeVisible() // 2 × 1 090
    await expect(page.getByText('По счёту').first()).toBeVisible()

    // 5. смена статуса заказа
    await pickOption(page, 'Новый статус', 'Подтверждён')
    await page.getByRole('button', { name: 'Сохранить статус' }).click()
    await expect(page.getByText('Статус заказа: new → confirmed')).toBeVisible()

    // 6. ручная оплата требует причину
    await page.getByRole('button', { name: 'Отметить оплаченным вручную' }).click()
    await page.getByRole('button', { name: 'Подтвердить' }).click()
    await expect(page.getByText('Укажите причину')).toBeVisible()
    await page.getByLabel('Причина').fill('Платёжное поручение № 77')
    await page.getByRole('button', { name: 'Подтвердить' }).click()
    await expect(page.getByText('Платёжное поручение № 77', { exact: false })).toBeVisible()
    await expect(page.getByText('Оплачен').first()).toBeVisible()

    // 7. лиды
    await page.getByRole('link', { name: 'Лиды' }).click()
    await expect(page.getByText('Лид Тестов')).toBeVisible()
    await expect(page.getByText('Нужна консультация')).toBeVisible()
    await pickOption(page, 'Сменить статус', 'В работе')
    await expect(page.locator('li span.rounded-md').filter({ hasText: /^В работе$/ })).toBeVisible()

    // 8. аналитика
    await page.getByRole('link', { name: 'Аналитика' }).click()
    await expect(page.getByRole('heading', { name: 'Аналитика' })).toBeVisible()
    await expect(page.getByText('Счётчик не подключён')).toBeVisible()

    // 9. выход закрывает доступ
    await page.getByRole('button', { name: 'Выйти' }).click()
    await page.goto('/admin/orders')
    await expect(page).toHaveURL(/\/admin\/login/)
    // 422 ожидаем: шаг «ручная оплата без причины» намеренно получает отказ валидации от API (HTTP-режим)
    expect(errors.filter((e) => !e.includes('status of 422'))).toEqual([])
  })

  test('пустые состояния админки', async ({ page }) => {
    await adminLogin(page)
    await expect(page.getByText('Заказов пока нет')).toBeVisible()
    await page.getByRole('link', { name: 'Лиды' }).click()
    await expect(page.getByText('Заявок пока нет')).toBeVisible()
  })
})
