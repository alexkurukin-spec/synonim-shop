import { getBaseURL } from "@lib/util/env"
import { inter, playfair } from "@lib/fonts"
import { Metadata, Viewport } from "next"
import {
  SITE_DESCRIPTION,
  SITE_HREFLANG,
  SITE_LOCALE,
  SITE_NAME,
  SITE_TAGLINE,
} from "@lib/constants/seo"
import {
  organizationJsonLd,
  websiteJsonLd,
} from "@lib/util/structured-data"
import JsonLd from "@modules/common/components/json-ld"
import PwaRegister from "@modules/common/components/pwa-register"
import "styles/globals.css"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: {
    languages: { [SITE_HREFLANG]: "/" },
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: SITE_LOCALE,
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
  // PWA: иконка для iOS и режим «как приложение» при добавлении на экран Домой.
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: "default",
  },
}

// viewport БЕЗ maximum-scale=1 — требование доступности (Фаза 3).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#4A5335",
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html
      lang="ru"
      data-mode="light"
      className={`${playfair.variable} ${inter.variable}`}
    >
      <body className="font-body bg-bg text-ink antialiased">
        <JsonLd data={organizationJsonLd()} />
        <JsonLd data={websiteJsonLd()} />
        <PwaRegister />
        <main className="relative">{props.children}</main>
      </body>
    </html>
  )
}
