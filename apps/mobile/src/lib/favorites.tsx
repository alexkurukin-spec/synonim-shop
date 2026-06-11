import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { Product, fromPrice } from "./medusa"

const FAV_KEY = "synonim_favorites"

export type FavItem = {
  id: string
  handle: string
  title: string
  thumbnail?: string | null
  price?: number
}

type FavoritesContextValue = {
  items: FavItem[]
  isFavorite: (handle: string) => boolean
  toggle: (product: Product) => void
  count: number
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null)

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<FavItem[]>([])

  useEffect(() => {
    ;(async () => {
      try {
        const raw = await AsyncStorage.getItem(FAV_KEY)
        if (raw) setItems(JSON.parse(raw))
      } catch {
        // ignore
      }
    })()
  }, [])

  const persist = (next: FavItem[]) => {
    setItems(next)
    AsyncStorage.setItem(FAV_KEY, JSON.stringify(next)).catch(() => {})
  }

  const isFavorite = (handle: string) => items.some((i) => i.handle === handle)

  const toggle = (product: Product) => {
    if (isFavorite(product.handle)) {
      persist(items.filter((i) => i.handle !== product.handle))
    } else {
      persist([
        {
          id: product.id,
          handle: product.handle,
          title: product.title,
          thumbnail: product.thumbnail || product.images?.[0]?.url || null,
          price: fromPrice(product),
        },
        ...items,
      ])
    }
  }

  const value = useMemo(
    () => ({ items, isFavorite, toggle, count: items.length }),
    [items]
  )

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext)
  if (!ctx)
    throw new Error("useFavorites должен использоваться внутри FavoritesProvider")
  return ctx
}
