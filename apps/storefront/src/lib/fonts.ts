import { Playfair_Display, Inter } from "next/font/google"

/**
 * Brand typography (see brand brief §1 / brand-tokens).
 * Both families load latin + cyrillic subsets with display: "swap".
 * Exposed as CSS variables consumed by Tailwind (`font-display` / `font-body`).
 */
export const playfair = Playfair_Display({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "600", "700"],
  variable: "--font-display",
  display: "swap",
})

export const inter = Inter({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
})
