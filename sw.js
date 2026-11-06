const CACHE_NAME = 'agenda-now-v4';
const CDN_CACHE = 'agenda-cdn-v4';

// Önbelleğe alınacak dış kaynaklar (index.html'in kullandığı adreslerle aynı olmalı)
const CDN_URLS = [
  'https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4.1.11',
  'https://cdn.jsdelivr.net/npm/lucide@0.454.0/dist/umd/lucide.min.js',
  'https://cdn.jsdelivr.net/npm/html2canvas-pro@2.3.3/dist/html2canvas-pro.min.js',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Sora:wght@600;700;800&display=swap'
];

// Yalnızca başarılı (veya opak dış kaynak) yanıtlar önbelleğe yazılır
const cacheable = (res) => res && (res.ok || res.type === 'opaque');

// 1. Kurulum Aşaması (her kaynak ayrı eklenir; biri hata verirse diğerleri yine kaydedilir)
self.addEventListener('install', (e) => {
  self.skipWaiting(); // Yeni sürümü hemen aktif et
  e.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then((cache) =>
        Promise.all(['./', './index.html'].map((u) => cache.add(u).catch(() => {})))
      ),
      caches.open(CDN_CACHE).then((cache) =>
        Promise.all(CDN_URLS.map((u) => cache.add(u).catch((err) => console.log('Önbelleğe alma hatası:', u, err))))
      )
    ])
  );
});

// 2. Aktivasyon Aşaması (Eski önbellek sürümlerini temizle; ders verisine dokunmaz)
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== CDN_CACHE) {
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

// 3. İstekleri Yakalama (Fetch Stratejisi)
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // A) Sayfa Gezinmeleri (HTML): İnternet varsa yeni sürümü çek (Network First), yoksa önbellekten aç
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then((res) => {
        if (cacheable(res)) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        }
        return res;
      }).catch(() => caches.match(req).then((hit) => hit || caches.match('./index.html')))