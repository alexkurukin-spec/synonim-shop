import { ExecArgs } from "@medusajs/framework/types"
import { FISCALIZATION_MODULE } from "../modules/fiscalization/types"
import type FiscalizationService from "../modules/fiscalization/service"

/**
 * Проверка слоя фискализации (54-ФЗ): модуль резолвится, без ключей касса
 * не имитирует успех, а возвращает pending_fiscalization.
 * Запуск: npx medusa exec ./src/scripts/verify-fiscalization.ts
 */
export default async function verify({ container }: ExecArgs) {
  const logger = container.resolve("logger")
  const fiscalization = container.resolve(
    FISCALIZATION_MODULE
  ) as FiscalizationService

  const order = { id: "order_TEST", display_id: 1001 }

  const sale = await fiscalization.registerSale(order)
  const receipt = await fiscalization.sendReceipt(order)

  const ok =
    fiscalization.isConfigured() === false &&
    sale.status === "pending_fiscalization" &&
    receipt.status === "pending_fiscalization"

  logger.info(
    `${ok ? "✅" : "❌"} fiscalization: configured=${fiscalization.isConfigured()} ` +
      `registerSale=${sale.status} sendReceipt=${receipt.status}`
  )
  logger.info(`detail: ${sale.detail}`)
}
