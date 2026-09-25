import 'server-only';

// IndexNow lets us push changed URLs to Bing/Yandex (and anything else on the
// shared endpoint) instead of waiting for them to recrawl on their own schedule.
// The key file at public/{INDEXNOW_KEY}.txt is how they verify we own the domain.
const INDEXNOW_KEY = 'b51ca9dd572f5d69e4afa5f1ebc1bf8d';
const INDEXNOW_HOST = 'www.founderflow.space';
const INDEXNOW_KEY_LOCATION = `https://${INDEXNOW_HOST}/${INDEXNOW_KEY}.txt`;

/**
 * Fire-and-forget submission of changed URLs to IndexNow. Never throws — a
 * failed/slow ping to a third-party indexing endpoint should never block or
 * fail the actual admin action (creating/updating an entry) that triggered it.
 */
export function submitUrlsToIndexNow(urls: string[]): void {
  const validUrls = urls.filter(Boolean);
  if (validUrls.length === 0) return;

  fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host: INDEXNOW_HOST,
      key: INDEXNOW_KEY,
      keyLocation: INDEXNOW_KEY_LOCATION,
      urlList: validUrls,
    }),
  }).catch((error) => {
    console.error('⚠️ IndexNow submission failed (non-blocking):', error);
  });
}
