import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import { existsSync, writeFileSync } from 'node:fs'
import catalog from './src/data/catalog.json'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const siteUrl = (env.VITE_SITE_URL || 'https://sosukii.github.io/greenol-shop').replace(/\/$/, '')
  return {
    // Для GitHub Pages: сайт живёт в подпапке /<repo>/
    base: process.env.BASE_PATH ?? '/',
    plugins: [vue(), tailwindcss()],
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    build: { target: 'es2022', cssCodeSplit: true },
    ssgOptions: {
      script: 'async',
      dirStyle: 'flat', // about.html, product/x.html — GitHub Pages отдаёт их по адресам /about и /product/x без редиректов
      formatting: 'minify',
      // Prerender: все статические страницы (включая оболочки /order и /admin/*) + категории и товары.
      includedRoutes(paths: string[]) {
        const fixed = paths.filter((p) => p !== '/admin' && !p.includes(':') && !p.includes('*'))
        return [
          ...fixed,
          '/catalog',
          ...catalog.categories.map((c) => `/catalog/${c.slug}`),
          ...catalog.products.map((p) => `/product/${p.slug}`),
        ]
      },
      async onFinished() {
        const out = 'dist'
        const lastmod = new Date().toISOString().slice(0, 10)
        const urls = [
          '/', '/catalog', '/about', '/delivery', '/contacts',
          ...catalog.categories.map((c) => `/catalog/${c.slug}`),
          ...catalog.products.map((p) => `/product/${p.slug}`),
        ]
        writeFileSync(`${out}/sitemap.xml`, `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
          .map((u) => `  <url><loc>${siteUrl}${u === '/' ? '/' : u}</loc><lastmod>${lastmod}</lastmod><priority>${u === '/' ? '1.0' : u.startsWith('/product') ? '0.7' : '0.8'}</priority></url>`)
          .join('\n')}\n</urlset>\n`)
        writeFileSync(`${out}/robots.txt`, `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /cart\nDisallow: /checkout\nDisallow: /order\nDisallow: /*?q=\nDisallow: /*?page=\n\nSitemap: ${siteUrl}/sitemap.xml\n`)
        // 404.html (маршрут /404) GitHub Pages отдаёт для неизвестных адресов; клиентский роутер на нём откроет /order/:id и /admin
        if (!existsSync(`${out}/404.html`)) throw new Error('404.html не создан')
      },
    },
    ssr: { noExternal: ['@unhead/vue'] },
  }
})
