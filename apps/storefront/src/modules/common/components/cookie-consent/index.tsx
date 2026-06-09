"use client"

import { useEffect, useState } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Button } from "@modules/common/components/ui"
import { PRIVACY_POLICY_SLUG } from "@lib/constants/legal"

const STORAGE_KEY = "synonim_cookie_consent"

/**
 * Cookie-баннер с явным согласием (152-ФЗ). Решение хранится в localStorage,
 * баннер не показывается повторно после выбора.
 */
export default function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      if (!window.localStorage.getItem(STORAGE_KEY)) {
        setVisible(true)
      }
    } catch {
      // localStorage недоступен — баннер просто не показываем
    }
  }, [])

  const accept = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "accepted")
    } catch {}
    setVisible(false)
  }

  if (!visible) {
    return null
  }

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 border-t border-ui-border-base bg-white/95 backdrop-blur px-4 py-4 shadow-lg"
      data-testid="cookie-consent"
      role="region"
      aria-label="Согласие на использование cookie"
    >
      <div className="content-container flex flex-col gap-3 small:flex-row small:items-center small:justify-between">
        <p className="text-small-regular text-ui-fg-subtle max-w-2xl">
          Мы используем cookie для работы сайта и аналитики. Продолжая
          пользоваться сайтом, вы соглашаетесь с обработкой данных согласно{" "}
          <LocalizedClientLink
            href={`/info/${PRIVACY_POLICY_SLUG}`}
            className="underline hover:text-ui-fg-base"
          >
            Политике обработки персональных данных
          </LocalizedClientLink>
          .
        </p>
        <Button
          onClick={accept}
          size="small"
          data-testid="cookie-consent-accept"
          className="shrink-0"
        >
          Принять
        </Button>
      </div>
    </div>
  )
}
