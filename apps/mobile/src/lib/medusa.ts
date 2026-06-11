/**
 * Лёгкий клиент Medusa Store API на fetch (без SDK — меньше зависимостей в RN).
 * Использует тот же backend и publishable-ключ, что и витрина.
 */

const BACKEND_URL = (
  process.env.EXPO_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
).replace(/\/$/, "")
const PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""
const DEFAULT_REGION = process.env.EXPO_PUBLIC_DEFAULT_REGION || "ru"

// ── Типы (только то, что используем) ─────────────────────────────────────────
export type Money = { calculated_amount?: number; currency_code?: string }
export type OptionValue = { value: string }
export type ProductOption = { title: string; values?: OptionValue[] }
export type Variant = {
  id: string
  title?: string
  calculated_price?: Money
  options?: { value: string; option?: { title: string } }[]
}
export type ProductImage = { id: string; url: string }
export type Product = {
  id: string
  title: string
  handle: string
  description?: string | null
  thumbnail?: string | null
  images?: ProductImage[]
  options?: ProductOption[]
  variants?: Variant[]
  metadata?: Record<string, unknown> | null
}
export type Category = {
  id: string
  name: string
  handle: string
}
export type LineItem = {
  id: string
  title: string
  quantity: number
  unit_price: number
  thumbnail?: string | null
  product_title?: string
}
export type Cart = {
  id: string
  region_id?: string
  currency_code?: string
  items?: LineItem[]
  total?: number
  subtotal?: number
}

// ── Базовый запрос ───────────────────────────────────────────────────────────
function buildQuery(query?: Record<string, string | number | undefined>): string {
  if (!query) return ""
  const parts: string[] = []
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined) {
      parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    }
  }
  return parts.length ? `?${parts.join("&")}` : ""
}

async function api<T>(
  path: string,
  init?: RequestInit & { query?: Record<string, string | number | undefined> }
): Promise<T> {
  const url = `${BACKEND_URL}${path}${buildQuery(init?.query)}`
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "x-publishable-api-key": PUBLISHABLE_KEY,
      ...(init?.headers || {}),
    },
  })
  const text = await res.text()
  const json = text ? JSON.parse(text) : {}
  if (!res.ok) {
    throw new Error(
      json?.message || `Ошибка запроса (${res.status}) ${path}`
    )
  }
  return json as T
}

// ── Регион ───────────────────────────────────────────────────────────────────
let regionIdCache: string | null = null

export async function getRegionId(): Promise<string> {
  if (regionIdCache) return regionIdCache
  const { regions } = await api<{ regions: any[] }>("/store/regions")
  const match =
    regions.find((r) =>
      r.countries?.some((c: any) => c.iso_2 === DEFAULT_REGION)
    ) || regions[0]
  if (!match) throw new Error("Регион не найден в магазине")
  regionIdCache = match.id
  return match.id
}

// ── Товары и категории ───────────────────────────────────────────────────────
const PRODUCT_FIELDS =
  "handle,title,thumbnail,*images,*variants.calculated_price,*options,*options.values,+metadata"

export async function listProducts(params?: {
  categoryId?: string
  limit?: number
  offset?: number
}): Promise<{ products: Product[]; count: number }> {
  const region_id = await getRegionId()
  const { products, count } = await api<{ products: Product[]; count: number }>(
    "/store/products",
    {
      query: {
        region_id,
        limit: params?.limit ?? 50,
        offset: params?.offset ?? 0,
        category_id: params?.categoryId,
        fields: PRODUCT_FIELDS,
      } as any,
    }
  )
  return { products, count }
}

export async function getProductByHandle(handle: string): Promise<Product | null> {
  const region_id = await getRegionId()
  const { products } = await api<{ products: Product[] }>("/store/products", {
    query: { region_id, handle, fields: PRODUCT_FIELDS },
  })
  return products[0] ?? null
}

export async function listCategories(): Promise<Category[]> {
  const { product_categories } = await api<{ product_categories: Category[] }>(
    "/store/product-categories",
    { query: { fields: "id,name,handle", limit: 100 } }
  )
  return product_categories
}

// ── Цена «от {min}» ──────────────────────────────────────────────────────────
export function cheapestVariant(product: Product): Variant | undefined {
  const withPrice = (product.variants || []).filter(
    (v) => v.calculated_price?.calculated_amount != null
  )
  return withPrice.sort(
    (a, b) =>
      (a.calculated_price!.calculated_amount || 0) -
      (b.calculated_price!.calculated_amount || 0)
  )[0]
}

export function fromPrice(product: Product): number | undefined {
  return cheapestVariant(product)?.calculated_price?.calculated_amount
}

// ── Корзина ──────────────────────────────────────────────────────────────────
export async function createCart(): Promise<Cart> {
  const region_id = await getRegionId()
  const { cart } = await api<{ cart: Cart }>("/store/carts", {
    method: "POST",
    body: JSON.stringify({ region_id }),
  })
  return cart
}

export async function getCart(cartId: string): Promise<Cart | null> {
  try {
    const { cart } = await api<{ cart: Cart }>(`/store/carts/${cartId}`)
    return cart
  } catch {
    return null
  }
}

export async function addLineItem(
  cartId: string,
  variantId: string,
  quantity = 1
): Promise<Cart> {
  const { cart } = await api<{ cart: Cart }>(
    `/store/carts/${cartId}/line-items`,
    {
      method: "POST",
      body: JSON.stringify({ variant_id: variantId, quantity }),
    }
  )
  return cart
}

export async function updateLineItem(
  cartId: string,
  lineId: string,
  quantity: number
): Promise<Cart> {
  const { cart } = await api<{ cart: Cart }>(
    `/store/carts/${cartId}/line-items/${lineId}`,
    {
      method: "POST",
      body: JSON.stringify({ quantity }),
    }
  )
  return cart
}

export async function removeLineItem(
  cartId: string,
  lineId: string
): Promise<void> {
  await api(`/store/carts/${cartId}/line-items/${lineId}`, {
    method: "DELETE",
  })
}

export { BACKEND_URL, DEFAULT_REGION }
