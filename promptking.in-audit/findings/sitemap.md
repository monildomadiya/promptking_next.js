# Sitemap — findings

`https://promptking.in/sitemap.xml` · valid `urlset` · 25,595 bytes · **128 `<loc>` entries**
Declared in `robots.txt`. All 128 URLs return HTTP 200.

Correctly 404: `/sitemap_index.xml`, `/sitemap-index.xml`, `/wp-sitemap.xml`.

## URL composition
| Section | URLs |
|---|---|
| `/prompt/*` | 102 |
| `/article/*` | 14 |
| `/category/*` | 2 |
| Static (`/`, `/about`, `/blog`, `/categories`, `/contact`, `/faq`, `/privacy`, `/terms`, `/disclaimer`, `/adsense-policy`) | 10 |

`<lastmod>`, `<changefreq>` and `<priority>` are all present, with sensible priority tiering
(`/` = 1.0, `/blog` and `/categories` = 0.7, `/about` and `/faq` = 0.5, `/contact` = 0.4,
`/privacy` = 0.3).

## Findings

### [CRITICAL] Sitemap submits 14 URLs whose canonical points elsewhere — to a 404
All 14 `/article/<slug>` entries canonical to `/blog/<slug>`, which returns 404. A sitemap should
only list canonical URLs. Whichever way the canonical conflict is resolved (see `technical.md`),
the sitemap must be regenerated to agree with it.

### [CRITICAL] Sitemap submits 2 soft-404 pages
`/category/chatgpt` and `/category/gemini-pro` render "Category Not Found" at HTTP 200. Exclude
categories with no prompts from the generator.

### [MEDIUM] Duplicate entry
`https://promptking.in/article/ai-image-prompt-engineering-guide` appears **twice**. This also
produces the duplicate-title finding in `onpage.md`.

### [MEDIUM] `lastmod` is the generation timestamp, not the modification date
All 128 entries share an identical value (`2026-07-30T07:33:23.968Z` — the moment of the request).
Google discounts `lastmod` entirely when it behaves this way, so the field is currently worthless.

Prerequisite: the `blogs` table has no `updated_at` column, and `published_at` is **NULL** on all
14 rows. Backfill real dates first.

### [MEDIUM] `changefreq` set to `daily` on the homepage
Combined with the always-now `lastmod`, this asserts a publishing cadence the site does not have
(102 prompts, no visible dates). `changefreq` is ignored by Google, so the practical cost is nil,
but it compounds the "Updated daily" overclaim documented in `content.md` and `geo.md`.

### [LOW] No image sitemap
693 images across 102 prompt pages, where the imagery *is* the product. Adding `<image:image>`
entries or a dedicated image sitemap opens a plausible Google Images traffic channel that is
currently unaddressed.

### [LOW] No `/blog` pagination surfaced
Only `/blog` itself is listed. If the article list ever paginates, those URLs need entries.

## Coverage gap
The crawl found **581 unique `/?search=<term>` URLs** linked from prompt pages that are not in the
sitemap. This is correct — they should not be there — but they are `index, follow` and crawlable.
See `technical.md`.
