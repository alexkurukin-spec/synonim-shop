import { getBaseURL } from "@lib/util/env"
import { inter, playfair } from "@lib/fonts"
import { Metadata } from "next"
import "styles/globals.css"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html
      lang="ru"
      data-mode="light"
      className={`${playfair.variable} ${inter.variable}`}
    >
      <body className="font-body bg-bg text-ink antialiased">
        <main className="relative">{props.children}</main>
      </body>
    </html>
  )
}
