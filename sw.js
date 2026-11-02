const CACHE_NAME = 'agenda-now-v2';
const CDN_CACHE = 'agenda-cdn-v2';

// Önbelleğe alınacak dış kaynaklar (Uygulamanın hızlı açılması ve internetsiz çalışması için)
const CDN_URLS = [
  'https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4',
  'https://unpkg.com/lucide@0.454.0',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Sora:wght@600;700;800&display=swap'
];

// 1. Kurulum Aşaması
self.addEventListener('install', (e) => {
  self.skipWaiting(); // Yeni sürümü hemen aktif et
  e.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then((cache) => cache.addAll(['./', './index.html'])),
      caches.open(CDN_CACHE).then((cache) => cache.addAll(CDN_URLS))
    ]).catch(err => console.log('Önbelleğe alma hatası:', err))
  );
});

// 2. Aktivasyon Aşaması (Eski sürümleri temizle)
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== CDN_CACHE) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. İstekleri Yakalama (Fetch Stratejisi)
self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);

  // A) Sayfa Gezinmeleri (HTML): İnternet varsa yeni sürümü çek (Network First), yoksa önbellekten aç
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then((res) => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        return res;
      }).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // B) İkonlar ve Manifest: Önce önbelleğe bak (Cache First)
  if (url.pathname.match(/icon-192\.png|icon-512\.png|apple-touch-icon\.png|manifest\.webmanifest/)) {
    e.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(req).then((hit) => {
          if (hit) return hit;
          return fetch(req).then((res) => {
            cache.put(req, res.clone());
            return res;
          }).catch(() => new Response('', { status: 504 }));
        });
      })
    );
    return;
  }

  // C) Dış Kaynaklar (Tailwind, Lucide, Fontlar, html2canvas): Eskiyi göster, arkada güncelle (Stale While Revalidate)
  if (url.origin.match(/jsdelivr\.net|unpkg\.com|cdnjs\.cloudflare\.com|fonts\.(googleapis|gstatic)\.com/)) {
    e.respondWith(
      caches.open(CDN_CACHE).then((cache) => {
        return cache.match(req).then((hit) => {
          const fetchPromise = fetch(req).then((res) => {
            cache.put(req, res.clone());
            return res;
          }).catch(() => hit);
          return hit || fetchPromise;
        });
      })
    );
    return;
  }
});