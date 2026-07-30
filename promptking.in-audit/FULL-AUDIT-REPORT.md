# PromptKing.in — Full SEO Audit

**Audited:** 2026-07-30 · **Pages crawled:** 128 (all sitemap URLs, all HTTP 200)
**Business type:** Content library / publisher (free AI prompt directory, AdSense-monetised)
**Stack:** Next.js 16.2.9 on nginx/Ubuntu, MySQL, Cloudinary images

## SEO Health Score: 59 / 100

| Category | Weight | Score | Weighted |
|---|---|---|---|
| Technical SEO | 22% | 58 | 12.8 |
| Content Quality | 23% | 55 | 12.7 |
| On-Page SEO | 20% | 62 | 12.4 |
| Schema / Structured Data | 10% | 68 | 6.8 |
| Performance (CWV) | 10% | 35 | 3.5 |
| AI Search Readiness | 10% | 70 | 7.0 |
| Images | 5% | 70 | 3.5 |
| **Total** | | | **58.6 → 59** |

---

## Executive Summary

The technical foundation is genuinely good — clean HTTPS with HSTS preload, correct security
headers, correct `www`/`http`/trailing-slash redirects, a valid sitemap, schema on 100% of
pages, and **alt text on all 693 images** (rare, and worth keeping). Server-side rendering
means content is visible to crawlers and AI bots without JavaScript.

Three things are actively costing you traffic right now.

### Top 5 critical issues

1. **Every blog article canonicalises to a 404.** All 14 `/article/<slug>` pages emit
   `<link rel="canonical" href="https://promptking.in/blog/<slug>">`, and every one of those
   `/blog/<slug>` URLs returns **HTTP 404**. Google is being told the real page lives at a
   URL that does not exist. This blocks indexing of your entire blog.
2. **The category system is dead in production.** `/categories` renders "No categories found",
   and `/category/chatgpt` + `/category/gemini-pro` render "Category Not Found" while returning
   **HTTP 200** with `index, follow` — classic soft 404s, and both are listed in the sitemap.
3. **First Contentful Paint measured at ~7.9 s.** The homepage ships 440 KB of HTML, 177 inline
   scripts (338 KB), 189 requests, and pulls a **286 KB `/api/get_data`** payload client-side
   containing all 102 prompts just to render the first 16.
4. **`/faq` publishes FAQPage schema with 16 `acceptedAnswer` entries, but the answers are not
   in the rendered HTML** (page is 153 words total). Google requires FAQ answers to be visible
   — this risks losing the rich result and, at worst, a structured-data manual action.
5. **Site-wide factual overclaims.** Meta descriptions, body copy and `llms.txt` all state
   "1,000+ prompts" and "50+ categories". The API returns **102 prompts and 2 categories**
   (both broken). This is an E-E-A-T and AI-citation liability.

### Top 5 quick wins

1. Clear the stale `canonical_url` column in the `blogs` table (or `301` `/blog/*` → `/article/*`) — unblocks 14 articles.
2. Add an `<h1>` to the homepage — it currently has **zero**.
3. Trim 16 titles over 70 chars (longest is 100) and 35 meta descriptions over 160 chars (longest is 201).
4. Fix 19 pages that render 2–3 `<h1>` tags — 11 of them repeat the *same* text three times.
5. Convert the three preloaded Outfit `.ttf` fonts (55 KB each) to `.woff2` (~20 KB each) and remove the duplicate preload tags.

---

## Technical SEO — 58/100

### What works
- HTTPS with `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` all set
- `https://www.promptking.in/` → `308` → apex; `http://` → `301` → HTTPS; `/faq/` → `308` → `/faq`
- Unknown URLs correctly return **404** (not soft 200)
- `robots.txt` valid, admin paths disallowed, sitemap declared
- Sitemap `/sitemap.xml` valid `urlset`, all 128 URLs return 200, canonical tag present on 100% of pages
- `index, follow` + `lang="en"` + viewport on 100% of pages

### Findings

**[CRITICAL] Canonical tags point to 404 URLs on all 14 blog articles**
`/article/ai-image-prompt-engineering-guide` canonicals to `/blog/ai-image-prompt-engineering-guide`
→ HTTP 404. Verified for 3 slugs, and the pattern holds for all 14. The code in
`app/article/[slug]/page.jsx:32` correctly falls back to `/article/${slug}`, but
`blogData.canonical_url` from MySQL contains the stale `/blog/` scheme and wins.
*Fix:* `UPDATE blogs SET canonical_url = NULL;` (the fallback is correct), or add `/blog/:slug` → `/article/:slug` 301s in `next.config.mjs`.

