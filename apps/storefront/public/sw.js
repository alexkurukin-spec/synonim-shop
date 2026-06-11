/**
 * Service worker СИНОНИМ (PWA) — намеренно консервативный:
 *  - предкэшируются только оффлайн-страница и иконки;
 *  - навигация — network-first c фолбэком на /offline.html;
 *  - API (/store/), админка и кросс-доменные запросы НЕ перехватываются,
 *    чтобы не закэшировать цены/корзину/персональные данные.
 */
const CACHE = "synonim-pwa-v1"
const PRECACHE = [
  "/offline.html",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE))
  )
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  )
})

self.addEventListener("fetch", (event) => {
  const req = event.request
  if (req.method !== "GET") return

  const url = new URL(req.url)
  // Только свой origin; API и медиа Medusa не трогаем.
  if (url.origin !== self.location.origin) return
  if (url.pathname.startsWith("/store/") || url.pathname.startsWith("/admin")) return

  // Навигация: сеть → оффлайн-заглушка.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() => caches.match("/offline.html"))
    )
    return
  }

  // Статика (_next/static, иконки, шрифты): cache-first.
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/logo/")
  ) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            const copy = res.clone()
            caches.open(CACHE).then((cache) => cache.put(req, copy))
            return res
          })
      )
    )
  }
})
