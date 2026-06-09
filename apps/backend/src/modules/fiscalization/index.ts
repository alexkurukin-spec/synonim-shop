import { Module } from "@medusajs/framework/utils"
import FiscalizationService from "./service"
import { FISCALIZATION_MODULE } from "./types"

export { FISCALIZATION_MODULE, FiscalizationStatus } from "./types"
export type { FiscalizationResult } from "./types"
export { default as FiscalizationService } from "./service"

/**
 * Модуль фискализации (54-ФЗ). Регистрируется в medusa-config.ts → modules.
 * Резолв в подписчиках/воркфлоу: container.resolve(FISCALIZATION_MODULE).
 */
export default Module(FISCALIZATION_MODULE, {
  service: FiscalizationService,
})
