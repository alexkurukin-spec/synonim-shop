import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native"
import { useRouter } from "expo-router"
import { useCart } from "@/lib/cart"
import { formatPrice } from "@/lib/format"
import { colors, radius, spacing } from "@/lib/theme"

export default function CartScreen() {
  const { cart, loading, setQty, remove } = useCart()
  const router = useRouter()

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.brand} />
      </View>
    )
  }

  const items = cart?.items || []

  if (items.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>В корзине пока пусто</Text>
        <Pressable
          style={styles.linkBtn}
          onPress={() => router.push("/catalog")}
        >
          <Text style={styles.linkBtnText}>Смотреть каталог</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.row}>
            {item.thumbnail ? (
              <Image source={{ uri: item.thumbnail }} style={styles.thumb} />
            ) : (
              <View style={[styles.thumb, styles.thumbPlaceholder]} />
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitle} numberOfLines={2}>
                {item.product_title || item.title}
              </Text>
              <Text style={styles.itemSub}>{item.title}</Text>
              <Text style={styles.itemPrice}>
                {formatPrice(item.unit_price)}
              </Text>
              <View style={styles.qtyRow}>
                <Pressable
                  style={styles.qtyBtn}
                  onPress={() => setQty(item.id, item.quantity - 1)}
                >
                  <Text style={styles.qtyBtnText}>−</Text>
                </Pressable>
                <Text style={styles.qtyValue}>{item.quantity}</Text>
                <Pressable
                  style={styles.qtyBtn}
                  onPress={() => setQty(item.id, item.quantity + 1)}
                >
                  <Text style={styles.qtyBtnText}>+</Text>
                </Pressable>
                <Pressable
                  style={styles.removeBtn}
                  onPress={() => remove(item.id)}
                >
                  <Text style={styles.removeText}>Удалить</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Итого</Text>
          <Text style={styles.totalValue}>
            {formatPrice(cart?.total ?? cart?.subtotal)}
          </Text>
        </View>
        <Pressable
          style={styles.checkout}
          onPress={() => router.push("/checkout")}
        >
          <Text style={styles.checkoutText}>Оформить заказ</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
    padding: spacing.lg,
  },
  emptyTitle: { color: colors.brandDark, fontSize: 20, marginBottom: spacing.md },
  linkBtn: {
    backgroundColor: colors.brandDark,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  linkBtnText: { color: colors.onDark, fontWeight: "600" },
  list: { padding: spacing.md, gap: spacing.md },
  row: {
    flexDirection: "row",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
  },
  thumb: { width: 72, height: 88, borderRadius: radius.sm, backgroundColor: colors.bg },
  thumbPlaceholder: { borderWidth: 1, borderColor: colors.border },
  itemTitle: { color: colors.ink, fontSize: 14, fontWeight: "600" },
  itemSub: { color: colors.inkSubtle, fontSize: 12, marginTop: 2 },
  itemPrice: { color: colors.ink, fontSize: 14, marginTop: 4 },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.sm },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyBtnText: { fontSize: 18, color: colors.brandDark },
  qtyValue: { minWidth: 24, textAlign: "center", color: colors.ink },
  removeBtn: { marginLeft: "auto" },
  removeText: { color: colors.accentDeep, fontSize: 13 },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
    gap: spacing.sm,
  },
  totalRow: { flexDirection: "row", justifyContent: "space-between" },
  totalLabel: { color: colors.inkSubtle, fontSize: 16 },
  totalValue: { color: colors.ink, fontSize: 18, fontWeight: "700" },
  checkout: {
    backgroundColor: colors.brandDark,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  checkoutText: { color: colors.onDark, fontSize: 16, fontWeight: "600" },
})
