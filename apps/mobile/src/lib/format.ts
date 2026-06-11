/** Форматирование цены в рублях: 19900 → «19 900 ₽». */
export function formatPrice(
  amount?: number | null,
  currency = "RUB"
): string {
  if (amount == null) {
    return ""
  }
  try {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `${amount} ₽`
  }
}
