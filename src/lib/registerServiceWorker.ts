const CACHEABLE_LINK_RELS = ['stylesheet', 'modulepreload', 'preload', 'manifest', 'icon'];

function isSameOriginUrl(value: string): boolean {
  try {
    return new URL(value, window.location.href).origin === window.location.origin;
  } catch {
    return false;
  }
}

function addUrl(target: Set<string>, value: string | null | undefined) {
  if (!value || !isSameOriginUrl(value)) {
    return;
  }

  target.add(new URL(value, window.location.href).toString());
}

export function collectCurrentPageAssetUrls(): string[] {
  const urls = new Set<string>();

  document.querySelectorAll<HTMLScriptElement>('script[src]').forEach((script) => {
    addUrl(urls, script.src);
  });

  document.querySelectorAll<HTMLLinkElement>('link[href]').forEach((link) => {
    if (CACHEABLE_LINK_RELS.some((rel) => link.relList.contains(rel))) {
      addUrl(urls, link.href);
    }
  });

  performance.getEntriesByType('resource').forEach((entry) => {
    if (entry.name.includes('/assets/')) {
      addUrl(urls, entry.name);
    }
  });

  return [...urls];
}

function postCurrentAssetsToServiceWorker(registration: ServiceWorkerRegistration) {
  const worker = registration.active ?? navigator.serviceWorker.controller;

  if (!worker) {
    return;
  }

  const urls = collectCurrentPageAssetUrls();

  if (urls.length === 0) {
    return;
  }

  worker.postMessage({ type: 'CACHE_URLS', urls });
}

export function registerServiceWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', () => {
    const basePath = import.meta.env.BASE_URL;

    navigator.serviceWorker
      .register(`${basePath}sw.js`, { scope: basePath })
      .then((registration) => {
        void navigator.serviceWorker.ready.then(postCurrentAssetsToServiceWorker);

        registration.addEventListener('updatefound', () => {
          registration.installing?.addEventListener('statechange', () => {
            if (registration.active) {
              postCurrentAssetsToServiceWorker(registration);
            }
          });
        });
      })
      .catch((error: unknown) => {
        console.warn('PWA service worker registration failed.', error);
      });
  });
}
