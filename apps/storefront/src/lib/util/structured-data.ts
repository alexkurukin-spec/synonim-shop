import { HttpTypes } from "@medusajs/types"
import {
  SITE_DESCRIPTION,
  SITE_LOGO_PATH,
  SITE_NAME,
  SITE_SAME_AS,
  SITE_TELEPHONE,
  getSiteUrl,
} from "@lib/constants/seo"
import { getProductPrice } from "./get-product-price"

/** Organization — единый блок о бренде для всего сайта. */
export const organizationJsonLd = (): Record<string, unknown> => {
  const url = getSiteUrl()
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url,
    logo: `${url}${SITE_LOGO_PATH}`,
    description: SITE_DESCRIPTION,
  }

  if (SITE_SAME_AS.length > 0) {
    data.sameAs = SITE_SAME_AS
  }

  if (SITE_TELEPHONE) {
    data.contactPoint = {
      "@type": "ContactPoint",
      telephone: SITE_TELEPHONE,
      contactType: "customer service",
      areaServed: "RU",
      availableLanguage: "Russian",
    }
  }

  return data
}

/** WebSite — даёт Google имя сайта и потенциальный sitelinks-searchbox. */
export const websiteJsonLd = (): Record<string, unknown> => {
  const url = getSiteUrl()
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url,
    inLanguage: "ru-RU",
  }
}

export type BreadcrumbItem = { name: string; item: string }

/** BreadcrumbList из абсолютных URL. */
export const breadcrumbJsonLd = (
  items: BreadcrumbItem[]
): Record<string, unknown> => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((it, idx) => ({
    "@type": "ListItem",
    position: idx + 1,
    name: it.name,
    item: it.item,
  })),
})

/** Product + Offer (цена от {min}, валюта RUB, наличие). */
export const productJsonLd = (
  product: HttpTypes.StoreProduct,
  countryCode: string
): Record<string, unknown> => {
  const url = `${getSiteUrl()}/${countryCode}/products/${product.handle}`
  const { cheapestPrice } = getProductPrice({ product })

  const images = (product.images?.map((i) => i.url).filter(Boolean) ??
    []) as string[]
  if (product.thumbnail && !images.includes(product.thumbnail)) {
    images.unshift(product.thumbnail)
  }

  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description || product.title,
    url,
    ...(images.length > 0 ? { image: images } : {}),
    brand: { "@type": "Brand", name: SITE_NAME },
  }

  if (product.material) {
    data.material = product.material
  }

  // УИН/SKU как идентификатор товара, если задан на варианте.
  const sku = product.variants?.find((v) => v.sku)?.sku
  if (sku) {
    data.sku = sku
  }

  if (cheapestPrice) {
    const inStock = product.variants?.some(
      (v) =>
        !v.manage_inventory ||
        v.allow_backorder ||
        (v.inventory_quantity ?? 0) > 0
    )

    data.offers = {
      "@type": "Offer",
      url,
      priceCurrency: cheapestPrice.currency_code.toUpperCase(),
      price: cheapestPrice.calculated_price_number,
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: SITE_NAME },
    }
  }

  return data
}
