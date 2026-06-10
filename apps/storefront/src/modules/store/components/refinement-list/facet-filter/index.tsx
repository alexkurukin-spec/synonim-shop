"use client"

import { FacetKey, facetValueLabel } from "@lib/util/facets"
import { Checkbox, Label } from "@modules/common/components/ui"

type FacetFilterProps = {
  facetKey: FacetKey
  label: string
  param: string
  values: string[]
  selected: string[]
  onToggle: (param: string, value: string) => void
}

/** Группа фасета: заголовок + список значений-чекбоксов. */
const FacetFilter = ({
  facetKey,
  label,
  param,
  values,
  selected,
  onToggle,
}: FacetFilterProps) => {
  if (!values.length) {
    return null
  }

  return (
    <div className="flex flex-col gap-y-3" data-testid={`facet-${param}`}>
      <span className="txt-compact-small-plus text-ui-fg-muted uppercase">
        {label}
      </span>
      <ul className="flex flex-col gap-y-2">
        {values.map((value) => {
          const id = `${param}-${value}`
          const checked = selected.includes(value)
          return (
            <li key={value} className="flex items-center gap-x-2">
              <Checkbox
                id={id}
                checked={checked}
                onClick={() => onToggle(param, value)}
                aria-checked={checked}
                data-testid={`facet-option-${param}-${value}`}
              />
              <Label
                htmlFor={id}
                className="!transform-none !txt-compact-small cursor-pointer text-ui-fg-subtle hover:text-ui-fg-base"
              >
                {facetValueLabel(facetKey, value)}
              </Label>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default FacetFilter
