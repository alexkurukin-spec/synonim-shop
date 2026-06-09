import { MetadataRoute } from "next"
import { listCategories } from "@lib/data/categories"
import { listProducts } from "@lib/data/products"
import { getSiteUrl } from "@lib/constants/seo"
import { LEGAL_PAGES } from "@lib/constants/legal"

const DEFAULT_REGION = process.env.NEXT_PUBLIC_DEFAULT_REGION || "ru"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl()
  const prefix = `${base}/${DEFAULT_REGION}`
  const now = new Date()

  const staticEntries: MetadataRoute.Sitemap = [
    { url: prefix, lastModified: now, changeFrequency: "daily", priority: 1 },
    {
      url: `${prefix}/store`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    ...LEGAL_PAGES.map((p) => ({
      url: `${prefix}/info/${p.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.3,
    })),
  ]

  let categoryEntries: MetadataRoute.Sitemap = []
  let productEntries: MetadataRoute.Sitemap = []

  try {
    const categories = await listCategories()
    categoryEntries =
      categories?.map((c) => ({
        url: `${prefix}/categories/${c.handle}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })) ?? []
  } catch {
    // backend недоступен — отдаём как минимум статические URL
  }

  try {
    const { response } = await listProducts({
      countryCode: DEFAULT_REGION,
      queryParams: { limit: 1000, fields: "handle,updated_at" },
    })
    productEntries = response.products
      .filter((p) => p.handle)
      .map((p) => ({
        url: `${prefix}/products/${p.handle}`,
        lastModified: p.updated_at ? new Date(p.updated_at) : now,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      }))
  } catch {
    // backend недоступен — пропускаем товары
  }

  return [...staticEntries, ...categoryEntries, ...productEntries]
}
