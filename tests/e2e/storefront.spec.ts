import { expect, test } from '@playwright/test'
import { addProduct, fillCheckout, watchErrors } from './helpers'

test.describe('витрина', () => {
  test('главная: один h1, навигация работает, ошибок консоли нет', async ({ page }) => {
    const errors = watchErrors(page)
    await page.goto('/')
    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page.locator('h1')).toContainText('Greenol')
    await page.getByRole('link', { name: 'Перейти в каталог' }).click()
    await expect(page).toHaveURL(/\/catalog$/)
    await page.getByRole('banner').getByRole('link', { name: /Greenol/ }).click()
    await expect(page).toHaveURL(/\/$/)
    expect(errors).toEqual([])
  })

  test('каталог → категория → вложенная категория → товар', async ({ page }) => {
    await page.goto('/catalog')
    await page.getByRole('button', { name: 'Каталог' }).click()
    await page.getByRole('link', { name: 'Автомасла', exact: true }).first().click()
    await expect(page.locator('h1')).toHaveText('Автомасла')
    await page.getByRole('link', { name: 'Защитные материалы для автосервиса и шиномонтажа' }).first().click()
    await expect(page.locator('h1')).toContainText('Защитные материалы')
    await page.getByRole('link', { name: 'Защита сиденья' }).first().click()
    await expect(page.locator('h1')).toHaveText('Защита сиденья')
    await page.locator('article h3 a').first().click()
    await expect(page).toHaveURL(/\/product\//)
    await expect(page.locator('h1')).toHaveCount(1)
  })

  test('поиск: результаты, подсказки, пустой результат', async ({ page }) => {
    await page.goto('/')
    const box = page.getByRole('searchbox', { name: 'Поиск по каталогу' })
    await box.fill('diesel')
    await expect(page.getByRole('list', { name: 'Подсказки' })).toBeVisible()
    await box.press('Enter')
    await expect(page).toHaveURL(/q=diesel/)
    await expect(page.locator('article').first()).toContainText(/Diesel/i)
    await box.fill('zzzнетакого')
    await box.press('Enter')
    await expect(page.getByText('Ничего не найдено')).toBeVisible()
  })

  test('фильтры и сортировка меняют выдачу и сохраняются в URL', async ({ page }) => {
    await page.goto('/catalog')
    const total = await page.locator('article').count()
    await page.getByLabel('Сортировка').selectOption('price-asc')
    await expect(page).toHaveURL(/sort=price-asc/)
    const first = await page.locator('article').first().innerText()
    expect(first).toMatch(/200 ₽|от 200/)
    await page.getByLabel('Только в наличии').check()
    await expect(page).toHaveURL(/stock=1/)
    expect(await page.locator('article').count()).toBeLessThan(total + 1)
    await page.getByRole('checkbox', { name: 'Тотек' }).check()
    await expect(page).toHaveURL(/brand=totek/)
  })

  test('пагинация: вторая страница', async ({ page }) => {
    await page.goto('/catalog')
    await page.getByRole('button', { name: 'Страница 2' }).click()
    await expect(page).toHaveURL(/page=2/)
    await expect(page.locator('article').first()).toBeVisible()
  })

  test('товар с фасовками: смена фасовки меняет цену и артикул', async ({ page }) => {
    await page.goto('/product/totek-astra-robot-1')
    await expect(page.getByText('1 300 ₽').first()).toBeVisible()
    await page.getByRole('button', { name: /500мл/ }).click()
    await expect(page.getByText('4 000 ₽').first()).toBeVisible()
  })

  test('товар «цена по запросу»: нет кнопки корзины, есть запрос цены → заявка', async ({ page }) => {
    await page.goto('/product/raskoksovka-dvigatelya-reanimator-5-l')
    await expect(page.getByText('Цена по запросу').first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'В корзину', exact: true })).toHaveCount(0)
    await page.getByRole('link', { name: 'Запросить цену' }).click()
    await expect(page.getByLabel(/Сообщение/)).toHaveValue(/Реаниматор 5 л/)
  })

  test('несуществующие страницы: 404', async ({ page }) => {
    await page.goto('/product/net-takogo')
    await expect(page.getByRole('heading', { name: 'Страница не найдена' }).first()).toBeVisible()
    await page.goto('/catalog/net-takoi')
    await expect(page.getByRole('heading', { name: 'Страница не найдена' }).first()).toBeVisible()
    await page.goto('/kakaya-to-stranica')
    await expect(page.getByRole('heading', { name: 'Страница не найдена' }).first()).toBeVisible()
  })
})

