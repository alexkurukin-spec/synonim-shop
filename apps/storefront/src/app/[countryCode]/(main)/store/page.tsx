import { Metadata } from "next"

import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import StoreTemplate from "@modules/store/templates"
import { parseFilters } from "@lib/util/facets"

export const metadata: Metadata = {
  title: "Каталог украшений",
  description:
    "Все украшения СИНОНИМ: кольца, серьги, подвески, браслеты из серебра 925 с выращенными бриллиантами. Фильтры по каратности, огранке, размеру и металлу.",
}

type Params = {
  searchParams: Promise<{
    sortBy?: SortOptions
    page?: string
    carat?: string
    cut?: string
    size?: string
    metal?: string
  }>
  params: Promise<{
    countryCode: string
  }>
}

export default async function StorePage(props: Params) {
  const params = await props.params
  const searchParams = await props.searchParams
  const { sortBy, page } = searchParams
  const filters = parseFilters(searchParams)

  return (
    <StoreTemplate
      sortBy={sortBy}
      page={page}
      countryCode={params.countryCode}
      filters={filters}
    />
  )
}
