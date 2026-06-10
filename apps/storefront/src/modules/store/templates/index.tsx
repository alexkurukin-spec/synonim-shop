import { Suspense } from "react"

import { listCatalogProducts } from "@lib/data/products"
import { ActiveFilters, extractFacets } from "@lib/util/facets"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import RecommendedFilters from "@modules/store/components/recommended-filters"

import PaginatedProducts from "./paginated-products"

const StoreTemplate = async ({
  sortBy,
  page,
  countryCode,
  filters,
}: {
  sortBy?: SortOptions
  page?: string
  countryCode: string
  filters?: ActiveFilters
}) => {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"

  const catalogProducts = await listCatalogProducts({ countryCode })
  const facets = extractFacets(catalogProducts)

  return (
    <div
      className="flex flex-col small:flex-row small:items-start py-6 content-container"
      data-testid="category-container"
    >
      <RefinementList sortBy={sort} facets={facets} />
      <div className="w-full">
        <div className="mb-8 text-2xl-semi">
          <h1 data-testid="store-page-title">Каталог украшений</h1>
        </div>
        <Suspense fallback={<SkeletonProductGrid />}>
          <PaginatedProducts
            sortBy={sort}
            page={pageNumber}
            countryCode={countryCode}
            filters={filters}
          />
        </Suspense>

        <RecommendedFilters
          basePath="/store"
          categoryName="Каталог"
          facets={facets}
        />
      </div>
    </div>
  )
}

export default StoreTemplate
