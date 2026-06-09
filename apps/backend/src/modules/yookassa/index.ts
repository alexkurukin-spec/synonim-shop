import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import YooKassaProviderService from "./service"

/**
 * Регистрация payment-provider модуля ЮKassa.
 * Подключается в medusa-config.ts → modules → payment → providers.
 * Итоговый id провайдера: pp_yookassa_<id из конфига>.
 */
export default ModuleProvider(Modules.PAYMENT, {
  services: [YooKassaProviderService],
})
