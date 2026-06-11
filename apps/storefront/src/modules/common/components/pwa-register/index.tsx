"use client"

import { useEffect } from "react"

/** Регистрирует service worker PWA (только в проде и при поддержке браузером). */
export default function PwaRegister() {
  useEffect(() => {
    if (
      process.env.NODE_ENV === "production" &&
      typeof navigator !== "undefined" &&
      "serviceWorker" in navigator
    ) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // SW — прогрессивное улучшение; молча игнорируем сбой регистрации
      })
    }
  }, [])

  return null
}
