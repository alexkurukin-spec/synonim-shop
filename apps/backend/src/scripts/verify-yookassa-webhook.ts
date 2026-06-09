import { ExecArgs } from "@medusajs/framework/types"
import YooKassaProviderService from "../modules/yookassa/service"

/**
 * Проверка маппинга webhook-уведомлений ЮKassa → действия Medusa
 * (без сети, провайдер не сконфигурирован → доверяем телу уведомления).
 * Запуск: npx medusa exec ./src/scripts/verify-yookassa-webhook.ts
 */
export default async function verify({ container }: ExecArgs) {
  const logger = container.resolve("logger")
  // Провайдер без ключей: webhook-парсинг работает на теле уведомления.
  const provider = new (YooKassaProviderService as any)(
    { logger },
    {}
  ) as YooKassaProviderService

  const mkEvent = (event: string, status: string) => ({
    data: {
      type: "notification",
      event,
      object: {
        id: "2d8e1f00-000f-5000-9000-1aaaaaaaaaaa",
        status,
        paid: status === "succeeded",
        amount: { value: "19900.00", currency: "RUB" },
        metadata: { session_id: "payses_01TEST" },
      },
    },
    rawData: "",
    headers: {},
  })

  const cases: Array<[string, string, string]> = [
    ["payment.waiting_for_capture", "waiting_for_capture", "authorized"],
    ["payment.succeeded", "succeeded", "captured"],
    ["payment.canceled", "canceled", "canceled"],
  ]

  let ok = 0
  for (const [event, status, expected] of cases) {
    const res = await provider.getWebhookActionAndData(
      mkEvent(event, status) as any
    )
    const pass = res.action === expected
    const sid = (res.data as any)?.session_id
    const amt = (res.data as any)?.amount?.valueOf?.() ?? (res.data as any)?.amount
    logger.info(
      `${pass ? "✅" : "❌"} ${event} → action=${res.action} ` +
        `(ожидалось ${expected}); session_id=${sid}; amount=${amt}`
    )
    if (pass && sid === "payses_01TEST") ok++
  }

  logger.info(`Итог: ${ok}/${cases.length} кейсов корректны.`)
}
