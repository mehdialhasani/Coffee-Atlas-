// Coffee Atlas – Service Worker: hält die App offline bereit.
// Neue Version = neuer Name, dann wird beim nächsten Öffnen alles frisch geladen.
const V = 'coffee-atlas-a771ea4aa5ab';
const FILES = ["./", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png", "./apple-touch-icon.png"];
function clean(res) {  // umgeleitete Antworten neu verpacken (sonst lehnt Safari sie ab)
  if (!res.redirected) return Promise.resolve(res);
  return res.blob().then(b => new Response(b, { status: res.status, statusText: res.statusText, headers: res.headers }));
}
self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => Promise.all(FILES.map(u =>
    fetch(new Request(u, { cache: 'reload' })).then(r => { if (!r.ok) throw new Error(u + ' ' + r.status); return clean(r); }).then(r => c.put(u, r))
  ))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('coffee-atlas-') && k !== V).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin !== location.origin) return;
  if (r.mode === 'navigate') {
    e.respondWith(caches.match('./').then(c => c || fetch(r)));
    return;
  }
  e.respondWith(caches.match(r, { ignoreSearch: true }).then(c => c || fetch(r).then(res => {
    if (res.ok && !res.redirected) { const cp = res.clone(); caches.open(V).then(ca => ca.put(r, cp)); }
    return res;
  })));
});
