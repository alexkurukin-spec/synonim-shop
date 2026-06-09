"use client"

import { Checkbox, Label } from "@modules/common/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { PRIVACY_POLICY_SLUG } from "@lib/constants/legal"

type ConsentCheckboxProps = {
  checked: boolean
  onChange: () => void
  name?: string
  "data-testid"?: string
}

/**
 * Чекбокс согласия на обработку персональных данных (152-ФЗ).
 * Используется в формах (оформление заказа и др.); без согласия отправка
 * формы блокируется на стороне вызывающего компонента.
 */
const ConsentCheckbox = ({
  checked,
  onChange,
  name = "pdn_consent",
  "data-testid": dataTestId = "consent-checkbox",
}: ConsentCheckboxProps) => {
  return (
    <div className="flex items-start gap-x-2">
      <Checkbox
        id={name}
        name={name}
        checked={checked}
        onClick={onChange}
        aria-checked={checked}
        data-testid={dataTestId}
        className="mt-0.5"
      />
      <Label
        htmlFor={name}
        className="!transform-none !txt-small text-ui-fg-subtle cursor-pointer"
      >
        Я даю согласие на обработку персональных данных в соответствии с{" "}
        <LocalizedClientLink
          href={`/info/${PRIVACY_POLICY_SLUG}`}
          className="underline hover:text-ui-fg-base"
        >
          Политикой обработки персональных данных
        </LocalizedClientLink>
        .
      </Label>
    </div>
  )
}

export default ConsentCheckbox
