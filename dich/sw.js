// Service worker riêng cho app Phiên Dịch Trực Tiếp (/dich/), scope chỉ trong thư mục này —
// không đụng tới AIHub, Hợp Tác hay bất kỳ trang nào khác trong site.
const CACHE_NAME = 'dich-shell-v3';
const SHELL_FILES = [
  './',
  './index.html',
  './manifest.json',
  '../img/dich-icon-192.png',
  '../img/dich-icon-512.png',
  '../img/dich-apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Chỉ cache-first cho file thuộc app shell (cùng gốc, trong scope này).
// Mọi request khác (CDN WebLLM, model AI, API bên ngoài...) để trình duyệt xử lý bình thường,
// tránh can thiệp vào cơ chế cache riêng (IndexedDB/Cache API) của WebLLM.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        }
        return res;
      }).catch(() => cached);
    })
  );
});
