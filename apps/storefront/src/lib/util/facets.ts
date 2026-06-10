import { HttpTypes } from "@medusajs/types"

/**
 * Фасетные фильтры каталога (Фаза 2/3).
 * Источники: опции вариантов «Каратность/Размер/Металл» (product.options)
 * и огранка из product.metadata.stone.cut. Фильтрация — in-memory, т.к.
 * Store API не умеет фильтровать по значениям опций/metadata.
 */

export type FacetKey = "carat" | "cut" | "size" | "metal"

// Названия опций в каталоге (см. seed: OPT_SIZE/OPT_CARAT/OPT_METAL).
const OPTION_TITLE: Partial<Record<FacetKey, string>> = {
  carat: "Каратность",
  size: "Размер",
  metal: "Металл",
}

export const FACETS: { key: FacetKey; param: string; label: string }[] = [
  { key: "carat", param: "carat", label: "Каратность" },
  { key: "cut", param: "cut", label: "Огранка" },
  { key: "size", param: "size", label: "Размер" },
  { key: "metal", param: "metal", label: "Металл" },
]

// Огранка хранится латиницей — показываем по-русски.
const CUT_LABELS: Record<string, string> = {
  round: "Круглая",
  pear: "Груша",
  oval: "Овал",
  princess: "Принцесса",
  emerald: "Изумрудная",
  marquise: "Маркиз",
  cushion: "Кушон",
  heart: "Сердце",
}
export const facetValueLabel = (key: FacetKey, value: string): string =>
  key === "cut" ? CUT_LABELS[value] ?? value : value

type AnyProduct = HttpTypes.StoreProduct

const optionValues = (product: AnyProduct, title: string): string[] =>
  product.options
    ?.find((o) => o.title === title)
    ?.values?.map((v) => v.value)
    .filter((v): v is string => Boolean(v)) ?? []

const productCut = (product: AnyProduct): string | undefined => {
  const stone = (product.metadata as Record<string, unknown> | null)?.stone as
    | { cut?: string }
    | undefined
  return stone?.cut
}

/** Значения всех фасетов, которые предлагает товар. */
export const facetValuesForProduct = (
  product: AnyProduct
): Record<FacetKey, string[]> => {
  const cut = productCut(product)
  return {
    carat: optionValues(product, OPTION_TITLE.carat!),
    size: optionValues(product, OPTION_TITLE.size!),
    metal: optionValues(product, OPTION_TITLE.metal!),
    cut: cut ? [cut] : [],
  }
}

export type Facets = Record<FacetKey, string[]>

const numericSort = (a: string, b: string) => {
  const na = parseFloat(a)
  const nb = parseFloat(b)
  if (!isNaN(na) && !isNaN(nb)) return na - nb
  return a.localeCompare(b, "ru")
}

/** Доступные значения фасетов по набору товаров (для сайдбара). */
export const extractFacets = (products: AnyProduct[]): Facets => {
  const acc: Facets = { carat: [], size: [], metal: [], cut: [] }
  for (const p of products) {
    const fv = facetValuesForProduct(p)
    ;(Object.keys(acc) as FacetKey[]).forEach((k) => {
      for (const v of fv[k]) if (!acc[k].includes(v)) acc[k].push(v)
    })
  }
  acc.carat.sort(numericSort)
  acc.size.sort(numericSort)
  acc.metal.sort((a, b) => a.localeCompare(b, "ru"))
  acc.cut.sort((a, b) => a.localeCompare(b, "ru"))
  return acc
}

export type ActiveFilters = Partial<Record<FacetKey, string[]>>

/** Разбор активных фильтров из query-параметров (значения через запятую). */
export const parseFilters = (
  searchParams: Record<string, string | undefined>
): ActiveFilters => {
  const filters: ActiveFilters = {}
  for (const { key, param } of FACETS) {
    const raw = searchParams[param]
    if (raw) {
      filters[key] = raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    }
  }
  return filters
}

export const activeFilterCount = (filters: ActiveFilters): number =>
  FACETS.reduce((n, { key }) => n + (filters[key]?.length ? 1 : 0), 0)

export const hasActiveFilters = (filters: ActiveFilters): boolean =>
  activeFilterCount(filters) > 0

/** Подходит ли товар под активные фильтры (AND между фасетами, OR внутри). */
export const productMatchesFilters = (
  product: AnyProduct,
  filters: ActiveFilters
): boolean => {
  const fv = facetValuesForProduct(product)
  for (const { key } of FACETS) {
    const want = filters[key]
    if (want && want.length) {
      if (!want.some((w) => fv[key].includes(w))) return false
    }
  }
  return true
}
