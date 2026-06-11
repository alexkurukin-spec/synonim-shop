import { MetadataRoute } from "next"
import { SITE_NAME, SITE_TAGLINE } from "@lib/constants/seo"

/**
 * Web App Manifest (PWA): витрина устанавливается как приложение
 * (Chrome/Android — «Установить приложение», iOS — «На экран Домой»).
 * Next.js отдаёт его по /manifest.webmanifest и сам подключает в <head>.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} — ${SITE_TAGLINE}`,
    short_name: SITE_NAME,
    description:
      "Украшения из серебра 925 с выращенными бриллиантами. Каталог, корзина, оформление заказа.",
    lang: "ru",
    start_url: "/ru",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#FBF8F1",
    theme_color: "#4A5335",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  }
}
