/**
 * Опции провайдера YooKassa (ЮKassa), задаются в medusa-config.ts.
 * Боевые ключи берутся из env (см. .env.template). Тестовые — из личного
 * кабинета ЮKassa (магазин в режиме «Тест»).
 */
export type YooKassaOptions = {
  /** shopId магазина ЮKassa. */
  shopId?: string
  /** Секретный ключ (Basic-auth пароль). */
  secretKey?: string
  /**
   * Одностадийная оплата: true — списание сразу (capture при создании),
   * false — двухстадийная (authorize → capture). По умолчанию false.
   */
  capture?: boolean
  /** URL, куда ЮKassa вернёт покупателя после оплаты. */
  returnUrl?: string
  /** Базовый URL API (для тестов/моков). По умолчанию https://api.yookassa.ru/v3. */
  apiUrl?: string
}

/** Денежная сумма в формате ЮKassa. */
export type YooKassaAmount = {
  value: string
  currency: string
}

/** Статусы платежа ЮKassa. */
export type YooKassaPaymentStatus =
  | "pending"
  | "waiting_for_capture"
  | "succeeded"
  | "canceled"

/** Объект платежа ЮKassa (сокращённо — нужные поля). */
export type YooKassaPayment = {
  id: string
  status: YooKassaPaymentStatus
  paid: boolean
  amount: YooKassaAmount
  confirmation?: {
    type: string
    confirmation_url?: string
    return_url?: string
  }
  metadata?: Record<string, unknown>
  description?: string
  [key: string]: unknown
}

/** Тело webhook-уведомления ЮKassa. */
export type YooKassaWebhookEvent = {
  type: "notification"
  event:
    | "payment.succeeded"
    | "payment.waiting_for_capture"
    | "payment.canceled"
    | "refund.succeeded"
  object: YooKassaPayment
}
