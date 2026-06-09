import {
  AbstractPaymentProvider,
  BigNumber,
  MedusaError,
} from "@medusajs/framework/utils"
import {
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  CancelPaymentInput,
  CancelPaymentOutput,
  CapturePaymentInput,
  CapturePaymentOutput,
  DeletePaymentInput,
  DeletePaymentOutput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  InitiatePaymentInput,
  InitiatePaymentOutput,
  Logger,
  PaymentActions,
  PaymentSessionStatus,
  ProviderWebhookPayload,
  RefundPaymentInput,
  RefundPaymentOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
  WebhookActionResult,
} from "@medusajs/framework/types"
import { YooKassaClient } from "./client"
import {
  YooKassaAmount,
  YooKassaOptions,
  YooKassaPayment,
  YooKassaPaymentStatus,
  YooKassaWebhookEvent,
} from "./types"

type InjectedDependencies = {
  logger: Logger
}

/**
 * Payment provider module для ЮKassa (российский эквайринг), Medusa v2.
 * Реализует интерфейс AbstractPaymentProvider: initiate / authorize / capture /
 * refund / cancel / webhook. Боевые ключи — через env (см. .env.template).
 */
class YooKassaProviderService extends AbstractPaymentProvider<YooKassaOptions> {
  static identifier = "yookassa"

  protected readonly options_: YooKassaOptions
  protected readonly logger_: Logger
  protected readonly client_: YooKassaClient

  constructor(container: InjectedDependencies, options: YooKassaOptions) {
    super(container, options)
    this.options_ = options
    this.logger_ = container.logger
    this.client_ = new YooKassaClient(options, container.logger)

    if (!this.client_.isConfigured()) {
      this.logger_.warn(
        "YooKassa: ключи не заданы (YOOKASSA_SHOP_ID / YOOKASSA_SECRET_KEY). " +
          "Провайдер зарегистрирован, но платежи будут отклоняться до настройки."
      )
    }
  }

