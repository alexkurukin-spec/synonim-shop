import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import FiscalizationService from "../modules/fiscalization/service"
import { FISCALIZATION_MODULE } from "../modules/fiscalization/types"

/**
 * 54-ФЗ: при оформлении заказа регистрируем продажу в онлайн-кассе.
 * Пока касса не настроена — заказ остаётся в `pending_fiscalization`
 * (без имитации успеха), статус пишется в order.metadata.
 */
export default async function orderFiscalizationHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")
  const orderService = container.resolve(Modules.ORDER)
  const fiscalization = container.resolve(
    FISCALIZATION_MODULE
  ) as FiscalizationService

  const order = await orderService.retrieveOrder(data.id, {
    select: ["id", "display_id", "metadata"],
  })

  try {
    const result = await fiscalization.registerSale({
      id: order.id,
      display_id: order.display_id,
    })

    await orderService.updateOrders(order.id, {
      metadata: {
        ...(order.metadata ?? {}),
        fiscalization_status: result.status,
        fiscalization_provider: result.provider,
        fiscalization_detail: result.detail,
      },
    })
  } catch (e) {
    // Провайдер указан, но не реализован (NOT_IMPLEMENTED) — не валим заказ,
    // помечаем как failed для ручного разбора и логируем.
    logger.error(
      `54-ФЗ: фискализация заказа ${order.id} не выполнена: ${
        (e as Error).message
      }`
    )
    await orderService.updateOrders(order.id, {
      metadata: {
        ...(order.metadata ?? {}),
        fiscalization_status: "fiscalization_failed",
        fiscalization_detail: (e as Error).message,
      },
    })
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
