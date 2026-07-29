// Normalizes an AdSense publisher/client ID into the exact form AdSense
// expects on `data-ad-client` and the account meta tag: `ca-pub-XXXXXXXXXXXX`.
//
// The value is admin-editable (stored in DB), so it can arrive malformed:
//   "pub-2762946314678354 "  -> missing "ca-" prefix + trailing space
//   "2762946314678354"       -> bare numeric ID
//   "ca-pub-2762946314678354" -> already correct
// A malformed client ID makes every manual <ins> unfillable while Auto Ads
// (which use the correctly-formed <script> client) keep working.
export function normalizeAdClient(raw) {
  if (!raw) return '';
  const c = String(raw).trim();
  if (!c) return '';
  if (c.startsWith('ca-pub-')) return c;
  if (c.startsWith('pub-')) return `ca-${c}`;
  if (/^\d+$/.test(c)) return `ca-pub-${c}`;
  return c;
}

export default normalizeAdClient;
