import { useEffect, useMemo, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native"
import { Stack, useLocalSearchParams } from "expo-router"
import {
  Product,
  Variant,
  cheapestVariant,
  getProductByHandle,
} from "@/lib/medusa"
import { formatPrice } from "@/lib/format"
import { useCart } from "@/lib/cart"
import { useFavorites } from "@/lib/favorites"
import { colors, radius, spacing } from "@/lib/theme"

export default function ProductScreen() {
  const { handle } = useLocalSearchParams<{ handle: string }>()
  const { add } = useCart()
  const { isFavorite, toggle } = useFavorites()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Variant | null>(null)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const p = await getProductByHandle(String(handle))
        if (!active) return
        setProduct(p)
        setSelected(p ? cheapestVariant(p) ?? p.variants?.[0] ?? null : null)
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [handle])

  const price = useMemo(
    () => selected?.calculated_price?.calculated_amount,
    [selected]
  )
  const image = product?.thumbnail || product?.images?.[0]?.url

  const onAdd = async () => {
    if (!selected) return
    setAdding(true)
    try {
      await add(selected.id, 1)
      Alert.alert("Добавлено в корзину", product?.title)
    } catch (e) {
      Alert.alert("Ошибка", (e as Error).message)
    } finally {
      setAdding(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.brand} />
      </View>
    )
  }

  if (!product) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Товар не найден.</Text>
      </View>
    )
  }

  return (
    <>
      <Stack.Screen options={{ title: product.title }} />
      <ScrollView
        style={{ backgroundColor: colors.bg }}
        contentContainerStyle={styles.container}
      >
        <View style={styles.imageWrap}>
          {image ? (
            <Image source={{ uri: image }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={styles.placeholder}>
              <Text style={styles.placeholderText}>СИНОНИМ</Text>
            </View>
          )}
        </View>

        <View style={styles.titleRow}>
          <Text style={[styles.title, { flex: 1 }]}>{product.title}</Text>
          <Pressable
            onPress={() => toggle(product)}
            style={styles.heart}
            hitSlop={8}
          >
            <Text
              style={{
                fontSize: 24,
                color: isFavorite(product.handle)
                  ? colors.accentDeep
                  : colors.inkSubtle,
              }}
            >
              {isFavorite(product.handle) ? "♥" : "♡"}
            </Text>
          </Pressable>
        </View>
        {price != null && (
          <Text style={styles.price}>{formatPrice(price)}</Text>
        )}
        {product.description ? (
          <Text style={styles.desc}>{product.description}</Text>
        ) : null}

        {(product.variants?.length || 0) > 1 && (
          <View style={styles.variants}>
            <Text style={styles.variantsLabel}>Вариант</Text>
            <View style={styles.variantChips}>
              {product.variants!.map((v) => {
                const active = selected?.id === v.id
                return (
                  <Pressable
                    key={v.id}
                    onPress={() => setSelected(v)}
                    style={[styles.variantChip, active && styles.variantChipActive]}
                  >
                    <Text
                      style={[
                        styles.variantChipText,
                        active && styles.variantChipTextActive,
                      ]}
                    >
                      {v.title || "Вариант"}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          </View>
        )}

        <Pressable
          onPress={onAdd}
          disabled={adding || !selected}
          style={[styles.button, (adding || !selected) && styles.buttonDisabled]}
        >
          <Text style={styles.buttonText}>
            {adding ? "Добавляем…" : "В корзину"}
          </Text>
        </Pressable>
      </ScrollView>
    </>
  )
}

const styles = StyleSheet.create({
  container: { padding: spacing.md, paddingBottom: spacing.xl },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
  },
  muted: { color: colors.inkSubtle },
  imageWrap: {
    aspectRatio: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    marginBottom: spacing.md,
  },
  image: { width: "100%", height: "100%" },
  placeholder: { flex: 1, alignItems: "center", justifyContent: "center" },
  placeholderText: { color: colors.brand, letterSpacing: 2, fontWeight: "600" },
  titleRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  heart: { paddingTop: 2 },
  title: { color: colors.brandDark, fontSize: 24, fontWeight: "700" },
  price: { color: colors.ink, fontSize: 20, marginTop: spacing.sm },
  desc: { color: colors.inkSubtle, fontSize: 14, lineHeight: 20, marginTop: spacing.md },
  variants: { marginTop: spacing.lg },
  variantsLabel: { color: colors.inkSubtle, fontSize: 12, textTransform: "uppercase", marginBottom: spacing.sm },
  variantChips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  variantChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  variantChipActive: { borderColor: colors.brandDark, backgroundColor: colors.sand },
  variantChipText: { color: colors.ink, fontSize: 13 },
  variantChipTextActive: { color: colors.brandDark, fontWeight: "600" },
  button: {
    marginTop: spacing.xl,
    backgroundColor: colors.brandDark,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: colors.onDark, fontSize: 16, fontWeight: "600" },
})
