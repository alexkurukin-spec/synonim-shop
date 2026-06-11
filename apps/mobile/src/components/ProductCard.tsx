import { Link } from "expo-router"
import { Image, Pressable, StyleSheet, Text, View } from "react-native"
import { Product, fromPrice } from "@/lib/medusa"
import { formatPrice } from "@/lib/format"
import { colors, radius, spacing } from "@/lib/theme"

export default function ProductCard({ product }: { product: Product }) {
  const price = fromPrice(product)
  const image = product.thumbnail || product.images?.[0]?.url

  return (
    <Link href={`/product/${product.handle}`} asChild>
      <Pressable style={styles.card}>
        <View style={styles.imageWrap}>
          {image ? (
            <Image source={{ uri: image }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={styles.placeholder}>
              <Text style={styles.placeholderText}>СИНОНИМ</Text>
            </View>
          )}
        </View>
        <Text style={styles.title} numberOfLines={2}>
          {product.title}
        </Text>
        {price != null && (
          <Text style={styles.price}>от {formatPrice(price)}</Text>
        )}
      </Pressable>
    </Link>
  )
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    marginBottom: spacing.md,
  },
  imageWrap: {
    aspectRatio: 0.85,
    backgroundColor: colors.bg,
  },
  image: { width: "100%", height: "100%" },
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    color: colors.brand,
    letterSpacing: 2,
    fontWeight: "600",
  },
  title: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    color: colors.ink,
    fontSize: 14,
  },
  price: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
    color: colors.inkSubtle,
    fontSize: 13,
  },
})
