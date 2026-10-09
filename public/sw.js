// ============================================================
//  Service Worker mínimo — IPSFA Ventas (vista móvil)
//  Propósito: que Chrome/Android permita "Agregar a pantalla
//  de inicio" (PWA instalable). NO cachea la API: los datos
//  (clientes, inventario, cotizaciones) siempre van a la red,
//  porque un precio o un stock viejo causa ventas erradas.
// ============================================================
const VERSION = 'ipsfa-movil-v1';

self.addEventListener('install', (e) => {
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(self.clients.claim());
});

// Passthrough: todo va directo a la red (sin caché).
self.addEventListener('fetch', (e) => {
    // no interceptar: comportamiento por defecto del navegador
});
