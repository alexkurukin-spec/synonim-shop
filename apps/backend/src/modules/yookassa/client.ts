import { MedusaError } from "@medusajs/framework/utils"
import { Logger } from "@medusajs/framework/types"
import {
  YooKassaAmount,
  YooKassaOptions,
  YooKassaPayment,
} from "./types"

const DEFAULT_API_URL = "https://api.yookassa.ru/v3"

/**
 * Тонкий клиент REST API ЮKassa (https://yookassa.ru/developers/api).
 * Авторизация — Basic (shopId:secretKey). Идемпотентность — заголовок
 * Idempotence-Key на всех POST-запросах.
 */
export class YooKassaClient {
  private readonly apiUrl: string
  private readonly authHeader: string
  private readonly logger?: Logger
  private readonly configured: boolean

  constructor(options: YooKassaOptions, logger?: Logger) {
    this.apiUrl = (options.apiUrl || DEFAULT_API_URL).replace(/\/$/, "")
    this.logger = logger
    this.configured = Boolean(options.shopId && options.secretKey)

    this.authHeader = this.configured
      ? "Basic " +
        Buffer.from(`${options.shopId}:${options.secretKey}`).toString("base64")
      : ""
  }

  isConfigured() {
    return this.configured
  }

  private assertConfigured() {
    if (!this.configured) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Платёжный провайдер YooKassa не настроен: задайте YOOKASSA_SHOP_ID и YOOKASSA_SECRET_KEY."
      )
    }
  }

  private async request<T>(
    method: "GET" | "POST",
    path: string,
    body?: Record<string, unknown>,
    idempotenceKey?: string
  ): Promise<T> {
    this.assertConfigured()

    const headers: Record<string, string> = {
      Authorization: this.authHeader,
      "Content-Type": "application/json",
    }
    if (method === "POST") {
      headers["Idempotence-Key"] = idempotenceKey || crypto.randomUUID()
    }

    const res = await fetch(`${this.apiUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })

    const text = await res.text()
    const json = text ? JSON.parse(text) : {}

    if (!res.ok) {
      this.logger?.error(
        `YooKassa API ${method} ${path} → ${res.status}: ${text}`
      )
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Ошибка YooKassa (${res.status}): ${
          json?.description || json?.code || "unknown"
        }`
      )
    }

    return json as T
  }

  /** Создать платёж. capture=false → двухстадийная схема. */
  createPayment(
    params: {
      amount: YooKassaAmount
      capture: boolean
      description?: string
      returnUrl?: string
      metadata?: Record<string, unknown>
    },
    idempotenceKey?: string
  ): Promise<YooKassaPayment> {
    const body: Record<string, unknown> = {
      amount: params.amount,
      capture: params.capture,
      description: params.description,
      metadata: params.metadata,
    }
    if (params.returnUrl) {
      body.confirmation = { type: "redirect", return_url: params.returnUrl }
    }
    return this.request<YooKassaPayment>("POST", "/payments", body, idempotenceKey)
  }

  getPayment(id: string): Promise<YooKassaPayment> {
    return this.request<YooKassaPayment>("GET", `/payments/${id}`)
  }

  capturePayment(
    id: string,
    amount?: YooKassaAmount,
    idempotenceKey?: string
  ): Promise<YooKassaPayment> {
    return this.request<YooKassaPayment>(
      "POST",
      `/payments/${id}/capture`,
      amount ? { amount } : {},
      idempotenceKey
    )
  }

  cancelPayment(id: string, idempotenceKey?: string): Promise<YooKassaPayment> {
    return this.request<YooKassaPayment>(
      "POST",
      `/payments/${id}/cancel`,
      {},
      idempotenceKey
    )
  }

  refundPayment(
    params: { paymentId: string; amount: YooKassaAmount },
    idempotenceKey?: string
  ): Promise<{ id: string; status: string }> {
    return this.request("POST", "/refunds", {
      payment_id: params.paymentId,
      amount: params.amount,
    }, idempotenceKey)
  }
}
