"use client"

import { Heading, Text, clx } from "@modules/common/components/ui"

import PaymentButton from "../payment-button"
import { useSearchParams } from "next/navigation"
import { HttpTypes } from "@medusajs/types"
import { useState } from "react"
import ConsentCheckbox from "@modules/common/components/consent-checkbox"

const Review = ({ cart }: { cart: HttpTypes.StoreCart }) => {
  const searchParams = useSearchParams()

  // 152-ФЗ: без согласия на обработку ПДн заказ не оформляется.
  const [consent, setConsent] = useState(false)

  const isOpen = searchParams.get("step") === "review"

  const paidByGiftcard = !!(
    (cart as unknown as Record<string, unknown>)?.gift_cards && ((cart as unknown as Record<string, unknown>)?.gift_cards as unknown[])?.length > 0 && cart?.total === 0
  )

  const previousStepsCompleted =
    cart.shipping_address &&
    (cart.shipping_methods?.length ?? 0) > 0 &&
    (cart.payment_collection || paidByGiftcard)

  return (
    <div className="bg-white">
      <div className="flex flex-row items-center justify-between mb-6">
        <Heading
          level="h2"
          className={clx(
            "flex flex-row text-3xl-regular gap-x-2 items-baseline",
            {
              "opacity-50 pointer-events-none select-none": !isOpen,
            }
          )}
        >
          Review
        </Heading>
      </div>
      {isOpen && previousStepsCompleted && (
        <>
          <div className="flex items-start gap-x-1 w-full mb-6">
            <div className="w-full">
              <Text className="txt-medium-plus text-ui-fg-base mb-1">
                Оформляя заказ, вы подтверждаете, что ознакомились с условиями
                продажи, доставки и возврата СИНОНИМ.
              </Text>
            </div>
          </div>
          <div className="mb-6">
            <ConsentCheckbox
              checked={consent}
              onChange={() => setConsent((v) => !v)}
              data-testid="checkout-consent-checkbox"
            />
          </div>
          <PaymentButton
            cart={cart}
            disabled={!consent}
            data-testid="submit-order-button"
          />
        </>
      )}
    </div>
  )
}

export default Review
