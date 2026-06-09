# СИНОНИМ — интернет-магазин

Ювелирный бренд: серебро с выращенными (лабораторными) бриллиантами.
Стек: **Medusa v2** (backend) + **Next.js 15** App Router (storefront) + TypeScript + Tailwind CSS + Postgres.

Монорепо на Turbo:

```
apps/
  backend/      # Medusa v2 (admin + Store API)
  storefront/   # Next.js 15 storefront (официальный Medusa starter, брендирован)
```

> Полный бриф проекта — `sinonim-claude-code-brief.md`, бренд-токены — `synonim-brand-tokens (1).md`.

---

## Статус

- **Фаза 0 — инициализация** ✅ (storefront + бренд-система; см. ниже)
- **Фаза 1 — backend и каталог** ✅ (регион RUB, модель вариантов, кастомные поля, seed на 13 SKU)

---

## Фаза 1 — backend и каталог ✅

Сделано:
- **Регион:** Россия, валюта **RUB**, страна `ru`. Налоговый регион `ru` заведён с заглушкой ставки (`НДС` = 0%, TODO уточнить — для ювелирки в РФ обычно 20%).
- **Магазин/канал:** store «СИНОНИМ» (единственная валюта `rub`), канал «Основной канал продаж», publishable key.
- **Логистика:** склад «Шоурум Москва», зона «Россия», доставки «Курьер по Москве» (500 ₽) и «СДЭК / Почта России» (600 ₽).
- **Категории навигации:** Кольца, Серьги, Подвески и колье, Браслеты, Помолвочные кольца.
- **Модель вариантов** (раздел 2 брифа): опции **Размер** × **Каратность** (0.1 / 0.2 / 0.3 / 0.5 ct) × **Металл** (Серебро 925). Цена — на вариант; каратность — драйвер цены, поэтому у товаров с несколькими каратностями есть варианты с разной ценой → на витрине корректно считается **«от {min}»**.
- **Кастомные поля** (`metadata`, без оверинжиниринга):
  - `product.metadata.metal` = `silver-925`;
  - `product.metadata.stone` = `{ type: lab-grown-diamond, cut, color, clarity }` (для JSON-LD/фильтров Фазы 3);
  - `variant.metadata.uin` — демо-УИН ГИИС ДМДК + `stone_weight_ct`.
    > ⚠️ УИН присваивается конкретной **физической** инвентарной единице, а не SKU. Реальный пер-айтемный учёт + онлайн-проверка статуса в ТМ ГИИС ДМДК — комплаенс-слой **Фазы 5**. Здесь заложена представительная заглушка на уровне варианта.
- **Seed:** 13 демо-SKU по 5 категориям (`apps/backend/src/migration-scripts/initial-data-seed.ts`).

**DoD проверен локально end-to-end** (локальный Postgres 16 → `db:migrate` → Store API):
товары с вариантами и разными ценами отдаются Store API, регион RUB, «от {min}» считается корректно (8 из 13 товаров — с диапазоном цен), кастомные поля присутствуют в ответе API.

> Цены в seed заданы в рублях как целые (Medusa v2 хранит сумму как есть): напр. `19900` = 19 900 ₽.

---

## Фаза 0 — инициализация ✅

Сделано:
- Поднят монорепо: `apps/backend` (Medusa v2.15.5) + `apps/storefront` (Next.js 15.5.18, React 19).
- Storefront — официальный Next.js Starter (Tailwind **v3** + `@medusajs/ui-preset`), в него вшита
  брендовая дизайн-система:
  - палитра СИНОНИМ через `tailwind.config.js` (`brand`, `brand-dark`, `accent`, `accent-deep`, `sand`, `bg`, `surface`, `ink`);
  - шрифты `Playfair Display` (заголовки) + `Inter` (текст) через `next/font/google`, subsets `latin + cyrillic`, `display: swap`;
  - заголовки → Playfair + `brand-dark`, тело → Inter, фон `bg`, текст `ink` (`globals.css`).
- Логотип: заглушки 3 версий в `apps/storefront/public/logo/` (цветной / чёрный / белый, мотив «О» = огранка бриллианта) + компонент `Logo` (`@modules/common/components/logo`).
- Брендированный Hero на главной + страница-витрина бренда `/brand` (живой style guide, рендерится без backend).
- Env-шаблоны: `apps/backend/.env.template`, `apps/storefront/.env.template`.

> ⚠️ По решению владельца Tailwind оставлен на **v3** (не v4), чтобы сохранить готовые
> корзину/чекаут/карточки официального starter'а на `@medusajs/ui-preset`.

> Главная `/` storefront тянет регионы/товары из backend. Без поднятого backend
> с заполненной БД рендерится только брендовая витрина `/brand`.

---

## Как запустить локально

Требуется Node ≥ 20. Зависимости уже установлены (`npm install` в корне при необходимости).

### 1. Backend (Medusa)
```bash
cp apps/backend/.env.template apps/backend/.env   # затем впиши DATABASE_URL (Neon)
cd apps/backend
npx medusa db:migrate        # создаёт схему И автоматически прогоняет seed (13 SKU) один раз
npx medusa user -e admin@synonim.ru -p <пароль>   # админ-пользователь
# В конце вывода db:migrate печатается строка:
#   "Publishable key: pk_..."  — скопируй её в storefront (шаг 2).
npm run backend:dev          # из корня; admin → http://localhost:9000/app
```

> **Seed.** Файл `initial-data-seed.ts` лежит в `migration-scripts/`, поэтому
> Medusa выполняет его автоматически при первом `db:migrate` и помечает как
> выполненный (повторные `db:migrate` его не дублируют). Отдельный `npm run
> backend:seed` форс-запускает тот же скрипт — применять только к **пустой** БД,
> иначе будут дубли store/канала.

### 2. Storefront (Next.js)
```bash
cp apps/storefront/.env.template apps/storefront/.env.local
# впиши NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY (pk_... из вывода db:migrate / admin)
npm run storefront:dev     # http://localhost:8000  (витрина бренда: /brand)
```

Полезные скрипты из корня: `npm run dev` (всё через Turbo), `npm run backend:dev`, `npm run storefront:dev`, `npm run backend:seed`.

---

## TODO (за владельцем / следующие фазы)
- **Налоговая ставка** — подтвердить значение НДС (сейчас заглушка 0%, см. seed).
- Финальные SVG-логотипы (заменить заглушки в `public/logo/`), 200 SKU, фото изделий.
- **Фаза 2** — storefront: листинг с фильтрами (каратность/огранка/размер/цена/металл через URL), карточка товара с выбором варианта и пересчётом цены, корзина/чекаут UI.
- **Фаза 3** — SEO: JSON-LD (Product/Offer/Breadcrumb/Organization), канониклы фильтров, sitemap/robots.
- **Фаза 4** — эквайринг (ЮKassa/Т-Касса), payment provider module.
- **Фаза 5** — комплаенс: `FiscalizationService` + ГИИС ДМДК (пер-айтемный УИН), 54-ФЗ, 152-ФЗ, юр-страницы.
