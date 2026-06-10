"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"

import { FACETS, Facets } from "@lib/util/facets"
import SortProducts, { SortOptions } from "./sort-products"
import FacetFilter from "./facet-filter"

type RefinementListProps = {
  sortBy: SortOptions
  facets?: Facets
  search?: boolean
  "data-testid"?: string
}

const RefinementList = ({
  sortBy,
  facets,
  "data-testid": dataTestId,
}: RefinementListProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const pushParams = useCallback(
    (params: URLSearchParams) => {
      // Любая смена фильтра/сортировки сбрасывает пагинацию.
      params.delete("page")
      const qs = params.toString()
      router.push(qs ? `${pathname}?${qs}` : pathname)
    },
    [pathname, router]
  )

  const setQueryParams = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams)
    params.set(name, value)
    pushParams(params)
  }

  // Переключить значение в мультизначном фасете (через запятую).
  const toggleFacet = (param: string, value: string) => {
    const params = new URLSearchParams(searchParams)
    const current = (params.get(param) || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value]
    if (next.length) {
      params.set(param, next.join(","))
    } else {
      params.delete(param)
    }
    pushParams(params)
  }

  const hasAnyFacet =
    !!facets && FACETS.some(({ key }) => (facets[key]?.length ?? 0) > 0)
  const hasActive = FACETS.some(({ param }) => searchParams.get(param))

  const resetFilters = () => {
    const params = new URLSearchParams(searchParams)
    FACETS.forEach(({ param }) => params.delete(param))
    pushParams(params)
  }

  const selectedFor = (param: string) =>
    (searchParams.get(param) || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)

  return (
    <div className="flex small:flex-col gap-8 py-4 mb-8 small:px-0 pl-6 small:min-w-[250px] small:ml-[1.675rem]">
      <SortProducts
        sortBy={sortBy}
        setQueryParams={setQueryParams}
        data-testid={dataTestId}
      />

      {hasAnyFacet && (
        <div className="flex small:flex-col gap-8">
          {FACETS.map(({ key, param, label }) => (
            <FacetFilter
              key={param}
              facetKey={key}
              label={label}
              param={param}
              values={facets?.[key] ?? []}
              selected={selectedFor(param)}
              onToggle={toggleFacet}
            />
          ))}
          {hasActive && (
            <button
              onClick={resetFilters}
              className="text-left txt-compact-small text-ui-fg-interactive hover:text-ui-fg-interactive-hover"
              data-testid="reset-filters"
            >
              Сбросить фильтры
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default RefinementList
