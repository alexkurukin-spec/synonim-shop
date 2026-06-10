import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getCategoryByHandle, listCategories } from "@lib/data/categories"
import { listRegions } from "@lib/data/regions"
import { HttpTypes, StoreRegion } from "@medusajs/types"
import CategoryTemplate from "@modules/categories/templates"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { getSiteUrl } from "@lib/constants/seo"
import { breadcrumbJsonLd } from "@lib/util/structured-data"
import { activeFilterCount, parseFilters } from "@lib/util/facets"
import JsonLd from "@modules/common/components/json-ld"

const decodeHandle = (segments: string[]) =>
  segments
    .map((s) => {
      try {
        return decodeURIComponent(s)
      } catch {
        return s
      }
    })
    .join("/")

type Props = {
  params: Promise<{ category: string[]; countryCode: string }>
  searchParams: Promise<{
    sortBy?: SortOptions
    page?: string
    carat?: string
    cut?: string
    size?: string
    metal?: string
  }>
}

export async function generateStaticParams() {
  const product_categories = await listCategories()

  if (!product_categories) {
    return []
  }

  const countryCodes = await listRegions().then((regions: StoreRegion[]) =>
    regions?.map((r) => r.countries?.map((c) => c.iso_2)).flat()
  )

  const categoryHandles = product_categories.map(
    (category: HttpTypes.StoreProductCategory) => category.handle
  )

  const staticParams = countryCodes
    ?.map((countryCode: string | undefined) =>
      categoryHandles.map((handle: string) => ({
        countryCode,
        category: [handle],
      }))
    )
    .flat()

  return staticParams
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const searchParams = await props.searchParams
  try {
    const productCategory = await getCategoryByHandle(params.category)

    const description =
      productCategory.description ||
      `${productCategory.name} с выращенными бриллиантами. Каталог СИНОНИМ — доставка по России.`

    // SEO (Фаза 3): все фильтр-страницы канониклятся на базовую категорию.
    // Одиночный фасет — индексируется (длинный хвост); многопараметрические
    // комбинации (≥2 параметров) и пагинация — noindex, без индекс-мусора.
    const handle = decodeHandle(params.category)
    const paramCount =
      activeFilterCount(parseFilters(searchParams)) +
      (searchParams.sortBy ? 1 : 0)
    const isFiltered =
      paramCount >= 2 ||
      (searchParams.page ? parseInt(searchParams.page) > 1 : false)

    return {
      title: productCategory.name,
      description,
      alternates: {
        canonical: `/${params.countryCode}/categories/${handle}`,
      },
      ...(isFiltered
        ? { robots: { index: false, follow: true } }
        : {}),
    }
  } catch {
    notFound()
  }
}

export default async function CategoryPage(props: Props) {
  const searchParams = await props.searchParams
  const params = await props.params
  const { sortBy, page } = searchParams
  const filters = parseFilters(searchParams)

  const productCategory = await getCategoryByHandle(params.category)

  if (!productCategory) {
    notFound()
  }

  const siteUrl = getSiteUrl()
  const handle = decodeHandle(params.category)
  const breadcrumb = breadcrumbJsonLd([
    { name: "Главная", item: `${siteUrl}/${params.countryCode}` },
    {
      name: productCategory.name,
      item: `${siteUrl}/${params.countryCode}/categories/${handle}`,
    },
  ])

  return (
    <>
      <JsonLd data={breadcrumb} />
      <CategoryTemplate
        category={productCategory}
        sortBy={sortBy}
        page={page}
        countryCode={params.countryCode}
        filters={filters}
      />
    </>
  )
}
