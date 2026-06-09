/**
 * Типы слоя фискализации (54-ФЗ).
 * Онлайн-касса (АТОЛ Онлайн / Бизнес.Ру / Модулькасса / ЕКАМ — выбирает
 * владелец) подключается позже; здесь только контракт и статусы.
 * ГИИС ДМДК и проверка УИН в этот слой намеренно не входят.
 */

export const FISCALIZATION_MODULE = "fiscalization"

/** Статус фискализации заказа (хранится в order.metadata.fiscalization_status). */
export const FiscalizationStatus = {
  /** Касса не настроена/не вызвана — чек не пробит. Без имитации успеха. */
  PENDING: "pending_fiscalization",
  /** Продажа зарегистрирована в кассе, чек отправлен. */
  REGISTERED: "fiscalized",
  /** Ошибка фискализации — требует ручного разбора. */
  FAILED: "fiscalization_failed",
} as const

export type FiscalizationStatusValue =
  (typeof FiscalizationStatus)[keyof typeof FiscalizationStatus]

/** Опции модуля (из medusa-config → env). */
export type FiscalizationOptions = {
  /** Идентификатор провайдера облачной кассы (atol/business-ru/...). */
  provider?: string
  /** Ключ/логин доступа к API кассы. */
  apiKey?: string
  /** Система налогообложения, ставка НДС и т.п. — задаёт владелец. */
  taxSystem?: string
}

/** Результат операции фискализации. */
export type FiscalizationResult = {
  status: FiscalizationStatusValue
  provider: string | null
  receiptId?: string
  detail: string
}
