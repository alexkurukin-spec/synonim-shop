import { Logger } from "@medusajs/framework/types"
import { MedusaError } from "@medusajs/framework/utils"
import {
  FiscalizationOptions,
  FiscalizationResult,
  FiscalizationStatus,
} from "./types"

type InjectedDependencies = {
  logger: Logger
}

/**
 * Сервис фискализации продаж по 54-ФЗ.
 *
 * ВАЖНО (требование брифа): НЕ имитируем успешную фискализацию. Пока облачная
 * касса не подключена, продажа не регистрируется — заказ остаётся в статусе
 * `pending_fiscalization`, а в лог пишется TODO. Реальные вызовы API кассы —
 * после выбора провайдера владельцем (АТОЛ Онлайн / Бизнес.Ру / Модулькасса /
 * ЕКАМ). ГИИС ДМДК и проверка УИН в этот слой не входят.
 */
export default class FiscalizationService {
  protected readonly logger_: Logger
  protected readonly options_: FiscalizationOptions

  constructor(
    { logger }: InjectedDependencies,
    options: FiscalizationOptions = {}
  ) {
    this.logger_ = logger
    this.options_ = options ?? {}
  }

  /** Касса считается настроенной только при наличии провайдера и ключа. */
  isConfigured(): boolean {
    return Boolean(this.options_.provider && this.options_.apiKey)
  }

  /**
   * Регистрирует продажу в онлайн-кассе (54-ФЗ).
   * @returns статус фискализации; при отсутствии интеграции — pending_fiscalization.
   */
  async registerSale(order: {
    id: string
    display_id?: number | string
  }): Promise<FiscalizationResult> {
    const ref = order.display_id ?? order.id

    if (!this.isConfigured()) {
      this.logger_.warn(
        `54-ФЗ: онлайн-касса не настроена — заказ #${ref} оставлен в статусе ` +
          `'${FiscalizationStatus.PENDING}'. TODO: подключить провайдера кассы ` +
          `(FISCAL_PROVIDER/FISCAL_API_KEY) и реализовать registerSale.`
      )
      return {
        status: FiscalizationStatus.PENDING,
        provider: null,
        detail: "Провайдер фискализации не настроен — чек не пробит (TODO).",
      }
    }

    // TODO(owner): реальный вызов API облачной кассы для регистрации продажи.
    // Намеренно НЕ возвращаем успех, пока интеграции нет — иначе это имитация.
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      `54-ФЗ: провайдер '${this.options_.provider}' указан, но registerSale ещё ` +
        `не реализован. Подключите API кассы перед приёмом боевых платежей.`
    )
  }

  /**
   * Отправляет кассовый чек покупателю (54-ФЗ).
   * При отсутствии интеграции — pending, без имитации отправки.
   */
  async sendReceipt(order: {
    id: string
    display_id?: number | string
  }): Promise<FiscalizationResult> {
    const ref = order.display_id ?? order.id

    if (!this.isConfigured()) {
      this.logger_.warn(
        `54-ФЗ: чек по заказу #${ref} не отправлен — касса не настроена (TODO).`
      )
      return {
        status: FiscalizationStatus.PENDING,
        provider: null,
        detail: "Провайдер фискализации не настроен — чек не отправлен (TODO).",
      }
    }

    // TODO(owner): реальный вызов API кассы для отправки чека.
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      `54-ФЗ: sendReceipt для провайдера '${this.options_.provider}' не реализован.`
    )
  }
}
