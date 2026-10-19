/*
 * sw.js - Service worker
 *
 * Gorevi: app dosyalarini telefona kaydetmek. Boylece app internet
 * olmadan da acilir (Bluetooth icin internet zaten gerekmiyor).
 *
 * Calisma mantigi:
 *   - Ilk acilista DOSYALAR listesini telefona kaydeder (install).
 *   - Sonraki acilislarda dosyayi once kayittan verir (hizli, internetsiz),
 *     arkada internetten yenisini alip kaydi gunceller.
 *
 * App'i guncelledigimizde SURUM'u artiririz; eski kayit silinir.
 */
const SURUM = "adim-sayaci-v1";
const DOSYALAR = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
];

self.addEventListener("install", (olay) => {
  olay.waitUntil(caches.open(SURUM).then((c) => c.addAll(DOSYALAR)));
  self.skipWaiting();
});

self.addEventListener("activate", (olay) => {
  olay.waitUntil(
    caches.keys().then((adlar) =>
      Promise.all(adlar.filter((a) => a !== SURUM).map((a) => caches.delete(a)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (olay) => {
  if (olay.request.method !== "GET") return;
  olay.respondWith(
    caches.open(SURUM).then(async (kayit) => {
      const eski = await kayit.match(olay.request);
      const yeni = fetch(olay.request)
        .then((cevap) => {
          if (cevap.ok) kayit.put(olay.request, cevap.clone());
          return cevap;
        })
        .catch(() => eski);
      return eski || yeni;
    })
  );
});
