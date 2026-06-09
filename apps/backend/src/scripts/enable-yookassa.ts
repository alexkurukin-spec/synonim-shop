import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { updateRegionsWorkflow } from "@medusajs/medusa/core-flows"

/**
 * Одноразовый скрипт: включает провайдер pp_yookassa_yookassa для региона
 * Россия в уже засеяненной БД (seed для свежих БД уже обновлён).
 * Запуск: npx medusa exec ./src/scripts/enable-yookassa.ts
 */
export default async function enableYooKassa({ container }: ExecArgs) {
  const logger = container.resolve("logger")
  const regionService = container.resolve(Modules.REGION)

  const regions = await regionService.listRegions({ name: "Россия" })
  if (!regions.length) {
    logger.error("Регион «Россия» не найден.")
    return
  }
  const region = regions[0]

  await updateRegionsWorkflow(container).run({
    input: {
      selector: { id: region.id },
      update: {
        payment_providers: ["pp_system_default", "pp_yookassa_yookassa"],
      },
    },
  })

  logger.info(
    `ЮKassa включена для региона ${region.name} (${region.id}).`
  )
}
