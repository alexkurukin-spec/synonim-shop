# Деплой СИНОНИМ — постоянная ссылка

Цель: получить публичный URL витрины, который живёт без твоего компьютера.

Рекомендуемый стек (всё с бесплатными тарифами для демо):

| Слой | Сервис | Что деплоим |
|---|---|---|
| База данных | **Neon** | PostgreSQL |
| Backend (Medusa) | **Railway** | `apps/backend` (по Dockerfile) |
| Витрина (Next.js) | **Vercel** | `apps/storefront` |

> Альтернативы: backend — Render / Fly.io / Medusa Cloud; БД — Supabase. Шаги аналогичны, отличаются только UI.

Порядок важен: **БД → backend → ключ → витрина** (витрине нужен publishable-ключ, который генерирует сид backend).

---

## Деплой в один клик (blueprint-файлы)

В репозитории лежат готовые конфиги, чтобы не настраивать backend руками:

- **Render:** `render.yaml` (в корне) — создаёт PostgreSQL + backend-сервис из Dockerfile, генерирует `JWT_SECRET`/`COOKIE_SECRET`, подключает БД.
  Применение: Render Dashboard → **New → Blueprint** → выбрать репозиторий. Дальше задать `*_CORS` в Dashboard (см. ниже).
- **Railway:** `apps/backend/railway.json` — велит Railway собирать сервис по `Dockerfile` с healthcheck `/health`.
  Применение: New Project → repo → Root Directory = `apps/backend` (railway.json подхватится автоматически), задать env-секреты.

> Витрина (Next.js) в blueprint **не входит**: её `NEXT_PUBLIC_*` нужны на этапе сборки, а publishable-ключ появляется только после сида backend. Поэтому витрину импортируем в Vercel отдельно (раздел 3) — это тоже фактически один клик.

Дальше — ручные шаги по сервисам (БД-строка, ключ, CORS, Vercel).

---

## 0. Подготовка

- Залей ветку в GitHub (уже сделано): `claude/kind-tesla-5k28y9`. Можно слить в `main`.
- Сгенерируй два секрета (понадобятся для backend):
  ```bash
  openssl rand -hex 32   # JWT_SECRET
  openssl rand -hex 32   # COOKIE_SECRET
  ```

---

## 1. База данных — Neon

1. Зарегистрируйся на https://neon.tech → **Create project**, регион поближе (EU).
2. Скопируй **Connection string** вида:
   ```
   postgres://USER:PASSWORD@ep-xxxx.eu-central-1.aws.neon.tech/neondb?sslmode=require
   ```
   Это будущий `DATABASE_URL`. `?sslmode=require` обязателен.

---

## 2. Backend (Medusa) — Railway

1. https://railway.app → **New Project → Deploy from GitHub repo** → выбери репозиторий и ветку.
2. В сервисе: **Settings → Root Directory** = `apps/backend`.
   Railway подхватит `apps/backend/Dockerfile` (лежит в репо).
3. **Settings → Networking → Generate Domain** → получишь `https://<backend>.up.railway.app`.
4. **Variables** — задай env:
   ```
   DATABASE_URL   = <строка из Neon, с ?sslmode=require>
   JWT_SECRET     = <openssl rand -hex 32>
   COOKIE_SECRET  = <openssl rand -hex 32>
   STORE_CORS     = https://<твой-проект>.vercel.app
   ADMIN_CORS     = https://<backend>.up.railway.app
   AUTH_CORS      = https://<твой-проект>.vercel.app,https://<backend>.up.railway.app
   # ЮKassa (опционально, для оплаты):
   YOOKASSA_SHOP_ID    = ...
   YOOKASSA_SECRET_KEY = ...
   YOOKASSA_RETURN_URL = https://<твой-проект>.vercel.app/ru/order/confirmed
   # Фискализация 54-ФЗ (опционально):
   FISCAL_PROVIDER = ...
   FISCAL_API_KEY  = ...
   ```
   > Домен Vercel узнаешь на шаге 4 — можно вписать CORS позже и передеплоить.
