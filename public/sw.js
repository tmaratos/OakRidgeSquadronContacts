const PENDING_VCARD_CACHE = 'share-import-v1';
const PENDING_VCARD_KEY = 'pending-vcard-import';

function shareImportPathname(pathname) {
  return /\/share-import\/?$/.test(pathname);
}

function appRootFromPathname(pathname) {
  return pathname.replace(/\/share-import\/?$/, '/');
}

async function storePendingVCard(text) {
  if (!text || !text.includes('BEGIN:VCARD')) return false;
  const cache = await caches.open(PENDING_VCARD_CACHE);
  await cache.put(PENDING_VCARD_KEY, new Response(text, {
    headers: { 'Content-Type': 'text/vcard; charset=utf-8' },
  }));
  return true;
}

async function handleShareImport(request) {
  const url = new URL(request.url);
  let vcardText = '';

  try {
    const formData = await request.formData();
    const file = formData.get('contact');
    if (file && typeof file.text === 'function') {
      vcardText = await file.text();
    }
    if (!vcardText) {
      const sharedText = formData.get('text');
      if (typeof sharedText === 'string') vcardText = sharedText;
    }
  } catch {
    vcardText = '';
  }

  const stored = await storePendingVCard(vcardText);
  const redirectUrl = `${url.origin}${appRootFromPathname(url.pathname)}#/directory${
    stored ? '?import=vcard' : ''
  }`;

  return Response.redirect(redirectUrl, 303);
}

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method === 'POST' && shareImportPathname(url.pathname)) {
    event.respondWith(handleShareImport(event.request));
  }
});
