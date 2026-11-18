import { expect, test, type Page } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { ADMIN_PASSWORD, adminLogin } from './helpers'

// «Резина»: плотная сетка ширин от 320 до 1600 — телефоны, планшеты, десктопы и всё между ними
const WIDTHS = [320, 360, 375, 390, 412, 430, 480, 540, 600, 700, 768, 820, 900, 1024, 1100, 1180, 1280, 1366, 1440, 1600]
const SHOTS = new Set([360, 390, 768, 1024, 1440])
const OUT = process.env.SHOTS_DIR ?? 'test-results/shots'

const PUBLIC = [
  ['home', '/'], ['catalog', '/catalog'], ['category', '/catalog/avtokhimiya'], ['category-empty-sub', '/catalog/avtomasla'],
  ['product', '/product/totek-astra-robot-1'], ['product-long', '/product/totek-ml-sae-10w30'], ['product-request', '/product/raskoksovka-dvigatelya-reanimator-5-l'],
  ['search-empty', '/catalog?q=zzzz'], ['about', '/about'], ['delivery', '/delivery'], ['contacts', '/contacts'], ['404', '/nope'],
]

/** Возвращает описание элементов, выходящих за пределы окна (вне прокручиваемых контейнеров) */
async function overflow(page: Page) {
  return page.evaluate(() => {
    const vw = document.documentElement.clientWidth
    const issues: string[] = []
    if (document.documentElement.scrollWidth > vw + 1) issues.push(`горизонтальный скролл: scrollWidth=${document.documentElement.scrollWidth} > ${vw}`)
    const scrollable = (el: Element | null): boolean => {
      for (let n = el; n && n !== document.body; n = n.parentElement) {
        const s = getComputedStyle(n)
        if (/(auto|scroll|hidden|clip)/.test(s.overflowX) && n !== document.documentElement) return true
      }
      return false
    }
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect()
      if (!r.width || !r.height) continue
      const st = getComputedStyle(el)
      if (st.position === 'fixed' || st.visibility === 'hidden' || el.closest('.sr-only')) continue
      if ((r.right > vw + 1 || r.left < -1) && !scrollable(el.parentElement)) {
        issues.push(`${el.tagName.toLowerCase()}.${String(el.className).slice(0, 50)} [${Math.round(r.left)}..${Math.round(r.right)}] "${(el.textContent ?? '').trim().slice(0, 25)}"`)
        if (issues.length > 6) break
      }
    }
    // слишком мелкие кликабельные зоны (< 32px по меньшей стороне) для видимых ссылок/кнопок
    const tiny: string[] = []
    for (const el of document.querySelectorAll('a[href], button, input, select, textarea')) {
      const r = el.getBoundingClientRect()
      if (!r.width || !r.height || el.closest('.sr-only') || (el as HTMLInputElement).type === 'hidden') continue
      if (el.closest('p, li, address, dd, section > p') && el.tagName === 'A' && r.height < 32) continue // ссылки внутри текста
      if (Math.min(r.width, r.height) < 24 && !(el as HTMLInputElement).type?.match(/checkbox|radio/)) tiny.push(`${el.tagName}:"${(el.textContent ?? '').trim().slice(0, 20)}" ${Math.round(r.width)}x${Math.round(r.height)}`)
    }
    if (tiny.length > 0) issues.push('мелкие зоны клика: ' + tiny.slice(0, 3).join('; '))
    return issues
  })
}

