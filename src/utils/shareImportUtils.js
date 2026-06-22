const PENDING_VCARD_CACHE = 'share-import-v1';
const PENDING_VCARD_KEY = 'pending-vcard-import';

export async function consumePendingSharedVCard() {
  if (typeof caches === 'undefined') return null;

  try {
    const cache = await caches.open(PENDING_VCARD_CACHE);
    const response = await cache.match(PENDING_VCARD_KEY);
    if (!response) return null;

    const text = await response.text();
    await cache.delete(PENDING_VCARD_KEY);
    return text || null;
  } catch {
    return null;
  }
}

export function registerShareImportServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    const swUrl = `${import.meta.env.BASE_URL}sw.js`;
    navigator.serviceWorker.register(swUrl).catch(() => {
      // Share target is optional; import still works via file picker and clipboard.
    });
  });
}
