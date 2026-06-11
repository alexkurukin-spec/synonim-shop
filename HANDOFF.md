# СИНОНИМ — HANDOFF для продолжения в Cursor

Этот документ — единая точка входа, чтобы доделать и запустить сайт в **Cursor**
(или любом редакторе). Здесь: что готово, что осталось (с путями к файлам),
как запустить, как задеплоить и как эффективно работать с AI Cursor.

- **Ветка:** `claude/kind-tesla-5k28y9` (вся работа здесь; можно слить в `main`).
- **Стек:** Medusa v2 (2.15.5) backend + Next.js 15 (App Router) storefront +
  TypeScript + Tailwind v3 + PostgreSQL. Монорепо на Turbo.
- **Язык витрины:** русский, валюта **RUB**, регион `ru`.

---

## 1. Быстрый старт (локально)

Требования: **Node ≥ 20**, **PostgreSQL**, (для публичной ссылки — **cloudflared**).

```bash
git clone -b claude/kind-tesla-5k28y9 https://github.com/alexkurukin-spec/synonim-shop.git
cd synonim-shop
npm install

# БД + миграции + сид + автопрокидывание publishable-ключа в .env.local:
./scripts/dev-setup.sh
#   свой Postgres:  DATABASE_URL=postgres://user:pass@localhost:5432/synonim ./scripts/dev-setup.sh

npm run dev          # backend :9000  +  витрина :8000
```

Открыть: витрина **http://localhost:8000/ru** · admin **http://localhost:9000/app**
(логин в admin: `cd apps/backend && npx medusa user -e admin@synonim.ru -p ПАРОЛЬ`).

Полезные скрипты:
- `./scripts/dev-setup.sh` — подготовка окружения (идемпотентно).
- `./scripts/share.sh` — поднять стек + публичный туннель cloudflared (даёт https-ссылку).
- `apps/backend`: `npx medusa exec ./src/scripts/verify-yookassa-webhook.ts`,
  `verify-fiscalization.ts`, `enable-yookassa.ts`.

---

## 2. Структура репозитория

```
apps/
  backend/                      # Medusa v2 (admin + Store API)
    medusa-config.ts            # модули: payment(ЮKassa), fiscalization
    src/
      modules/yookassa/         # payment provider ЮKassa (Фаза 4)
      modules/fiscalization/    # 54-ФЗ FiscalizationService (Фаза 5)
      subscribers/order-fiscalization.ts   # order.placed → фискализация
      migration-scripts/initial-data-seed.ts  # сид: регион RUB, 13 SKU, категории
      scripts/                  # verify-/enable- утилиты
    Dockerfile, railway.json    # деплой backend
  storefront/                   # Next.js 15 (официальный Medusa starter, брендирован+RU)
    src/
      app/[countryCode]/(main)/ # витрина: главная, store, categories, products, cart, info/*, account, order
      lib/util/facets.ts        # фасетные фильтры каталога (Фаза 2/3)
      lib/util/structured-data.ts  # JSON-LD (Product/Offer/Breadcrumb/Org/WebSite)
      lib/constants/seo.ts      # SEO/бренд-константы (TODO: контакты)
      lib/constants/legal.ts    # тексты юр-страниц /info/* (TODO: реквизиты)
      modules/                  # компоненты (layout, products, checkout, cart, account, order)
scripts/                        # dev-setup.sh, share.sh
render.yaml                     # деплой (Render Blueprint: Postgres + backend)
DEPLOY.md                       # пошаговый деплой постоянной ссылки
README.md                       # обзор и статус
sinonim-claude-code-brief.md    # исходный бриф (ТЗ)
synonim-brand-tokens (1).md     # бренд-токены (палитра, шрифты, правила лого)
```

---

## 3. Что готово (Фазы 0–5 + дополнительно)

- **Фаза 0–1:** монорепо, бренд-тема, регион RUB, модель вариантов
  (Размер × Каратность × Металл), кастомные поля (`metal`, `stone`), сид на 13 SKU.
- **Фаза 2:** витрина — листинг категорий (кириллические handle), карточка товара
  с выбором варианта и пересчётом «от {min}», корзина/чекаут UI.
- **Фильтры каталога (Фаза 2/3):** фасеты каратность/огранка/размер/металл через
  URL, блок «Рекомендуемые подборки» (длинный хвост). `lib/util/facets.ts`.
- **Фаза 3 — SEO:** JSON-LD (Product/Offer/Breadcrumb/Organization/WebSite),
  canonical + noindex для фильтров, `sitemap.xml`, `robots.txt`, OG/Twitter,
  hreflang `ru-RU`, viewport без `maximum-scale`.
- **Фаза 4 — эквайринг:** payment provider module **ЮKassa**
  (initiate/authorize/capture/refund/webhook), чекаут с редиректом.
- **Фаза 5 — комплаенс:** `FiscalizationService` 54-ФЗ (без имитации успеха),
  152-ФЗ (cookie-баннер, согласие ПДн в чекауте, политика), юр-страницы `/info/*`.
- **Локализация:** вся витрина по-русски (главная, каталог, товар, корзина,
  чекаут, личный кабинет, страницы заказа), цены `19 900,00 ₽`.
- **Деплой:** Dockerfile, `railway.json`, `render.yaml`, `DEPLOY.md`.

DoD проверено: `tsc` без ошибок, `next build` 26/26, фильтры/SEO/webhook
проверены на живом стенде.

---

## 4. Что осталось