5. Дождись билда и старта. Контейнер при запуске сам прогоняет миграции (`medusa db:migrate`) — схема и сид создадутся автоматически.
6. **Создай админа и забери publishable-ключ.** В Railway: **service → ⋮ → Shell** (или локально с тем же `DATABASE_URL`):
   ```bash
   # админ для входа в /app
   npx medusa user -e admin@synonim.ru -p СильныйПароль

   # publishable-ключ для витрины:
   psql "$DATABASE_URL" -tAc "SELECT token FROM api_key WHERE type='publishable' AND deleted_at IS NULL LIMIT 1"
   ```
   Скопируй `pk_...`.
7. Проверь backend: `https://<backend>.up.railway.app/health` → `OK`,
   admin: `https://<backend>.up.railway.app/app`.

---

## 3. Витрина (Next.js) — Vercel

1. https://vercel.com → **Add New → Project** → импортируй тот же GitHub-репозиторий.
2. **Root Directory** = `apps/storefront`. Framework — **Next.js** (определится сам).
   > Монорепо на npm-workspaces: если установка падает, в **Settings → General → Install Command** укажи `npm install --prefix ../..` (или включи «Include files outside root»).
3. **Environment Variables:**
   ```
   NEXT_PUBLIC_MEDUSA_BACKEND_URL     = https://<backend>.up.railway.app
   NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY = pk_... (из шага 2.6)
   NEXT_PUBLIC_DEFAULT_REGION         = ru
   NEXT_PUBLIC_BASE_URL               = https://<твой-проект>.vercel.app
   ```
4. **Deploy.** Получишь `https://<твой-проект>.vercel.app` — **это и есть ссылка для коллеги.**

---

## 4. Связать CORS и финальная проверка

1. Вернись в Railway → **Variables** и впиши реальный домен Vercel в `STORE_CORS` / `AUTH_CORS` → передеплой backend.
2. Открой `https://<твой-проект>.vercel.app/ru` — должны грузиться категории и товары.
3. Чек-лист:
   - `/ru`, `/ru/store`, `/ru/categories/кольца`, `/ru/products/ring-gran` — 200;
   - `/sitemap.xml`, `/robots.txt`, `/ru/info/dostavka` — 200;
   - в `<head>` товара есть JSON-LD `Product`/`Offer`.

---

## Заметки и подводные камни

- **Порядок env:** витрина без `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` не стартует (проверка в `check-env-variables.js`). Сначала backend+ключ, потом Vercel.
- **CORS:** если в браузере видны ошибки регионов — проверь, что домен Vercel есть в `STORE_CORS`/`AUTH_CORS` backend.
- **Redis:** для одного инстанса не нужен (Medusa использует in-memory event bus — будет `warn` в логах, для демо ок). Для прод-нагрузки добавь `REDIS_URL` и сконфигурируй модули.
- **Порт:** контейнер слушает `$PORT` (Railway/Render задают его сами), иначе 9000 — задано в `Dockerfile` (`medusa start -p ${PORT:-9000}`). Отдельно настраивать порт не нужно.
- **Миграции:** прогоняются в Dockerfile при старте контейнера. Если хочешь отделить — убери `medusa db:migrate` из `CMD` и запускай отдельной командой/в pre-deploy.
- **Оплата:** реальный платёж заработает только с боевыми ключами ЮKassa; без них провайдер зарегистрирован, но платёж отклоняется. Для демо-просмотра каталога ключи не нужны.
- **Стоимость:** Neon/Vercel — щедрые бесплатные тарифы; Railway даёт пробный кредит, дальше ~5$/мес за小 инстанс. Render имеет бесплатный web-service (засыпает при простое).

---

## Альтернатива backend — Render

1. https://render.com → **New → Web Service** → репозиторий, **Root Directory** = `apps/backend`, **Runtime** = Docker.
2. Те же env, что в разделе 2.
3. Создай Postgres на Render или используй Neon.
4. Домен Render → в `NEXT_PUBLIC_MEDUSA_BACKEND_URL` на Vercel.
