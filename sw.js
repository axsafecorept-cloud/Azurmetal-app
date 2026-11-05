// Service worker do app Azurmetal — guarda o essencial para funcionar sem internet.
const CACHE_NAME = "azurmetal-cache-v6";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-512-maskable.png"
];

// Instala e guarda o essencial do app em cache
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// Limpa caches antigas quando uma nova versão do app é publicada
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Estratégia: tenta a rede primeiro (para pegar atualizações), usa a cache se offline
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    // no-cache: pergunta sempre ao servidor se há versão nova (evita ficar preso na antiga)
    fetch(event.request, { cache: "no-cache" })
      .then((response) => {
        // Guarda uma cópia atualizada na cache sempre que a rede responde
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, copy).catch(() => {});
        });
        return response;
      })
      .catch(() =>
        // Sem internet: usa o que já está guardado
        caches.match(event.request).then((cached) => {
          if (cached) return cached;
          // Se pediu uma página e não há nada em cache, mostra o app mesmo assim
          if (event.request.mode === "navigate") {
            return caches.match("./index.html");
          }
        })
      )
  );
});
