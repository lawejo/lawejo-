// Service worker til offline-brug.
// Sider: hent fra nettet og gem en kopi. Uden net vises den senest gemte kopi.
// Statiske filer (/_next/static) har unikke navne og hentes fra cachen først.
// Sider vist, mens private vaner er låst op (headeren x-lawejo-private), gemmes aldrig.

const PAGES = "lawejo-pages-v1";
const STATIC = "lawejo-static-v1";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== PAGES && k !== STATIC).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ??
          fetch(request).then((response) => {
            const copy = response.clone();
            caches.open(STATIC).then((cache) => cache.put(request, copy));
            return response;
          }),
      ),
    );
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.headers.has("x-lawejo-private")) {
            caches.open(PAGES).then((cache) => cache.delete(url.pathname));
          } else if (response.ok && !response.redirected) {
            const copy = response.clone();
            caches.open(PAGES).then((cache) => cache.put(url.pathname, copy));
          }
          return response;
        })
        .catch(() =>
          caches
            .match(url.pathname)
            .then(
              (cached) =>
                cached ??
                new Response("<meta charset=utf-8><p>Du er offline, og siden er ikke gemt endnu.</p>", {
                  headers: { "Content-Type": "text/html; charset=utf-8" },
                }),
            ),
        ),
    );
  }
});
