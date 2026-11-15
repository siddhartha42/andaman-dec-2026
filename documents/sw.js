'use strict';
const CACHE='andaman-document-wallet-v1';
self.addEventListener('install',event=>{self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil(self.clients.claim());});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url),scope=new URL(self.registration.scope);
  const shared=['../assets/navigation.css','../assets/navigation.js'].map(path=>new URL(path,scope).href);
  if(url.origin!==scope.origin||(!url.pathname.startsWith(scope.pathname)&&!shared.includes(url.origin+url.pathname)))return;
  event.respondWith((async()=>{
    try{return await fetch(event.request);}
    catch(error){
      const cache=await caches.open(CACHE);
      const key=event.request.mode==='navigate'?new URL('index.html',scope).href:url.origin+url.pathname;
      const saved=await cache.match(key);
      if(saved)return saved;
      return new Response('This document wallet has not been saved for offline access in this browser. Reconnect and choose Save for offline.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
    }
  })());
});
