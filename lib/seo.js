// Shared SEO helpers.
//
// These exist because metadata is authored in the admin panel and stored in
// MySQL, so bad values (over-long titles, stale canonical URLs, pasted <h1>
// tags) reach the page unless they are normalised at render time.

export const SITE_URL = 'https://promptking.in';

const TITLE_MAX = 60;
const DESCRIPTION_MAX = 155;

/** Trim to `max` chars on a word boundary, without cutting mid-word. */
function clamp(text, max) {
  const value = String(text || '').replace(/\s+/g, ' ').trim();
  if (value.length <= max) return value;
  const cut = value.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s\-–—:,.|]+$/, '');
}

/**
 * Normalise a title: collapse a doubled " - PromptKing" suffix (the admin
 * panel stores some meta_titles with the brand already appended, and the page
 * appends it again) and clamp to the SERP display limit.
 */
export function seoTitle(title, { brand = 'PromptKing' } = {}) {
  let value = String(title || '').replace(/\s+/g, ' ').trim();
  const suffix = new RegExp(`(?:\\s*[-–|]\\s*${brand})+$`, 'i');
  const hadSuffix = suffix.test(value);
  value = value.replace(suffix, '');
  const clamped = clamp(value, hadSuffix ? TITLE_MAX - brand.length - 3 : TITLE_MAX);
  return hadSuffix ? `${clamped} - ${brand}` : clamped;
}

/** Clamp a meta description to the SERP display limit. */
export function seoDescription(description) {
  return clamp(description, DESCRIPTION_MAX);
}

/**
 * Resolve a canonical URL.
 *
 * `blogs.canonical_url` holds values from an older `/blog/<slug>` URL scheme
 * that now 404s. Rewriting them here means a stale database row can no longer
 * point Google at a dead URL, regardless of what the admin panel saves.
 */
export function resolveCanonical(stored, fallbackPath) {
  const fallback = `${SITE_URL}${fallbackPath.startsWith('/') ? '' : '/'}${fallbackPath}`;
  const raw = String(stored || '').trim();
  if (!raw) return fallback;

  let url;
  try {
    url = new URL(raw, SITE_URL);
  } catch {
    return fallback;
  }

  // Never let a stored canonical point off-domain.
  if (url.hostname.replace(/^www\./, '') !== 'promptking.in') return fallback;

  // Legacy scheme: /blog/<slug> articles now live at /article/<slug>.
  const legacyArticle = url.pathname.match(/^\/blog\/(.+)$/);
  if (legacyArticle) url.pathname = `/article/${legacyArticle[1]}`;

  const path = url.pathname.replace(/\/+$/, '');
  return `${SITE_URL}${path}`;
}

/**
 * Demote <h1> to <h2> inside admin-authored HTML.
 *
 * Prompt and article bodies are pasted in from external editors and routinely
 * contain an <h1> repeating the page title, which produces two or three <h1>
 * elements per page. The page component owns the single real <h1>.
 */
export function demoteHeadings(html) {
  if (!html) return html;
  return String(html)
    .replace(/<h1(\s[^>]*)?>/gi, (_m, attrs) => `<h2${attrs || ''}>`)
    .replace(/<\/h1>/gi, '</h2>');
}

/** Drop null/undefined/empty values so they never reach JSON-LD output. */
export function cleanSchema(node) {
  if (Array.isArray(node)) {
    const items = node.map(cleanSchema).filter((v) => v !== undefined);
    return items.length ? items : undefined;
  }
  if (node && typeof node === 'object') {
    const out = {};
    for (const [key, value] of Object.entries(node)) {
      const cleaned = cleanSchema(value);
      if (cleaned !== undefined) out[key] = cleaned;
    }
    return Object.keys(out).length ? out : undefined;
  }
  if (node === null || node === undefined || node === '') return undefined;
  return node;
}
