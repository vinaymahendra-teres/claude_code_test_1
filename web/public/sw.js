// Tiered Cake Company service worker.
//
// Caches the static asset shell so repeat visits and offline-ish moments
// (in-and-out apartment 4G) don't re-download fonts, JS chunks, and CSS.
// HTML stays network-first so Server Component updates land instantly
// when connectivity returns; we never serve a stale order-detail page.
//
// API / auth / server actions always bypass the cache — those are
// mutations or auth flows that must hit the network.

const CACHE_VERSION = "tcc-v1";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;
const HTML_CACHE = `${CACHE_VERSION}-html`;

const ALLOWED_CACHES = new Set([STATIC_CACHE, IMAGE_CACHE, HTML_CACHE]);

self.addEventListener("install", (event) => {
  // Take over as soon as we're installed so the first online-load gets
  // the benefit of the cache, not the visit after.
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      // Drop caches from older versions so a redeploy with a new
      // CACHE_VERSION doesn't keep stale chunks alive forever.
      await Promise.all(keys.filter((k) => !ALLOWED_CACHES.has(k)).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Mutations and SSR data go straight to the network. Never cache POSTs.
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Only handle same-origin and Supabase Storage public images.
  const sameOrigin = url.origin === self.location.origin;
  const isSupabaseImage =
    url.hostname.endsWith(".supabase.co") &&
    url.pathname.startsWith("/storage/v1/object/public/");
  if (!sameOrigin && !isSupabaseImage) return;

  // API + auth + server actions: bypass.
  if (sameOrigin && (url.pathname.startsWith("/api/") || url.pathname.startsWith("/_next/data/")))
    return;

  // Content-hashed static assets — safe to cache forever.
  if (sameOrigin && url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(req, STATIC_CACHE));
    return;
  }

  // next/image transformations + Supabase Storage uploads — stale-while-revalidate.
  if (
    isSupabaseImage ||
    (sameOrigin && url.pathname.startsWith("/_next/image"))
  ) {
    event.respondWith(staleWhileRevalidate(req, IMAGE_CACHE));
    return;
  }

  // Public assets in /public (logo, manifest, etc.)
  if (sameOrigin && /\.(png|jpg|jpeg|svg|ico|webmanifest)$/.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(req, IMAGE_CACHE));
    return;
  }

  // HTML / RSC payloads — network-first with cache fallback so a brief
  // dropout doesn't blank a screen the operator was just on.
  if (req.mode === "navigate" || req.headers.get("accept")?.includes("text/html")) {
    event.respondWith(networkFirst(req, HTML_CACHE));
    return;
  }
});

async function cacheFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  if (cached) return cached;
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch (e) {
    if (cached) return cached;
    throw e;
  }
}

async function staleWhileRevalidate(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  const fetchPromise = fetch(req)
    .then((res) => {
      if (res.ok) cache.put(req, res.clone());
      return res;
    })
    .catch(() => cached);
  return cached || fetchPromise;
}

async function networkFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch (e) {
    const cached = await cache.match(req);
    if (cached) return cached;
    throw e;
  }
}
