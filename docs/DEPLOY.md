# Развёртывание бэкенда (Render + SQLite)

Бэкенд — `server/` (Hono + SQLite). Конфигурация: `render.yaml`, `Dockerfile`.

## 1. Render
1. Зарегистрироваться на render.com, в **Account → Billing** привязать карту (нужен платный план Starter ради постоянного диска, иначе файлы SQLite стираются при перезапуске).
2. **New → Blueprint** → выбрать репозиторий `greenol-shop`. Render найдёт `render.yaml`.
3. На запрос `ADMIN_PASSWORD_HASH` вставить хэш пароля (получить: `node scripts/hash-password.mjs "ваш-пароль"`). Пароль в Render не хранится.
4. Дождаться деплоя; проверить `https://<сервис>.onrender.com/api/health` → `{"ok":true}`.

## 2. Подключение витрины
В репозитории GitHub: **Settings → Secrets and variables → Actions → Variables → New** `API_URL` = `https://<сервис>.onrender.com`. Затем перезапустить workflow «Deploy to GitHub Pages». Пока `API_URL` пуст, сайт работает в локальном режиме.

## 3. Важно
- Витрина (github.io) и API (onrender.com) — разные домены, поэтому cookie админки идёт как `SameSite=None; Secure` (`CROSS_SITE_COOKIES=true`). Браузеры могут ограничивать сторонние cookie; надёжнее держать оба на одном домене (например `shop.example.ru` и `api.shop.example.ru`).
- `PAYMENT_MODE=sandbox`: оплата имитируется. `live` — только после подключения банка и подтверждения заказчика; webhook банка: `POST /api/payments/webhook` (подпись `X-Signature`, HMAC-SHA256 от тела, секрет `PAYMENT_WEBHOOK_SECRET`).
- Резервные копии: снимки диска Render (Disks → Snapshots) или `sqlite3 /data/shop.db ".backup ..."` по расписанию.
- SQLite — один сервер; для масштабирования — PostgreSQL (интерфейс `Store` в `src/core/orders.ts`).
- Rate limit хранится в памяти процесса.
