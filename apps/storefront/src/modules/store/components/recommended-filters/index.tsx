import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { FACETS, Facets, facetValueLabel } from "@lib/util/facets"

type RecommendedFiltersProps = {
  /** Базовый путь категории, напр. "/categories/кольца" (без countryCode). */
  basePath: string
  categoryName: string
  facets: Facets
}

/**
 * «Рекомендуемые подборки» — ручная перелинковка на одиночные фильтры
 * под длинный хвост (Фаза 3): каратность/огранка/размер/металл.
 * Каждая ссылка ведёт на категорию с одним активным фасетом.
 */
const RecommendedFilters = ({
  basePath,
  categoryName,
  facets,
}: RecommendedFiltersProps) => {
  // Для длинного хвоста берём наиболее «продающие» фасеты: огранку и каратность.
  const groups = FACETS.filter(
    (f) => (f.key === "cut" || f.key === "carat") && facets[f.key].length > 1
  )

  const links = groups.flatMap(({ key, param, label }) =>
    facets[key].map((value) => ({
      key: `${param}-${value}`,
      label: `${categoryName} · ${label.toLowerCase()}: ${facetValueLabel(
        key,
        value
      )}`,
      href: `${basePath}?${param}=${encodeURIComponent(value)}`,
    }))
  )

  if (links.length === 0) {
    return null
  }

  return (
    <section className="mt-16 border-t border-ui-border-base pt-8">
      <h2 className="text-xl-semi mb-4">Рекомендуемые подборки</h2>
      <ul className="flex flex-wrap gap-x-4 gap-y-2">
        {links.map((l) => (
          <li key={l.key}>
            <LocalizedClientLink
              href={l.href}
              className="txt-compact-small text-ui-fg-interactive hover:text-ui-fg-interactive-hover underline"
            >
              {l.label}
            </LocalizedClientLink>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default RecommendedFilters
