import { useCallback, useEffect, useState } from "react"
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native"
import { Order, listOrders } from "@/lib/medusa"
import { formatPrice } from "@/lib/format"
import { useAuth } from "@/lib/auth"
import { colors, radius, spacing } from "@/lib/theme"

const STATUS_RU: Record<string, string> = {
  pending: "В обработке",
  completed: "Выполнен",
  canceled: "Отменён",
  archived: "В архиве",
  captured: "Оплачен",
  authorized: "Оплата авторизована",
  not_paid: "Не оплачен",
  fulfilled: "Отправлен",
  shipped: "Отправлен",
  delivered: "Доставлен",
  not_fulfilled: "Не отправлен",
}
const ru = (s?: string) => (s ? STATUS_RU[s] || s : "")

function formatDate(iso?: string) {
  if (!iso) return ""
  try {
    return new Date(iso).toLocaleDateString("ru-RU")
  } catch {
    return ""
  }
}

export default function OrdersScreen() {
  const { customer } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const list = await listOrders()
      setOrders(list)
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    }
  }, [])

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [load])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }, [load])

  if (!customer) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Войдите, чтобы видеть заказы.</Text>
      </View>
    )
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.brand} />
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>{error}</Text>
      </View>
    )
  }

  return (
    <FlatList
      data={orders}
      keyExtractor={(o) => o.id}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.brand}
        />
      }
      ListEmptyComponent={<Text style={styles.muted}>Заказов пока нет.</Text>}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.orderNo}>Заказ №{item.display_id ?? "—"}</Text>
            <Text style={styles.date}>{formatDate(item.created_at)}</Text>
          </View>
          <Text style={styles.total}>
            {formatPrice(item.total, item.currency_code?.toUpperCase())}
          </Text>
          <View style={styles.badges}>
            {item.payment_status && (
              <Text style={styles.badge}>{ru(item.payment_status)}</Text>
            )}
            {item.fulfillment_status && (
              <Text style={styles.badge}>{ru(item.fulfillment_status)}</Text>
            )}
          </View>
          {(item.items?.length || 0) > 0 && (
            <Text style={styles.items} numberOfLines={2}>
              {item.items!
                .map((i) => `${i.product_title || i.title} ×${i.quantity}`)
                .join(", ")}
            </Text>
          )}
        </View>
      )}
    />
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg, padding: spacing.lg },
  muted: { color: colors.inkSubtle, textAlign: "center" },
  list: { padding: spacing.md, gap: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  orderNo: { color: colors.brandDark, fontWeight: "700", fontSize: 15 },
  date: { color: colors.inkSubtle, fontSize: 13 },
  total: { color: colors.ink, fontSize: 16, marginTop: spacing.xs },
  badges: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm, flexWrap: "wrap" },
  badge: {
    backgroundColor: colors.sand,
    color: colors.brandDark,
    fontSize: 12,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: "hidden",
  },
  items: { color: colors.inkSubtle, fontSize: 13, marginTop: spacing.sm },
})
