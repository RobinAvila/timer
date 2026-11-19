// Service worker del sorteo: guarda todo para que abra sin internet.
// Primero intenta la red (para recibir actualizaciones) con un límite de 3 s;
// si falla o no hay conexión, usa la copia guardada.
var CACHE = 'sorteo-v2';
var ASSETS = [
  './', './index.html', './logo-blanco.svg', './fonendo.png', './icon.png',
  './fonts/montserrat-latin-500-normal.woff2', './fonts/montserrat-latin-500-italic.woff2',
  './fonts/montserrat-latin-700-normal.woff2', './fonts/montserrat-latin-800-normal.woff2',
  './fonts/anton-latin-400-normal.woff2'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE)
      .then(function (c) { return c.addAll(ASSETS); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.filter(function (k) { return k !== CACHE; })
          .map(function (k) { return caches.delete(k); }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;

  var red = new Promise(function (resolve, reject) {
    var timer = setTimeout(function () { reject(new Error('timeout')); }, 3000);
    fetch(req, { cache: 'no-cache' }).then(function (res) {
      clearTimeout(timer);
      if (res && res.ok) {
        var copia = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copia); });
      }
      resolve(res);
    }, function (err) { clearTimeout(timer); reject(err); });
  });

  e.respondWith(
    red.catch(function () {
      return caches.match(req).then(function (hit) {
        return hit || caches.match('./index.html');
      });
    })
  );
});