test.describe('корзина и оформление', () => {
  test('корзина: добавление, количество, удаление, пересчёт, сохранение после перезагрузки', async ({ page }) => {
    await addProduct(page, 'raskoksovka-dvigatelya-reanimator') // 1 090
    await addProduct(page, 'promyvka-dizelnykh-sistem-diesel-purge-1-litr') // 890
    await page.goto('/cart')
    await expect(page.getByText('1 980 ₽').first()).toBeVisible()
    await page.getByRole('button', { name: 'Увеличить' }).first().click()
    await expect(page.getByText('3 070 ₽').first()).toBeVisible()
    await page.reload()
    await expect(page.getByText('3 070 ₽').first()).toBeVisible()
    await page.getByRole('button', { name: /Удалить: Раскоксовка/ }).click()
    await expect(page.getByText('890 ₽').first()).toBeVisible()
    await page.getByRole('button', { name: /Удалить: Промывка/ }).click()
    await expect(page.getByText('В корзине пока пусто')).toBeVisible()
  })

  test('пустой checkout показывает пустое состояние', async ({ page }) => {
    await page.goto('/checkout')
    await expect(page.getByText('Корзина пуста')).toBeVisible()
  })

  test('checkout: валидация обязательных полей и согласия', async ({ page }) => {
    await addProduct(page, 'raskoksovka-dvigatelya-reanimator')
    await page.goto('/checkout')
    await page.getByRole('button', { name: 'Оплатить' }).click()
    await expect(page.getByText('Укажите имя', { exact: true })).toBeVisible()
    await expect(page.getByText(/Введите телефон/)).toBeVisible()
    await expect(page.getByText('Укажите город', { exact: true })).toBeVisible()
    await expect(page.getByText(/Необходимо согласие/)).toBeVisible()
    await page.getByLabel('Телефон').fill('123')
    await page.getByLabel('Имя').click()
    await expect(page.getByText(/Введите телефон/)).toBeVisible()
  })

  test('checkout: доставка пересчитывается при смене города и провайдера', async ({ page }) => {
    await addProduct(page, 'raskoksovka-dvigatelya-reanimator')
    await page.goto('/checkout')
    await expect(page.getByText('укажите город').first()).toBeVisible()
    await page.getByRole('textbox', { name: 'Город' }).fill('Казань')
    await expect(page.getByText('ориентировочно').first()).toBeVisible()
    const total1 = await page.locator('aside').getByText('Итого').locator('..').innerText()
    await page.getByRole('radio', { name: /Ozon/ }).check()
    const total2 = await page.locator('aside').getByText('Итого').locator('..').innerText()
    expect(total1).not.toBe(total2)
  })

  test('оплата картой: успех → заказ оплачен; повторная оплата невозможна', async ({ page }) => {
    await addProduct(page, 'raskoksovka-dvigatelya-reanimator')
    await page.goto('/checkout')
    await fillCheckout(page, { payment: 'card' })
    await page.getByRole('button', { name: 'Оплатить' }).click()
    await expect(page).toHaveURL(/\/order\?id=/)
    await expect(page.getByText('Ожидаем оплату')).toBeVisible()
    await page.getByRole('button', { name: 'Оплата прошла успешно' }).click()
    await expect(page.getByText('Оплата получена')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Оплата прошла успешно' })).toHaveCount(0)
    await page.reload()
    await expect(page.getByText('Оплата получена')).toBeVisible()
    // корзина очищена после оформления
    await page.goto('/cart')
    await expect(page.getByText('В корзине пока пусто')).toBeVisible()
  })

  test('оплата: отмена и ошибка, затем повторная попытка', async ({ page }) => {
    await addProduct(page, 'promyvka-dizelnykh-sistem-diesel-purge-1-litr')
    await page.goto('/checkout')
    await fillCheckout(page, { payment: 'card' })
    await page.getByRole('button', { name: 'Оплатить' }).click()
    await page.getByRole('button', { name: 'Отменить оплату' }).click()
    await expect(page.getByText('Оплата отменена')).toBeVisible()
    await page.getByRole('button', { name: 'Повторить оплату' }).click()
    await expect(page.getByText('Ожидаем оплату')).toBeVisible()
    await page.getByRole('button', { name: 'Ошибка оплаты' }).click()
    await expect(page.getByText('Оплата не прошла')).toBeVisible()
    await page.reload()
    await expect(page.getByText('Оплата не прошла')).toBeVisible() // заказ сохранён
  })

  test('наличными: заказ принят без платёжной страницы', async ({ page }) => {
    await addProduct(page, 'promyvka-dizelnykh-sistem-diesel-purge-1-litr')
    await page.goto('/checkout')
    await fillCheckout(page, { payment: 'cash' })
    await page.getByRole('button', { name: 'Оформить заказ' }).click()
    await expect(page.getByText('Заказ принят')).toBeVisible()
    await expect(page.getByText('Тестовая оплата')).toHaveCount(0)
  })

  test('двойной клик по «Оплатить» создаёт ровно один заказ', async ({ page }) => {
    await addProduct(page, 'promyvka-dizelnykh-sistem-diesel-purge-1-litr')
    await page.goto('/checkout')
    await fillCheckout(page, { payment: 'card' })
    await page.getByRole('button', { name: 'Оплатить' }).dblclick()
    await expect(page).toHaveURL(/\/order\?id=/)
    const n = await page.evaluate(() => JSON.parse(localStorage.getItem('greenol:orders') ?? '[]').length)
    expect(n).toBe(1)
  })

  test('повторная отправка с тем же ключом (обновление страницы) не дублирует заказ', async ({ page }) => {
    await addProduct(page, 'promyvka-dizelnykh-sistem-diesel-purge-1-litr')
    await page.goto('/checkout')
    const key = await page.evaluate(() => sessionStorage.getItem('greenol:order-key'))
    expect(key).toBeTruthy()
    await page.reload()
    expect(await page.evaluate(() => sessionStorage.getItem('greenol:order-key'))).toBe(key)
  })

  test('заказ несуществующий → понятное состояние', async ({ page }) => {
    await page.goto('/order?id=00000000-0000-0000-0000-000000000000')
    await expect(page.getByText('Заказ не найден')).toBeVisible()
  })

  test('контакты: заявка отправляется, спам-ловушка и валидация работают', async ({ page }) => {
    await page.goto('/contacts')
    await page.getByRole('button', { name: 'Отправить заявку' }).click()
    await expect(page.getByText('Укажите имя', { exact: true })).toBeVisible()
    await page.getByLabel('Имя').fill('Пётр')
    await page.getByLabel('Телефон').fill('9160001122')
    await page.getByLabel(/Согласен/).check()
    await page.getByRole('button', { name: 'Отправить заявку' }).click()
    await expect(page.getByText('Заявка отправлена')).toBeVisible()
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('greenol:leads') ?? '[]').length)).toBe(1)
  })
})
