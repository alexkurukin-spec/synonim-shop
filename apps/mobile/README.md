# СИНОНИМ — мобильное приложение (Expo / React Native)

Кросс-платформенное приложение (iOS + Android) поверх того же Medusa-бэкенда,
что и витрина. Это **MVP-каркас**: Главная → Каталог → Товар → Корзина.

> Приложение **автономно** от монорепо (своё `node_modules`) — команды
> запускаются из папки `apps/mobile`.

## Что готово
- Подключение к Store API (тот же backend и publishable-ключ, что у витрины).
- Главная: hero, категории, новинки.
- Каталог: список товаров, фильтр по категории.
- Карточка товара: фото, описание, выбор варианта, цена, «в корзину».
- Корзина: позиции, количество, удаление, сумма; сохраняется между запусками.
- **Нативный чекаут (этап 3):** адрес → доставка → оплата → заказ.
  Для ЮKassa открывает оплату во встроенном браузере (WebBrowser), затем
  завершает заказ; для системного/тестового провайдера — сразу.
- **Личный кабинет (этап 4):** вход/регистрация (Medusa Auth), профиль,
  список заказов, избранное (локальное, ♡ на карточке товара).
- **Бренд-ассеты (этап 5):** иконка / adaptive-icon / сплэш из мотива «О»
  (заглушки в духе брендбука — финальные файлы заменит владелец в
  `assets/`, имена не менять). Pull-to-refresh на списках.
- **Конфиг сборки (этап 6):** `eas.json` с профилями
  development / preview (APK) / production.
- Бренд-тема, русский язык, рубли.

## Что осталось
- Push-уведомления: нужны EAS projectId (аккаунт Expo владельца),
  `expo-notifications` и серверная отправка — после `eas init`.
- Публикация в сторы: аккаунты владельца (Apple $99/год, Google $25),
  скриншоты и тексты для витрин магазинов.

> Чекаут использует те же эндпоинты Medusa v2 Store API, что и витрина
> (адрес, shipping-options, payment-collections, complete). Реальная оплата
> ЮKassa требует боевых/тестовых ключей в backend.

---

## Запуск (на своём компьютере)

Требуется **Node ≥ 20**. Телефон с приложением **Expo Go** (App Store / Google Play)
или эмулятор (Android Studio / Xcode).

```bash
cd apps/mobile
cp .env.example .env        # заполни значения (см. ниже)
npm install
npx expo start              # откроется QR-код
```

- **Телефон:** установи **Expo Go**, отсканируй QR (телефон и комп — в одной Wi-Fi).
- **Android-эмулятор:** нажми `a` в терминале. **iOS-симулятор (на Mac):** `i`.

Если Expo ругается на версии пакетов:
```bash
npx expo install --fix
```

### Переменные окружения (`apps/mobile/.env`)
```
EXPO_PUBLIC_MEDUSA_BACKEND_URL=...   # ПУБЛИЧНЫЙ адрес backend (не localhost!)
EXPO_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_...   # тот же ключ, что у витрины
EXPO_PUBLIC_DEFAULT_REGION=ru
EXPO_PUBLIC_STOREFRONT_URL=...       # (опц.) URL витрины для чекаута
```

> ⚠️ Телефон не видит `localhost` компьютера. Для теста на эмуляторе Android
> используй `http://10.0.2.2:9000`, на реальном телефоне — `http://<IP-компа>:9000`
> (backend должен слушать сеть), а в проде — адрес задеплоенного backend.
> Также добавь адрес приложения в `STORE_CORS` backend при необходимости.

---

## Сборка и публикация (EAS)

Профили сборки уже описаны в `eas.json`. Сборка идёт в облаке Expo —
**Mac не нужен** даже для iOS.

```bash
npm i -g eas-cli
eas login                    # аккаунт Expo (бесплатный)
cd apps/mobile
eas init                     # привяжет projectId к app.json (один раз)

# Переменные окружения для сборки (EXPO_PUBLIC_* должны быть заданы):
eas env:create --name EXPO_PUBLIC_MEDUSA_BACKEND_URL --value https://<backend>
eas env:create --name EXPO_PUBLIC_MEDUSA_PUBLISHABLE_KEY --value pk_...
eas env:create --name EXPO_PUBLIC_DEFAULT_REGION --value ru

eas build -p android --profile preview   # APK для теста (ссылка на скачивание)
eas build -p ios --profile preview       # нужен Apple Developer аккаунт
eas submit -p android                    # отправка в Google Play
eas submit -p ios                        # отправка в App Store
```

Аккаунты разработчика — на владельце: Apple Developer ($99/год),
Google Play ($25 разово). `bundleIdentifier`/`package` уже заданы:
`ru.synonim.app` (поменяйте при необходимости до первой публикации).

## Структура
```
app/                      # экраны (expo-router, file-based)
  _layout.tsx             # корневой Stack + провайдер корзины
  (tabs)/                 # вкладки: Главная / Каталог / Корзина
  product/[handle].tsx    # карточка товара
src/
  lib/medusa.ts           # клиент Store API (fetch)
  lib/cart.tsx            # состояние корзины (AsyncStorage)
  lib/theme.ts            # бренд-цвета
  lib/format.ts           # цена «19 900 ₽»
  components/ProductCard.tsx
```