### A. Данные за владельцем (вписать — НЕ выдумывать)
| Что | Где |
|---|---|
| Реквизиты юрлица (ИНН/ОГРН/адрес) | `apps/storefront/src/lib/constants/legal.ts` (`COMPANY_PLACEHOLDER`) |
| Контакты, телефон, соцсети (`sameAs`) | `lib/constants/seo.ts`, `legal.ts` (slug `kontakty`) |
| Тексты: доставка/гарантия/возврат/оферта | `lib/constants/legal.ts` |
| Финальные SVG-логотипы (3 версии) | `apps/storefront/public/logo/` (имена не менять) |
| Фото изделий, финальные SKU | сид / admin |
| Боевые ключи ЮKassa | env `YOOKASSA_SHOP_ID/SECRET_KEY` |
| Провайдер облачной кассы (54-ФЗ) | env `FISCAL_PROVIDER/API_KEY` + реализация ниже |
| Налоговая ставка НДС | сид, `initial-data-seed.ts:412` (заглушка 0%) |

### B. Доделать в коде (для Cursor)
1. **Реальная фискализация 54-ФЗ.** Реализовать вызовы API облачной кассы в
   `apps/backend/src/modules/fiscalization/service.ts` (`registerSale`,
   `sendReceipt`). Сейчас при отсутствии ключей — `pending_fiscalization`
   без имитации (так и задумано). Провайдера выбирает владелец (АТОЛ/Бизнес.Ру/…).
2. **Sandbox-проверка ЮKassa.** С тестовыми ключами пройти заказ →
   эквайринг → webhook → `paid`. Код провайдера готов
   (`apps/backend/src/modules/yookassa/`), нужен только ключ в env.
3. **Бренд-favicon из мотива «О»** (огранка бриллианта) — опционально.
4. **Тесты + CI** (опционально): юнит-тесты для `facets`, `structured-data`,
   webhook-маппинга ЮKassa, фискализации; GitHub Actions на `tsc` + `next build`.

---

## 4b. Мобильное приложение (Expo / React Native)

Приложение в **`apps/mobile`** (автономно от монорепо), поверх того же Store
API. Готовы этапы 0–6: каталог, товар, корзина, **нативный чекаут** (ЮKassa
через встроенный браузер), **личный кабинет** (вход/регистрация, заказы,
избранное), бренд-иконка/сплэш, `eas.json` для сборки. Детали и команды —
`apps/mobile/README.md`.

- Запуск: `cd apps/mobile && cp .env.example .env && npm install && npx expo start`
  (нужен публичный URL backend — телефон не видит `localhost`).
- Осталось: push-уведомления (после `eas init` владельцем) и публикация
  в сторы (аккаунты Apple $99/год, Google $25 — на владельце).

## 4c. PWA (веб-приложение)

Витрина — устанавливаемое веб-приложение: манифест (`src/app/manifest.ts`),
иконки из мотива «О» (`public/icons/`), service worker (`public/sw.js`,
консервативный: оффлайн-страница + кэш статики, API не трогает),
`apple-touch-icon`/`appleWebApp` для iOS. После деплоя на HTTPS браузер
предложит «Установить приложение»; проверка — Lighthouse → PWA.

## 5. Деплой (постоянная ссылка)

Всё подготовлено — см. **`DEPLOY.md`**. Кратко:
- **БД** → Neon (или Render Postgres).
- **Backend** → Railway/Render по `Dockerfile` (`railway.json` / `render.yaml`).
- **Витрина** → Vercel (Root Directory = `apps/storefront`, вписать `NEXT_PUBLIC_*`).
- Порядок: backend → забрать publishable-ключ → витрина → дописать CORS.

---

## 6. Как работать с этим в Cursor

- В корне есть **`.cursorrules`** и **`.cursor/rules/synonim.mdc`** — Cursor подхватит
  их автоматически и будет знать конвенции проекта (стек, RU-локализация, запрет
  имитации фискализации, стиль коммитов).
- Хорошие стартовые промпты для Cursor:
  - «Реализуй registerSale/sendReceipt в `fiscalization/service.ts` для провайдера
    АТОЛ Онлайн по их API; не имитировать успех, ошибки — в лог и статус
    `fiscalization_failed`.»
  - «Добавь юнит-тесты (Jest) для `lib/util/facets.ts` и webhook-маппинга
    `yookassa/service.ts`.»
  - «Заполни реквизиты юрлица в `lib/constants/legal.ts` и `seo.ts` значениями: …»
- Перед коммитом гоняй: `cd apps/storefront && npx tsc --noEmit` и `npm run build`;
  для backend — `cd apps/backend && npx tsc --noEmit`.
- Стиль коммитов в репо — короткое RU-описание + тело по пунктам.

---

## 7. Переменные окружения (шпаргалка)

**Backend** (`apps/backend/.env`, из `.env.template`):
```
DATABASE_URL=postgres://...            # обязателен
STORE_CORS / ADMIN_CORS / AUTH_CORS    # домены витрины/админки
JWT_SECRET / COOKIE_SECRET             # секреты
YOOKASSA_SHOP_ID / SECRET_KEY / CAPTURE / RETURN_URL   # эквайринг (Фаза 4)
FISCAL_PROVIDER / API_KEY / TAX_SYSTEM # касса 54-ФЗ (Фаза 5)
```
**Витрина** (`apps/storefront/.env.local`):
```
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_...   # из сида/админки (dev-setup ставит сам)
NEXT_PUBLIC_DEFAULT_REGION=ru
NEXT_PUBLIC_BASE_URL=http://localhost:8000
```
