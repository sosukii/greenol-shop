# Greenol — официальный интернет-магазин

**Vue 3 + TypeScript + Vite (SSG) + Tailwind CSS 4 + Pinia + Vue Router**, бэкенд на Hono. Каталог — реальные данные
действующего магазина greenolwemidas.ru (41 товар, 12 категорий).

## Запуск
```bash
npm install
npm run dev          # витрина http://localhost:5173 (локальный режим, данные в браузере)
npm test             # unit + интеграционные тесты (vitest)
npm run build        # типы + prerender всех страниц в dist/
npm run test:e2e     # Playwright (нужен Google Chrome); ADMIN_PASSWORD=... для админских сценариев
npm run server       # бэкенд (см. .env.example)
```

## Архитектура
- `src/data/catalog.json` + `src/data/catalog.ts` — каталог (замена на API — меняется только `catalog.ts`).
  Обновление из источника: `scripts/import/`, изображения: `scripts/optimize-images.mjs`.
- `src/config/site.ts` — **единая конфигурация**: бренд, контакты, юр. данные, способы оплаты, тарифы доставки, мессенджеры.
- `src/core/` — бизнес-логика заказов (общая для сервера и локального режима): пересчёт цен по каталогу,
  идемпотентность, валидация, статусы, аудит.
- `src/api/` — адаптер: `local` (localStorage, для статического хостинга) или `http` (`VITE_API_URL` → `server/`).
- `server/` — Hono API: заказы, лиды, webhook оплаты (HMAC), админка (httpOnly cookie, rate limit).
- SEO: prerender каждой страницы (flat HTML для GitHub Pages), title/description/canonical/OG/JSON-LD
  (Product, Offer, BreadcrumbList, Organization, WebSite), `sitemap.xml`, `robots.txt`.
- Стили: Tailwind, индивидуальные стили в объекте `classes` (`:class="classes.title"`), UI-кит `src/components/ui`.

## Ограничения (до запуска в production)
- Оплата — **песочница** (`VITE_PAYMENT_MODE=sandbox`): банк не выбран/не подключён.
- Доставка СДЭК/Ozon — тарифная таблица в конфиге (ориентировочно), реальные API не подключены.
- Админка на GitHub Pages работает в **локальном режиме**: данные в браузере посетителя, логин проверяется в браузере —
  это демонстрация интерфейса, не защита. Реальная защита — только с `server/`.
- Нужны от заказчика: юридические тексты (политика, согласие), ссылки MAX/Telegram/WhatsApp, ID Метрики,
  вес/габариты товаров, актуальные способы оплаты. Подробности — `docs/AUDIT.md`.
