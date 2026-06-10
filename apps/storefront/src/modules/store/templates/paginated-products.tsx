import { listCatalogProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import { sortProducts } from "@lib/util/sort-products"
import {
  ActiveFilters,
  hasActiveFilters,
  productMatchesFilters,
} from "@lib/util/facets"
import ProductPreview from "@modules/products/components/product-preview"
import { Pagination } from "@modules/store/components/pagination"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

const PRODUCT_LIMIT = 12

export default async function PaginatedProducts({
  sortBy,
  page,
  collectionId,
  categoryId,
  productsIds,
  countryCode,
  filters,
}: {
  sortBy?: SortOptions
  page: number
  collectionId?: string
  categoryId?: string
  productsIds?: string[]
  countryCode: string
  filters?: ActiveFilters
}) {
  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  let products = await listCatalogProducts({
    categoryId,
    collectionId,
    countryCode,
  })

  if (productsIds) {
    products = products.filter((p) => productsIds.includes(p.id))
  }

  // Фасетная фильтрация in-memory (Store API не фильтрует по опциям/metadata).
  if (filters && hasActiveFilters(filters)) {
    products = products.filter((p) => productMatchesFilters(p, filters))
  }

  const sorted = sortProducts(products, sortBy || "created_at")
  const count = sorted.length
  const totalPages = Math.ceil(count / PRODUCT_LIMIT)
  const start = (page - 1) * PRODUCT_LIMIT
  const pageProducts = sorted.slice(start, start + PRODUCT_LIMIT)

  if (count === 0) {
    return (
      <p className="py-16 text-ui-fg-subtle" data-testid="no-products-message">
        По выбранным фильтрам ничего не найдено.
      </p>
    )
  }

  return (
    <>
      <ul
        className="grid grid-cols-2 w-full small:grid-cols-3 medium:grid-cols-4 gap-x-6 gap-y-8"
        data-testid="products-list"
      >
        {pageProducts.map((p) => {
          return (
            <li key={p.id}>
              <ProductPreview product={p} region={region} />
            </li>
          )
        })}
      </ul>
      {totalPages > 1 && (
        <Pagination
          data-testid="product-pagination"
          page={page}
          totalPages={totalPages}
        />
      )}
    </>
  )
}
