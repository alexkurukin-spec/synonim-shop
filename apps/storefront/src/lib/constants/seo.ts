import { getBaseURL } from "@lib/util/env"

/**
 * Централизованные SEO/бренд-константы (Фаза 3).
 * Контакты, телефон и соцсети владелец заполнит позже — отмечено TODO,
 * чтобы не публиковать в structured data выдуманные данные.
 */
export const SITE_NAME = "СИНОНИМ"

export const SITE_TAGLINE = "Серебро с выращенными бриллиантами"

export const SITE_DESCRIPTION =
  "СИНОНИМ — украшения из серебра 925 с выращенными бриллиантами и сертификатами. " +
  "Кольца, серьги, подвески и браслеты с проверкой УИН. Доставка по России."

export const SITE_LOCALE = "ru_RU"

export const SITE_HREFLANG = "ru-RU"

/** Канонический origin сайта (в проде задаётся через NEXT_PUBLIC_BASE_URL). */
export const getSiteUrl = () => getBaseURL().replace(/\/$/, "")

/** Логотип для Organization JSON-LD. */
export const SITE_LOGO_PATH = "/opengraph-image.jpg"

// TODO(owner): заполнить реальные данные для contactPoint/sameAs в Organization.
export const SITE_SAME_AS: string[] = []
export const SITE_TELEPHONE: string | null = null