**[CRITICAL] Soft 404s indexable and in the sitemap**
`/category/chatgpt` and `/category/gemini-pro` return HTTP 200, title "Category Not Found -
PromptKing", `robots: index, follow`, and are both in `sitemap.xml`. They do canonical to the
homepage, which limits the damage, but they should not be served or submitted at all.
*Fix:* return a real 404 when the category has no prompts; drop empty categories from the sitemap.

**[HIGH] 581 crawlable `?search=` parameter URLs**
Prompt pages link to `/?search=<term>` tag chips — 581 unique variants discovered across the
crawl. They correctly canonical to `https://promptking.in`, but they are `index, follow` and
crawlable, burning crawl budget on a 128-page site.
*Fix:* add `rel="nofollow"` to search chips, `Disallow: /*?search=` in robots.txt, or emit `noindex` when `?search` is present.

**[MEDIUM] Duplicate `<loc>` in sitemap**
`https://promptking.in/article/ai-image-prompt-engineering-guide` appears twice.

**[MEDIUM] `lastmod` is the sitemap generation timestamp, not the content modification date**
Every one of the 128 entries carries an identical `lastmod` (`2026-07-30T07:33:23.968Z`, i.e. "now").
Google discounts `lastmod` entirely when it behaves this way.
*Fix:* emit the row's real modification date. Note the `blogs` table has no `updated_at` column at all, and `published_at` is **NULL** on all 14 rows.

**[LOW] `X-Powered-By: Next.js` header exposed** — minor fingerprinting; set `poweredByHeader: false`.

---

## Content Quality — 55/100

### What works
- Median 1,526 words per page; **93 of 128 pages exceed 1,200 words**
- Real legal/trust pages: About (786 w), Contact (481 w), Privacy, Terms, Disclaimer, AdSense Policy
- Prompt pages carry structured FAQ sections (83 pages) — good depth for a directory
- Average 10.4 `<h2>` per page — well-sectioned content

### Findings

**[CRITICAL] Category taxonomy non-functional**
`/categories` renders "No categories found" — `/api/website_categories` returns `[]`. Separately,
`/api/categories` returns 2 rows (`chatgpt`, `gemini-pro`) whose detail pages render
"Category Not Found". Two disconnected category systems, neither working. A 102-page prompt
library with **zero working browse taxonomy** has no mid-funnel landing pages and no internal
link hub.

**[HIGH] Factual overclaims contradicted by the site's own API**
"1,000+ free AI prompts" and "50+ categories" appear in the sitewide meta description (used on
3 pages), homepage body copy, and `llms.txt`. Actual: **102 prompts, 2 categories, 0 working**.
`llms.txt` additionally claims "world's leading", "Updated daily", and lists categories
(Poetry, DevOps Scripts, Financial Analysis, Legal Documents…) that do not exist on the site.
This is precisely the kind of unverifiable claim that suppresses AI citation and trips
Helpful Content signals.

**[HIGH] `/faq` has 153 words and no visible answers**
16 questions render as collapsed headings; the answer text is absent from the HTML. See the
Schema section — this also invalidates the FAQPage markup.

**[MEDIUM] No author entity / weak E-E-A-T**
`BlogPosting.author` is `{"@type":"Person","name":"Darshan Patel","url":"https://promptking.in"}`
— the author URL points at the homepage. There is no author page, no bio, no credentials, no
`sameAs`. For an "expert prompt engineers" positioning, this is the single biggest E-E-A-T gap.

**[MEDIUM] 7 pages under 300 words**
`/category/chatgpt` (81 w), `/category/gemini-pro` (81 w), `/categories` (104 w), `/faq` (153 w),
`/adsense-policy` (241 w), `/prompt/acoustic-guitar-in-a-magical-garden-ai-prompt` (282 w),
`/prompt/moody-pine-forest-cinematic-portrait-color-grade` (295 w).

**[MEDIUM] Ad unit occupies the entire above-the-fold slot**
On mobile, the first screen is logo → search bar → a Google AdSense related-search unit
("Discover more"). No headline, no description, no content. First prompt card appears ~1,450 px
down. This is an ad-density / Helpful Content risk on top of the LCP cost.

---

## On-Page SEO — 62/100

### What works
- **0 missing titles, 0 missing meta descriptions** across 128 pages
- **100% coverage** of `og:title`, `og:description`, `og:image`, `twitter:card`
- 101 of 128 titles land in the 30–60 char sweet spot
- 79 of 128 meta descriptions in the 120–160 char range
- Average 24.9 internal links per page

### Findings

**[HIGH] Homepage has no `<h1>`**
Three pages have zero H1: `/` (the homepage), `/category/chatgpt`, `/category/gemini-pro`.
The homepage is your most important page and offers no primary heading signal.

