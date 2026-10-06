// Modo offline de Choxi Juegos.
// Páginas, código y juegos.json: primero busca la versión nueva en internet (así los cambios
// llegan solos) y, si no hay conexión, usa la guardada. Íconos: usa la copia guardada.
// Los pings a los juegos de Render son de otro dominio: este archivo no los toca.
const CACHE = "choxihub";
const ARCHIVOS = [
  "./", "index.html", "css/estilos.css", "js/catalogo.js", "js/app.js",
  "juegos.json", "marca.json", "manifest.webmanifest",
  "icons/icono.svg", "icons/icon-180.png", "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png",
  "icons/atajo-cah.png", "icons/atajo-uno.png", "icons/atajo-flip7.png", "icons/atajo-monopoly.png",
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      // Solo borra cachés viejas de esta app: el dominio es compartido con lobos y truco.
      .then(ks => Promise.all(ks.filter(k => k !== CACHE && k.startsWith("choxihub")).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  const fijo = /\.(png|svg)$/.test(new URL(req.url).pathname);

  if (fijo) {
    e.respondWith(caches.match(req).then(g => g || fetch(req)));
    return;
  }
  e.respondWith(
    fetch(req, { cache: "no-cache" })
      .then(resp => {
        if (resp.ok) { const copia = resp.clone(); caches.open(CACHE).then(c => c.put(req, copia)); }
        return resp;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }).then(g => g || caches.match("index.html")))
  );
});
