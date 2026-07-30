# Technical SEO — 58/100

Crawl: 128 sitemap URLs, all HTTP 200. Raw-HTML extraction (pre-JS), 5 concurrent workers.

## What works
- HTTPS with `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`,
  `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- Host normalisation correct: `https://www.promptking.in/` → **308** → apex;
  `http://promptking.in/` → **301** → HTTPS
- Trailing-slash normalisation correct: `/faq/` → **308** → `/faq`
- Unknown URLs return a genuine **404** (`/this-page-does-not-exist-xyz`)
- `robots.txt` valid; `/api/admin/`, `/admin/`, `/admin-secure/` disallowed; sitemap declared
- `sitemap.xml` is a valid `urlset`; `sitemap_index.xml`, `sitemap-index.xml`, `wp-sitemap.xml` all correctly 404
- `<link rel="canonical">` on **128/128** pages
- `robots` meta = `index, follow` on 128/128; `lang="en"` on 128/128; viewport on 128/128
- Next.js ISR active (`x-nextjs-cache: HIT`, `s-maxage=60, stale-while-revalidate=31535940`)
- TTFB 456 ms median

## Findings

### [CRITICAL] Canonical points to a 404 on all 14 blog articles
| Page | Canonical target | Target status |
|---|---|---|
| `/article/ai-image-prompt-engineering-guide` | `/blog/ai-image-prompt-engineering-guide` | **404** |
| `/article/make-money-with-nano-banana-ai` | `/blog/make-money-with-nano-banana-ai` | **404** |
| `/article/gpt-image-2-vs-nano-banana-pro` | `/blog/gpt-image-2-vs-nano-banana-pro` | **404** |
| …11 more, same pattern | | |

Root cause is data, not code. `app/article/[slug]/page.jsx:32` reads
`blogData.canonical_url || 'https://promptking.in/article/' + slug` — the fallback is correct, but
the DB column wins. Confirmed via `/api/blog/ai-image-prompt-engineering-guide`:

```json
{"canonical_url": "https://promptking.in/blog/ai-image-prompt-engineering-guide"}
```

**Fix:** `UPDATE blogs SET canonical_url = NULL WHERE canonical_url LIKE '%/blog/%';`
Or, if `/blog/<slug>` has inbound links, add a permanent `/blog/:slug` → `/article/:slug` redirect
in `next.config.mjs` — but not both.

### [CRITICAL] Indexable soft 404s, submitted in the sitemap
`/category/chatgpt` and `/category/gemini-pro`:
- HTTP **200**
- `<title>Category Not Found - PromptKing</title>`
- `<h2>Category Not Found</h2>`, no `<h1>`
- `robots: index, follow`
- 81 words
- present in `sitemap.xml`

They canonical to the homepage, which limits the harm, but they should 404 and be excluded from
the sitemap.

### [HIGH] 581 crawlable `?search=` parameter URLs
Prompt-page tag chips link to `/?search=<term>`. 581 unique variants were discovered in the crawl —
a 4.5× inflation over the 128 real pages. Verified behaviour of `/?search=ChatGPT%20prompt`:
`<meta name="robots" content="index, follow">` with `<link rel="canonical" href="https://promptking.in">`.

Duplication is handled by the canonical; crawl budget is not.
**Fix:** `rel="nofollow"` on the chips, plus `Disallow: /*?search=` in `robots.txt`.

### [MEDIUM] Duplicate `<loc>` in sitemap
`https://promptking.in/article/ai-image-prompt-engineering-guide` appears twice in `sitemap.xml`.

### [MEDIUM] `lastmod` is the generation timestamp
All 128 entries carry an identical `lastmod` (`2026-07-30T07:33:23.968Z` — the moment the sitemap
was requested). Google discounts `lastmod` when it behaves this way.

Blocking issue: the `blogs` table has no `updated_at` column, and `published_at` is **NULL** on
all 14 rows, so real dates need backfilling before the sitemap can emit them.

### [MEDIUM] No `hreflang`
0/128 pages. Fine for an English-only site; note it if international expansion is planned.

### [LOW] `X-Powered-By: Next.js` exposed
Set `poweredByHeader: false` in `next.config.mjs`.
