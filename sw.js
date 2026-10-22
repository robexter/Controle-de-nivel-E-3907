/* V2 — rede primeiro + atualização explícita; compatível com GitHub Pages */
const CACHE='e3907-nivel-concept-v2-20261021';
const CORE=['./','./index.html','./styles.css','./content.js','./app.js','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png','./assets/malha-original.png','./assets/malha-ampliada.png'];
self.addEventListener('install', event => {event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)))});
self.addEventListener('activate', event=>{event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))),self.clients.claim()]))});
self.addEventListener('message',event=>{if(event.data && event.data.type==='SKIP_WAITING')self.skipWaiting()});
self.addEventListener('fetch', event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==self.location.origin||url.protocol==='chrome-extension:')return;
 event.respondWith(fetch(event.request).then(response=>{
  if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(event.request,copy)).catch(()=>{}))}
  return response;
 }).catch(()=>caches.match(event.request).then(r=>r||((event.request.mode==='navigate')?caches.match('./index.html'):Response.error()))));
});