  static validateOptions(options: Record<string, unknown>): void {
    // Не падаем при отсутствии ключей — провайдер просто неактивен (боевые
    // ключи добавляет владелец). Жёсткая проверка значений — на стороне клиента.
    if (options.capture !== undefined && typeof options.capture !== "boolean") {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "YooKassa: опция 'capture' должна быть boolean."
      )
    }
  }

  /** Medusa-сумма (рубли, мажорные единицы) → объект amount ЮKassa. */
  private toAmount(amount: unknown, currencyCode: string): YooKassaAmount {
    return {
      value: Number(amount).toFixed(2),
      currency: currencyCode.toUpperCase(),
    }
  }

  private statusToSession(
    status: YooKassaPaymentStatus
  ): PaymentSessionStatus {
    switch (status) {
      case "waiting_for_capture":
        return "authorized"
      case "succeeded":
        return "captured"
      case "canceled":
        return "canceled"
      case "pending":
      default:
        return "pending"
    }
  }

  private statusToAction(status: YooKassaPaymentStatus): PaymentActions {
    switch (status) {
      case "waiting_for_capture":
        return "authorized"
      case "succeeded":
        return "captured"
      case "canceled":
        return "canceled"
      case "pending":
      default:
        return "pending"
    }
  }

  async initiatePayment(
    input: InitiatePaymentInput
  ): Promise<InitiatePaymentOutput> {
    const sessionId = input.data?.session_id as string | undefined

    const payment = await this.client_.createPayment(
      {
        amount: this.toAmount(input.amount, input.currency_code),
        capture: this.options_.capture ?? false,
        description: sessionId
          ? `Заказ СИНОНИМ · ${sessionId}`
          : "Заказ СИНОНИМ",
        returnUrl: this.options_.returnUrl,
        metadata: {
          ...((input.data?.metadata as Record<string, unknown>) ?? {}),
          session_id: sessionId,
        },
      },
      input.context?.idempotency_key
    )

    return {
      id: payment.id,
      data: payment as unknown as Record<string, unknown>,
      status: this.statusToSession(payment.status),
    }
  }

  async getPaymentStatus(
    input: GetPaymentStatusInput
  ): Promise<GetPaymentStatusOutput> {
    const id = input.data?.id as string
    if (!id) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "YooKassa: отсутствует id платежа."
      )
    }
    const payment = await this.client_.getPayment(id)
    return {
      status: this.statusToSession(payment.status),
      data: payment as unknown as Record<string, unknown>,
    }
  }

  async authorizePayment(
    input: AuthorizePaymentInput
  ): Promise<AuthorizePaymentOutput> {
    const { status, data } = await this.getPaymentStatus(input)
    return { status, data }
  }

  async capturePayment(
    input: CapturePaymentInput
  ): Promise<CapturePaymentOutput> {
    const id = input.data?.id as string
    if (!id) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "YooKassa: отсутствует id платежа для списания."
      )
    }
    const payment = await this.client_.capturePayment(
      id,
      undefined,
      input.context?.idempotency_key
    )
    return { data: payment as unknown as Record<string, unknown> }
  }

  async refundPayment(
    input: RefundPaymentInput
  ): Promise<RefundPaymentOutput> {
    const payment = input.data as unknown as YooKassaPayment
    const id = payment?.id
    if (!id) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "YooKassa: отсутствует id платежа для возврата."
      )
    }
    await this.client_.refundPayment(
      {
        paymentId: id,
        amount: this.toAmount(
          input.amount,
          payment.amount?.currency ?? "RUB"
        ),
      },
      input.context?.idempotency_key
    )
    return { data: input.data }
  }

  async cancelPayment(
    input: CancelPaymentInput
  ): Promise<CancelPaymentOutput> {
    const id = input.data?.id as string | undefined
    if (!id) {
      return { data: input.data }
    }
    try {
      const payment = await this.client_.cancelPayment(
        id,
        input.context?.idempotency_key
      )
      return { data: payment as unknown as Record<string, unknown> }
    } catch (e) {
      // Платёж уже списан/отменён — отдаём текущие данные.
      this.logger_.warn(`YooKassa cancel ${id}: ${(e as Error).message}`)
      return { data: input.data }
    }
  }

  async deletePayment(
    input: DeletePaymentInput
  ): Promise<DeletePaymentOutput> {
    // У ЮKassa нет удаления сессии — отменяем неподтверждённый платёж.
    return this.cancelPayment(input)
  }

  async retrievePayment(
    input: RetrievePaymentInput
  ): Promise<RetrievePaymentOutput> {
    const id = input.data?.id as string
    if (!id) {
      return { data: input.data }
    }
    const payment = await this.client_.getPayment(id)
    return { data: payment as unknown as Record<string, unknown> }
  }

  async updatePayment(
    input: UpdatePaymentInput
  ): Promise<UpdatePaymentOutput> {
    // ЮKassa не позволяет менять сумму созданного платежа. Medusa при смене
    // суммы пересоздаёт сессию (delete + initiate), поэтому возвращаем как есть.
    return { data: input.data }
  }

  async getWebhookActionAndData(
    payload: ProviderWebhookPayload["payload"]
  ): Promise<WebhookActionResult> {
    const event = payload.data as unknown as YooKassaWebhookEvent
    let object = event?.object

    if (!object?.id) {
      return { action: "not_supported" }
    }

    // ЮKassa не подписывает webhook — перепроверяем платёж по API (защита от
    // подделки). Если ключи не заданы — доверяем телу уведомления.
    if (this.client_.isConfigured()) {
      try {
        object = await this.client_.getPayment(object.id)
      } catch (e) {
        this.logger_.warn(
          `YooKassa webhook verify ${object.id}: ${(e as Error).message}`
        )
      }
    }

    const sessionId = (object.metadata?.session_id as string) ?? ""
    const amount = new BigNumber(Number(object.amount?.value ?? 0))
    const action = this.statusToAction(object.status)

    if (action === "pending") {
      return { action: "not_supported" }
    }

    return {
      action,
      data: { session_id: sessionId, amount },
    }
  }
}

export default YooKassaProviderService
