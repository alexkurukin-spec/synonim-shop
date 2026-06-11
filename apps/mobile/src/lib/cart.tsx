import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import {
  Cart,
  addLineItem,
  createCart,
  getCart,
  removeLineItem,
  updateLineItem,
} from "./medusa"

const CART_KEY = "synonim_cart_id"

type CartContextValue = {
  cart: Cart | null
  loading: boolean
  count: number
  add: (variantId: string, quantity?: number) => Promise<void>
  setQty: (lineId: string, quantity: number) => Promise<void>
  remove: (lineId: string) => Promise<void>
  refresh: () => Promise<void>
  clear: () => Promise<void>
}

const CartContext = createContext<CartContextValue | null>(null)

async function ensureCart(): Promise<Cart> {
  const existingId = await AsyncStorage.getItem(CART_KEY)
  if (existingId) {
    const c = await getCart(existingId)
    if (c) return c
  }
  const created = await createCart()
  await AsyncStorage.setItem(CART_KEY, created.id)
  return created
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const c = await ensureCart()
      setCart(c)
    } catch (e) {
      // молча — экран покажет пустое состояние/ошибку
      setCart(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const add = useCallback(async (variantId: string, quantity = 1) => {
    const c = await ensureCart()
    const updated = await addLineItem(c.id, variantId, quantity)
    setCart(updated)
  }, [])

  const setQty = useCallback(
    async (lineId: string, quantity: number) => {
      if (!cart) return
      if (quantity <= 0) {
        await removeLineItem(cart.id, lineId)
        const c = await getCart(cart.id)
        setCart(c)
        return
      }
      const updated = await updateLineItem(cart.id, lineId, quantity)
      setCart(updated)
    },
    [cart]
  )

  const remove = useCallback(
    async (lineId: string) => {
      if (!cart) return
      await removeLineItem(cart.id, lineId)
      const c = await getCart(cart.id)
      setCart(c)
    },
    [cart]
  )

  // Сброс корзины после оформления заказа — заведём новую.
  const clear = useCallback(async () => {
    await AsyncStorage.removeItem(CART_KEY)
    const created = await createCart()
    await AsyncStorage.setItem(CART_KEY, created.id)
    setCart(created)
  }, [])

  const count = useMemo(
    () => (cart?.items || []).reduce((n, i) => n + i.quantity, 0),
    [cart]
  )

  const value = useMemo(
    () => ({ cart, loading, count, add, setQty, remove, refresh, clear }),
    [cart, loading, count, add, setQty, remove, refresh, clear]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error("useCart должен использоваться внутри CartProvider")
  return ctx
}