test.describe('адаптивность (публичные страницы)', () => {
  for (const w of WIDTHS) {
    test(`ширина ${w}px`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: w < 700 ? 800 : 900 })
      const problems: string[] = []
      for (const [name, path] of PUBLIC) {
        await page.goto(path)
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(450) // дождаться анимации появления
        const issues = await overflow(page)
        if (issues.length) problems.push(`${name} ${path}: ${issues.join(' | ')}`)
        if (SHOTS.has(w)) {
          mkdirSync(`${OUT}/${w}`, { recursive: true })
          await page.screenshot({ path: `${OUT}/${w}/${name}.png`, fullPage: true })
        }
      }
      // корзина и оформление с товарами
      await page.goto('/product/totek-astra-robot-1')
      await page.getByRole('button', { name: 'В корзину', exact: true }).click()
      for (const [name, path] of [['cart', '/cart'], ['checkout', '/checkout']]) {
        await page.goto(path)
        await page.waitForTimeout(450)
        const issues = await overflow(page)
        if (issues.length) problems.push(`${name}: ${issues.join(' | ')}`)
        if (SHOTS.has(w)) await page.screenshot({ path: `${OUT}/${w}/${name}.png`, fullPage: true })
      }
      // мобильное меню/панели
      if (w < 1024) {
        await page.goto('/catalog')
        await page.getByRole('button', { name: 'Фильтры' }).click()
        await page.waitForTimeout(250)
        const issues = await overflow(page)
        if (issues.length) problems.push(`filters-modal: ${issues.join(' | ')}`)
        if (SHOTS.has(w)) await page.screenshot({ path: `${OUT}/${w}/filters-modal.png` })
      } else {
        await page.goto('/catalog')
        await page.getByRole('button', { name: 'Каталог' }).click()
        await page.waitForTimeout(250)
        const issues = await overflow(page)
        if (issues.length) problems.push(`category-menu: ${issues.join(' | ')}`)
        if (SHOTS.has(w)) await page.screenshot({ path: `${OUT}/${w}/category-menu.png` })
      }
      expect(problems, problems.join('\n')).toEqual([])
    })
  }
})

test.describe('адаптивность (админка)', () => {
  test.skip(!ADMIN_PASSWORD, 'Нужна переменная ADMIN_PASSWORD')
  for (const w of [360, 390, 768, 1024, 1440]) {
    test(`ширина ${w}px`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: 900 })
      // создаём заказ, чтобы таблицы были непустыми
      await page.goto('/product/totek-astra-robot-1')
      await page.getByRole('button', { name: 'В корзину', exact: true }).click()
      await page.goto('/checkout')
      await page.getByLabel('Имя').fill('Анна')
      await page.getByLabel('Телефон').fill('9161112233')
      await page.getByRole('textbox', { name: 'Город' }).fill('Москва')
      await page.getByLabel('Адрес или пункт выдачи').fill('ул. Тверская, 1')
      await page.getByLabel(/Согласен на обработку/).check()
      await page.getByRole('button', { name: 'Оплатить' }).click()
      await page.waitForURL(/\/order\?id=/)
      await page.goto('/contacts')
      await page.getByLabel('Имя').fill('Лид')
      await page.getByLabel('Телефон').fill('9165554433')
      await page.getByLabel(/Согласен/).check()
      await page.getByRole('button', { name: 'Отправить заявку' }).click()
      await adminLogin(page)
      const problems: string[] = []
      for (const [name, path] of [['admin-orders', '/admin/orders'], ['admin-leads', '/admin/leads'], ['admin-analytics', '/admin/analytics']]) {
        await page.goto(path)
        await page.waitForTimeout(400)
        const issues = await overflow(page)
        if (issues.length) problems.push(`${name}: ${issues.join(' | ')}`)
        if (SHOTS.has(w)) { mkdirSync(`${OUT}/${w}`, { recursive: true }); await page.screenshot({ path: `${OUT}/${w}/${name}.png`, fullPage: true }) }
      }
      await page.goto('/admin/orders')
      await page.getByRole('link', { name: /^GR-/ }).first().click()
      await page.waitForTimeout(400)
      const issues = await overflow(page)
      if (issues.length) problems.push(`admin-order: ${issues.join(' | ')}`)
      if (SHOTS.has(w)) await page.screenshot({ path: `${OUT}/${w}/admin-order.png`, fullPage: true })
      expect(problems, problems.join('\n')).toEqual([])
    })
  }
})
