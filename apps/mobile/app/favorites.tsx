import { Link } from "expo-router"
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native"
import { useFavorites } from "@/lib/favorites"
import { formatPrice } from "@/lib/format"
import { colors, radius, spacing } from "@/lib/theme"

export default function FavoritesScreen() {
  const { items } = useFavorites()

  if (items.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>В избранном пока пусто.</Text>
        <Text style={styles.hint}>
          Добавляйте украшения кнопкой ♡ на карточке товара.
        </Text>
      </View>
    )
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(i) => i.handle}
      numColumns={2}
      columnWrapperStyle={{ gap: spacing.md }}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <Link href={`/product/${item.handle}`} asChild>
          <Pressable style={styles.card}>
            <View style={styles.imageWrap}>
              {item.thumbnail ? (
                <Image
                  source={{ uri: item.thumbnail }}
                  style={styles.image}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.placeholder}>
                  <Text style={styles.placeholderText}>СИНОНИМ</Text>
                </View>
              )}
            </View>
            <Text style={styles.title} numberOfLines={2}>
              {item.title}
            </Text>
            {item.price != null && (
              <Text style={styles.price}>от {formatPrice(item.price)}</Text>
            )}
          </Pressable>
        </Link>
      )}
    />
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg, padding: spacing.lg },
  muted: { color: colors.brandDark, fontSize: 18, marginBottom: spacing.sm },
  hint: { color: colors.inkSubtle, textAlign: "center" },
  list: { padding: spacing.md, gap: spacing.md },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    marginBottom: spacing.md,
  },
  imageWrap: { aspectRatio: 0.85, backgroundColor: colors.bg },
  image: { width: "100%", height: "100%" },
  placeholder: { flex: 1, alignItems: "center", justifyContent: "center" },
  placeholderText: { color: colors.brand, letterSpacing: 2, fontWeight: "600" },
  title: { paddingHorizontal: spacing.sm, paddingTop: spacing.sm, color: colors.ink, fontSize: 14 },
  price: { paddingHorizontal: spacing.sm, paddingTop: spacing.xs, paddingBottom: spacing.sm, color: colors.inkSubtle, fontSize: 13 },
})