**[HIGH] 19 pages emit multiple `<h1>` tags**
8 pages with 2, **11 pages with 3**. On 11 of them the same string is repeated three times, e.g.
`/prompt/romantic-low-key-studio-couple-portrait-ai-prompt` renders
"Romantic Low-Key Studio Couple Portrait AI Prompt" as `<h1>` three times.
Others render two *different* H1s, e.g. `/prompt/lego-world-selfie-photo-ai-prompt` has both
"Photorealistic LEGO World Selfie AI Prompt…" and "LEGO World Selfie Photo Ai Prompt".

**[MEDIUM] 16 titles exceed 70 characters** (will truncate in SERPs)
| Chars | URL |
|---|---|
| 100 | `/prompt/3d-balloon-typography-fashion-portrait-gemini-ai-prompt` |
| 98 | `/prompt/pastel-papercraft-diorama-aesthetic-ai-prompt` |
| 96 | `/prompt/hanumanji-divine-aura-ai-prompt-cinematic-guardian-power-photo-edit-by-promptking` |
| 94 | `/prompt/a-cinematic-story-told-through-forgotten-pictures-ai-prompt` |
| 93 | `/prompt/moody-cinematic-night-portrait-collage-with-full-moon-and-streetlights-ai-prompt` |

Note the 96-char one ends in "…by PromptKing - PromptKing" — the brand suffix is doubled.

**[MEDIUM] 35 meta descriptions exceed 160 characters** (max 201)
Worst: `/prompt/chatgpt-peaceful-giant-landmark-travel-portrait-prompt` (201),
`/prompt/rain-soaked-crimson-buddha-cinematic-movie-poster-ai-prompt` (199),
`/prompt/creative-classroom-teacher-portrait-prompt` (197).

**[MEDIUM] Duplicate titles and descriptions**
- "Category Not Found - PromptKing" ×2
- "AI Image Prompt Engineering Guide for Better Results" ×2 (duplicate sitemap entry)
- The generic "Explore 1000+ free AI prompts…" description is reused on 3 pages
- A second description is duplicated across 2 article pages

**[MEDIUM] Two `og:image` tags on every page**
Every page emits both `og-image.jpg` and `og-image.png` with identical dimensions and alt text.
Crawlers pick the first; the second is noise. Ship one.

**[MEDIUM] `/categories` is orphaned** — zero internal inbound links, and it is a dead page anyway.

**[LOW] 112 of 128 pages have only 1–2 internal inbound links.** Every article and most prompt
pages are reachable from exactly one link. There is no header navigation and no working category
hub, so link equity has nowhere to flow.

**[LOW] `<meta name="keywords">` present** — ignored by every major engine; harmless but dead weight.

---

## Schema / Structured Data — 68/100

### What works
- Schema on **100%** of pages, **0 invalid JSON-LD blocks** across 128 pages
- `Organization` + `WebSite` + `SearchAction` sitewide (sitelinks-searchbox eligible)
- `BreadcrumbList` on 116 pages
- `FAQPage` on 83 pages, `BlogPosting` + `Person` on all 14 articles
- `CreativeWork` + `SoftwareSourceCode` on all 102 prompt pages — a sensible modelling choice

### Findings

**[HIGH] FAQPage markup on `/faq` without visible answers**
16 `acceptedAnswer` values in JSON-LD; the corresponding text is not in the rendered DOM.
Google's structured data policy requires the marked-up content to be visible to users.

**[MEDIUM] `author.url` points to the homepage** — should point to a real author page with a bio.

**[MEDIUM] No `ItemList` / `CollectionPage` on listing pages**
`/blog`, `/categories` and the homepage carry only the global `Organization`/`WebSite` blocks.
`ItemList` on `/blog` and the homepage prompt grid is a cheap carousel-eligibility win.

**[LOW] No `ContactPage` on `/contact`, no `AboutPage` on `/about`.**

---

## Performance (Core Web Vitals) — 35/100

Lab measurement only — no Google API key is configured, so there is **no CrUX field data** in
this audit. Numbers below are from an automated Chromium session on the live site.

| Metric | Measured | Target |
|---|---|---|
| TTFB | 456 ms | < 800 ms ✅ |
| First Contentful Paint | **7,928 ms** | < 1,800 ms ❌ |
| DOMContentLoaded | 1,620 ms | — |
| Load event | 3,035 ms | — |
| Total transfer | 825 KB | — |
| Requests | 189 | — |
| DOM nodes | 1,043 | ✅ |

### Findings

