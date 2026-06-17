// Aurora · Service Worker
// Versão mínima com scaffold de Push Notification comentado.
// Para ativar push: descomentar handlers e configurar VAPID keys via subscribe-push edge function.

const CACHE_NAME = "aurora-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

// --- Push Notification scaffold (inativo) ---
// Descomentar após configurar VAPID keys e conectar ao n8n send-push.
//
// self.addEventListener("push", (event) => {
//   const data = event.data?.json() ?? {};
//   const title = data.title ?? "Aurora";
//   const options = {
//     body: data.body ?? "",
//     icon: "/brand/aurora-favicon.svg",
//     badge: "/brand/aurora-favicon.svg",
//     data: { url: data.url ?? "/admin/pendentes" },
//   };
//   event.waitUntil(self.registration.showNotification(title, options));
// });
//
// self.addEventListener("notificationclick", (event) => {
//   event.notification.close();
//   event.waitUntil(
//     clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
//       const target = event.notification.data?.url ?? "/admin/pendentes";
//       for (const client of list) {
//         if (client.url.includes(target) && "focus" in client) return client.focus();
//       }
//       if (clients.openWindow) return clients.openWindow(target);
//     })
//   );
// });
