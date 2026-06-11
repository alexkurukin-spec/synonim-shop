import { useEffect, useState } from "react"
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native"
import { useLocalSearchParams, useNavigation } from "expo-router"
import ProductCard from "@/components/ProductCard"
import { Product, listProducts } from "@/lib/medusa"
import { colors, spacing } from "@/lib/theme"

export default function CatalogScreen() {
  const params = useLocalSearchParams<{ categoryId?: string; name?: string }>()
  const navigation = useNavigation()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (params.name) {
      navigation.setOptions({ title: params.name })
    }
  }, [params.name, navigation])

  useEffect(() => {
    let active = true
    setLoading(true)
    ;(async () => {
      try {
        const { products } = await listProducts({
          categoryId: params.categoryId,
          limit: 100,
        })
        if (active) setProducts(products)
      } catch (e) {
        if (active) setError((e as Error).message)
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [params.categoryId])

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
      ListEmptyComponent={
        <Text style={styles.empty}>Товары не найдены.</Text>
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
    backgroundColor: colors.bg,
  },
  error: { color: colors.accentDeep, padding: spacing.lg, textAlign: "center" },
  empty: { color: colors.inkSubtle, padding: spacing.lg, textAlign: "center" },
})
