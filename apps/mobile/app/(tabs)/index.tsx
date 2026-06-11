import { useEffect, useState } from "react"
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native"
import { useRouter } from "expo-router"
import ProductCard from "@/components/ProductCard"
import { Category, Product, listCategories, listProducts } from "@/lib/medusa"
import { colors, spacing } from "@/lib/theme"

export default function HomeScreen() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const [{ products }, cats] = await Promise.all([
          listProducts({ limit: 6 }),
          listCategories(),
        ])
        if (!active) return
        setProducts(products)
        setCategories(cats)
      } catch (e) {
        if (active) setError((e as Error).message)
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

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
        <Text style={styles.error}>{error}</Text>
        <Text style={styles.hint}>
          Проверьте EXPO_PUBLIC_MEDUSA_BACKEND_URL и ключ в .env.
        </Text>
      </View>
    )
  }

  return (
    <FlatList
      data={products}
      keyExtractor={(p) => p.id}
      numColumns={2}
      columnWrapperStyle={{ gap: spacing.md }}
      contentContainerStyle={styles.container}
      ListHeaderComponent={
        <View>
          <View style={styles.hero}>
            <Text style={styles.heroKicker}>
              СЕРЕБРО С ВЫРАЩЕННЫМИ БРИЛЛИАНТАМИ
            </Text>
            <Text style={styles.heroTitle}>СИНОНИМ</Text>
            <Text style={styles.heroSub}>
              Современная демократичная ювелирка с лабораторными бриллиантами.
            </Text>
          </View>

          {categories.length > 0 && (
            <View style={styles.chips}>
              {categories.map((c) => (
                <Text
                  key={c.id}
                  style={styles.chip}
                  onPress={() =>
                    router.push({
                      pathname: "/catalog",
                      params: { categoryId: c.id, name: c.name },
                    })
                  }
                >
                  {c.name}
                </Text>
              ))}
            </View>
          )}

          <Text style={styles.sectionTitle}>Новинки</Text>
        </View>
      }
      renderItem={({ item }) => <ProductCard product={item} />}
    />
  )
}

const styles = StyleSheet.create({
  container: { padding: spacing.md, gap: spacing.md },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
    backgroundColor: colors.bg,
  },
  error: { color: colors.accentDeep, textAlign: "center", marginBottom: 8 },
  hint: { color: colors.inkSubtle, textAlign: "center", fontSize: 13 },
  hero: {
    backgroundColor: colors.sand,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  heroKicker: {
    color: colors.accentDeep,
    fontSize: 11,
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
  },
  heroTitle: {
    color: colors.brandDark,
    fontSize: 40,
    fontWeight: "700",
    letterSpacing: 2,
    marginBottom: spacing.sm,
  },
  heroSub: { color: colors.ink, fontSize: 14, lineHeight: 20 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.lg },
  chip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.brandDark,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    overflow: "hidden",
    fontSize: 13,
  },
  sectionTitle: {
    color: colors.brandDark,
    fontSize: 22,
    fontWeight: "700",
    marginBottom: spacing.md,
  },
})
