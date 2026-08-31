self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

// Sin estrategia de cache agresiva: el sitio es SSR dinámico (TanStack Start),
// cachear rutas HTML rompería contenido siempre-fresco (noticias, calendario, etc.).
// Este service worker existe principalmente para habilitar instalabilidad + push.

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    // payload no-JSON, ignorar
  }
  const title = payload.title || "EES N.º 6 Lobos";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: payload.body || "",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: payload.url || "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(self.clients.openWindow(url));
});
