import { expect, test } from '@playwright/test'

// Проверяем СТАТИЧЕСКИЙ HTML (как его увидит поисковый робот без выполнения JS)
const PAGES = [
  '/', '/catalog', '/catalog/avtokhimiya', '/catalog/zaschita-sidenya', '/about', '/delivery', '/contacts',
  '/product/totek-ml-sae-10w30', '/product/raskoksovka-dvigatelya-reanimator', '/product/raskoksovka-dvigatelya-reanimator-5-l',
]
const NOINDEX = ['/cart', '/checkout', '/order', '/404', '/admin/login', '/admin/orders']

const text = (h: string) => h.replace(/<[^>]+>/g, '').trim()

test.describe('SEO: статический HTML', () => {
  for (const path of PAGES) {
    test(`разметка ${path}`, async ({ request }) => {
      const r = await request.get(path)
      expect(r.status()).toBe(200)
      const html = await r.text()

      expect(html).toMatch(/<html[^>]*lang="ru"/)
      const title = html.match(/<title>(.*?)<\/title>/)?.[1] ?? ''
      expect(title.length, 'title').toBeGreaterThan(10)
      expect(title.length, 'title <= 90').toBeLessThanOrEqual(90)
      const desc = html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? ''
      expect(desc.length, 'description').toBeGreaterThan(40)
      expect(desc.length, 'description <= 320').toBeLessThanOrEqual(320)
      expect(html).toMatch(/<link rel="canonical" href="https:\/\/[^"]+"/)
      expect(html).toMatch(/<meta property="og:title"/)
      expect(html).toMatch(/<meta property="og:image" content="https:\/\//)
      expect(html).toMatch(/<meta name="robots" content="index, follow/)

      // семантика
      for (const tag of ['header', 'nav', 'main', 'footer']) expect(html, `<${tag}>`).toContain(`<${tag}`)
      expect(html.match(/<main/g)).toHaveLength(1)

      // ровно один h1 и последовательная иерархия без «прыжков» вниз
      const hs = [...html.matchAll(/<h([1-6])[\s>]/g)].map((m) => Number(m[1]))
      expect(hs.filter((h) => h === 1), 'один h1').toHaveLength(1)
      expect(hs[0], 'первый заголовок — h1').toBe(1)
      for (let i = 1; i < hs.length; i++) expect(hs[i] - hs[i - 1], `скачок заголовков ${hs.slice(0, i + 1)}`).toBeLessThanOrEqual(1)

      // alt у всех изображений
      for (const img of html.match(/<img[^>]*>/g) ?? []) expect(img, img).toMatch(/alt="[^"]*"/)

      // JSON-LD валиден
      const ld = [...html.matchAll(/<script[^>]*application\/ld\+json[^>]*>(.*?)<\/script>/g)].map((m) => JSON.parse(m[1]))
      expect(ld.length).toBeGreaterThan(0)
      const types = ld.map((x) => x['@type'])
      expect(types).toContain('Organization')
      if (path !== '/') expect(types, 'BreadcrumbList').toContain('BreadcrumbList')
      if (path.startsWith('/product/')) {
        const p = ld.find((x) => x['@type'] === 'Product')
        expect(p.name).toBeTruthy()
        expect(p.brand.name).toBeTruthy()
        expect(p.image.length).toBeGreaterThan(0)
        if (!path.endsWith('-5-l')) {
          const offers = [p.offers].flat()
          for (const o of offers) {
            expect(o['@type']).toBe('Offer')
            expect(o.priceCurrency).toBe('RUB')
            expect(Number(o.price)).toBeGreaterThan(0)
            expect(o.availability).toMatch(/schema.org\/(InStock|BackOrder)/)
          }
        } else expect(p.offers, 'без цены нет Offer').toBeUndefined()
      }
      if (path === '/') expect(types).toContain('WebSite')
    })
  }

  for (const path of NOINDEX) {
    test(`noindex ${path}`, async ({ request }) => {
      const html = await (await request.get(path)).text()
      expect(html).toMatch(/<meta name="robots" content="noindex, nofollow"/)
    })
  }

  test('страница с фильтрами не индексируется (noindex), но имеет canonical без параметров', async ({ page }) => {
    await page.goto('/catalog?q=diesel')
    await expect(page.locator('meta[name=robots]')).toHaveAttribute('content', /noindex/)
    await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', /\/catalog$/)
  })

  test('robots.txt и sitemap.xml', async ({ request }) => {
    const robots = await (await request.get('/robots.txt')).text()
    expect(robots).toContain('Sitemap:')
    expect(robots).toContain('Disallow: /admin')
    const sm = await (await request.get('/sitemap.xml')).text()
    const locs = [...sm.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1])
    expect(locs.length).toBe(1 + 4 + 12 + 41) // главная, каталог/о магазине/доставка/контакты, категории, товары
    expect(new Set(locs).size).toBe(locs.length)
    expect(sm).not.toContain('/cart')
    expect(sm).not.toContain('/admin')
  })

  test('нет битых ссылок: все URL из sitemap отдают 200, все внутренние ссылки главной ведут на существующие страницы', async ({ request }) => {
    const sm = await (await request.get('/sitemap.xml')).text()
    const paths = [...sm.matchAll(/<loc>https:\/\/[^/]+\/greenol-shop(\/[^<]*)<\/loc>/g)].map((m) => m[1])
    for (const p of paths) expect((await request.get(p)).status(), p).toBe(200)

    const home = await (await request.get('/')).text()
    const hrefs = new Set([...home.matchAll(/href="(\/[^"#?]*)"/g)].map((m) => m[1]).filter((h) => !/\.(png|webp|ico)$/.test(h)))
    for (const h of hrefs) expect((await request.get(h)).status(), h).toBe(200)
  })

  test('изображения товаров существуют и сжаты', async ({ request }) => {
    const html = await (await request.get('/product/totek-ml-sae-10w30')).text()
    const srcs = [...new Set([...html.matchAll(/src="(\/img\/[^"]+)"/g)].map((m) => m[1]))]
    expect(srcs.length).toBeGreaterThan(0)
    for (const s of srcs) {
      const r = await request.get(s)
      expect(r.status(), s).toBe(200)
      expect((await r.body()).length, `${s} слишком тяжёлый`).toBeLessThan(250_000)
    }
  })

  test('в публичной разметке нет следов старого бренда и демо-режима', async ({ request }) => {
    for (const p of PAGES) {
      const html = text(await (await request.get(p)).text()).toLowerCase()
      expect(html, p).not.toMatch(/магазин макса|демо-версия|тестовые данные|тестовый товар/)
    }
  })
})
