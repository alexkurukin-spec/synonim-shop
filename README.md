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

## Статус: Фаза 0 — инициализация ✅ (частично, см. ниже)

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

### Ожидает строку подключения (шаг миграций)
Без внешнего Postgres (Neon) нельзя завершить часть DoD Фазы 0 («backend поднимается, admin доступен»):
- прогнать миграции Medusa,
- создать админ-пользователя,
- сгенерировать publishable key и прописать его в storefront,
- запустить backend + storefront end-to-end.

Главная `/` storefront тянет регионы/коллекции из backend, поэтому до подключения БД
рендерится только брендовая витрина `/brand`. Дай строку Neon — завершу остаток Фазы 0.

---

## Как запустить локально

Требуется Node ≥ 20. Зависимости уже установлены (`npm install` в корне при необходимости).

### 1. Backend (Medusa)
```bash
cp apps/backend/.env.template apps/backend/.env   # затем впиши DATABASE_URL (Neon)
# миграции + админ (Фаза 1):
cd apps/backend && npx medusa db:migrate && npx medusa user -e admin@synonim.ru -p <пароль>
npm run backend:dev        # из корня; admin → http://localhost:9000/app
```

### 2. Storefront (Next.js)
```bash
cp apps/storefront/.env.template apps/storefront/.env.local
# впиши NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY (из admin/seed)
npm run storefront:dev     # http://localhost:8000  (витрина бренда: /brand)
```

Полезные скрипты из корня: `npm run dev` (всё через Turbo), `npm run backend:dev`, `npm run storefront:dev`.

---

## TODO (за владельцем / следующие фазы)
- **Строка подключения Neon Postgres** — для завершения Фазы 0 и старта Фазы 1.
- Регион RUB, локаль `ru-RU`, модель вариантов (размер / каратность / металл), кастомные поля `uin`/`stone`/`metal`, seed-скрипт — **Фаза 1**.
- Финальные SVG-логотипы (заменить заглушки в `public/logo/`), 200 SKU, фото.
- Эквайринг (ЮKassa/Т-Касса), облачная касса + ГИИС ДМДК, налоговая ставка — Фазы 4–5.
