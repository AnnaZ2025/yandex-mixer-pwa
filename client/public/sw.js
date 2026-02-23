/**
 * Service Worker для AI Микшер PWA
 * Стратегия: Cache First для статики, Network First для API
 */

const CACHE_NAME = "ai-mixer-v1";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
];

// Install: кэшируем базовые ресурсы
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: удаляем старые кэши
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: стратегия по типу запроса
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // API запросы (к бэкенду на ngrok) — Network Only, без кэша
  if (
    url.hostname.includes("ngrok") ||
    url.hostname.includes("127.0.0.1") ||
    url.pathname.startsWith("/api/")
  ) {
    return; // браузер сам обработает
  }

  // Статические ресурсы — Cache First
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        // Кэшируем только успешные GET-запросы
        if (
          response.ok &&
          event.request.method === "GET" &&
          !url.pathname.includes("analytics")
        ) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
        }
        return response;
      });
    })
  );
});
