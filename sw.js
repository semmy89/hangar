// Service worker: salva l'app sul telefono per usarla offline.
// Cambia VERSIONE ogni volta che aggiorni l'app, cosi' i telefoni scaricano la nuova.
const VERSIONE = "hangar-20261117-001";
const FILE = ["./", "index.html", "manifest.webmanifest", "icona-192.png", "icona-512.png", "icona-180.png"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSIONE).then(c => c.addAll(FILE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSIONE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  // Pagina: prima la rete (per gli aggiornamenti), se manca internet la copia salvata
  if (e.request.mode === "navigate") {
    e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(VERSIONE).then(x => x.put("index.html", c)); return r; })
      .catch(() => caches.match("index.html")));
    return;
  }
  // Tutto il resto (icone, caratteri di Google Fonts): copia salvata, altrimenti rete e salvataggio
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(r => {
    if (r && (r.ok || r.type === "opaque") && (url.origin === location.origin || url.hostname.endsWith("gstatic.com") || url.hostname.endsWith("googleapis.com"))) {
      const c = r.clone(); caches.open(VERSIONE).then(x => x.put(e.request, c));
    }
    return r;
  })));
});