**[CRITICAL] `/api/get_data` returns 286 KB and took 1.7 s (cold) / 4.5 s (observed)**
The homepage fetches **all 102 prompts client-side** on every load to render the 16 visible in
the first grid page. Paginate server-side, or move the first page into the RSC payload.

**[HIGH] 177 inline scripts totalling 338 KB; homepage HTML is 440 KB**
The Next.js RSC flight payload dominates the document. Median page HTML across the site is 96 KB;
the homepage is 4.6× that.

**[HIGH] 45 requests / ~270 KB from Google ad + consent infrastructure**
`pagead2.googlesyndication.com` (23 req, 123 KB), `fundingchoicesmessages.google.com` (15 req,
76 KB), `googleads.g.doubleclick.net` (3 req, 57 KB), `ep1/ep2.adtrafficquality.google` (4 req).
`adsbygoogle.js` alone took 1,467 ms. Load these after first paint.

**[HIGH] Fonts served as uncompressed TTF**
`Outfit-Black.ttf`, `Outfit-Medium.ttf`, `Outfit-Regular.ttf` are **55 KB each** and all three are
`<link rel="preload">`ed. No `.woff2` exists anywhere in the repo. WOFF2 would cut each to ~20 KB
(~105 KB saved on the critical path).

**[MEDIUM] Duplicate font preloads** — the three preload tags in `app/layout.js:131-133` render
**twice** in the served HTML (6 tags for 3 fonts).

**[MEDIUM] Two render-blocking `fonts.googleapis.com` stylesheets** for "Google Sans", injected
by the ad stack.

**[MEDIUM] 463 of 693 images lack `width`/`height`** — direct CLS exposure.

**[MEDIUM] Only 101 of 693 images are `loading="lazy"`.**

**[LOW] Slowest page:** `/prompt/chatgpt-pink-couture-fashion-editorial-prompt` at 2,866 ms TTFB
(vs ~450 ms median) — likely a cold `x-nextjs-cache: MISS`.

---

## Images — 70/100

### What works
- **0 of 693 images missing alt text.** This is the best result in the audit — do not regress it.
- Cloudinary delivers WebP with automatic format negotiation
- 40 image requests on the homepage transferred ~0 KB (well cached)

### Findings
- **[MEDIUM] 463/693 images have no `width`/`height` attributes** → layout shift
- **[MEDIUM] Only 101/693 use `loading="lazy"`**
- **[LOW] `og-image.jpg` and `og-image.png` both shipped** on every page

---

## AI Search Readiness (GEO) — 70/100

### What works
- **`/llms.txt` and `/llms-full.txt` both present and 200** — ahead of most sites in this niche
- `robots.txt` explicitly `Allow`s GPTBot, ChatGPT-User, OAI-SearchBot, Google-Extended,
  anthropic-ai, ClaudeBot, Claude-Web, PerplexityBot, cohere-ai, meta-externalagent, Applebot
- Content is **server-rendered**, not an SPA — AI crawlers that do not execute JS still see it
- `llms.txt` opens with a "Direct answer:" block and states an explicit citation policy
- FAQ schema on 83 pages gives passage-level citability

### Findings

**[HIGH] `llms.txt` asserts claims the site cannot support**
"world's leading free AI prompt library", "1,000+ expert-engineered prompts", "50+ categories",
"Updated daily", plus a taxonomy listing ~50 categories (Poetry, DevOps Scripts, Financial
Analysis, Screenwriting…) that return nothing on the site. An LLM that verifies before citing
will find 102 prompts and 2 broken categories. Overclaiming in the one file you control for AI
consumption is counterproductive — state the real numbers.

**[HIGH] The blog is uncitable while canonicals point at 404s** — your only long-form,
genuinely citable content is the 14 articles, and they are the ones broken.

**[MEDIUM] No author entity for attribution.** AI answer engines weight named, verifiable
authorship. "Darshan Patel" with a homepage URL and no bio does not qualify.

---

## Method & Limitations

- Full crawl of all 128 sitemap URLs; on-page extraction from raw server HTML (not JS-rendered),
  which is what crawlers see first.
- Performance measured in one automated Chromium session. **FCP of 7.9 s is a lab figure from a
  headless, unthrottled-but-automated environment** — treat the ordering of the bottlenecks as
  solid and the absolute number as indicative, not as a field measurement.
- **No CrUX / Search Console / GA4 data**: no Google API key configured
  (`google_auth.py --check` reports all six services missing).
- **No backlink data beyond Common Crawl tier 0**: no Moz or Bing Webmaster key configured.
  Backlink profile, referring domains and anchor text were **not** assessed.
- Rank tracking, keyword volumes and competitor SERP comparison were **not** performed — no
  DataForSEO MCP available in this session.
