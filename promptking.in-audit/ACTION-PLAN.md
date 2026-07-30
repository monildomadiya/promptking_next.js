# PromptKing.in — Prioritised Action Plan

Ordered by impact ÷ effort. Effort: **S** ≤ 1 h · **M** ≤ 1 day · **L** > 1 day.

---

## Phase 1 — Critical fixes (this week)

### 1. Unbreak the blog canonicals · **S** · CRITICAL
All 14 `/article/*` pages canonical to `/blog/*`, which 404s. The blog is effectively
de-indexed.

The code fallback at [app/article/[slug]/page.jsx:32](app/article/[slug]/page.jsx#L32) is already
correct — the stale value comes from the DB:

```sql
UPDATE blogs SET canonical_url = NULL WHERE canonical_url LIKE '%/blog/%';
```

Then either leave it (the `/article/${slug}` fallback takes over) **or**, if `/blog/<slug>` was
the historical public URL and has backlinks, add permanent redirects in `next.config.mjs`:

```js
async redirects() {
  return [{ source: '/blog/:slug', destination: '/article/:slug', permanent: true }];
}
```

Do **not** do both — pick one canonical shape and make the sitemap agree with it.

### 2. Stop serving soft 404s · **S** · CRITICAL
`/category/chatgpt` and `/category/gemini-pro` return HTTP 200 + `index, follow` with the body
"Category Not Found", and both sit in `sitemap.xml`.

- Return a real `notFound()` from `app/category/[slug]/page.jsx` when the category has no prompts
- Exclude empty categories from the sitemap generator
- While you are there: remove the duplicate `<loc>` for `/article/ai-image-prompt-engineering-guide`

### 3. Restore the category taxonomy · **M** · CRITICAL
`/api/website_categories` returns `[]`, so `/categories` renders "No categories found".
`/api/categories` returns 2 rows whose pages are broken. Two disconnected systems, neither live.

Pick one, populate it, and make `/categories` → `/category/<slug>` → prompt list work end to end.
This is the biggest *structural* win available: it creates mid-funnel landing pages, gives the
102 prompt pages more than one inbound link each, and lets you honestly describe your taxonomy.

### 4. Make FAQ answers visible or drop the schema · **S** · HIGH
`/faq` publishes 16 `acceptedAnswer` values in JSON-LD but renders 153 words with no answer text.
Render the answers in the HTML (collapsed-but-present in the DOM is fine — Google accepts
accordions). If you cannot, remove the `FAQPage` block.

### 5. Correct the factual claims · **S** · HIGH
"1,000+ prompts" and "50+ categories" appear in meta descriptions, homepage copy, and `llms.txt`.
Reality: 102 prompts, 2 categories. Either publish the real numbers ("100+ hand-tested prompts")
or make the claim true before repeating it. Also strip the fictional category taxonomy from
`llms.txt` — it lists ~50 topics (Poetry, DevOps Scripts, Financial Analysis…) with no
corresponding pages.

---

## Phase 2 — High-impact improvements (weeks 2–3)

### 6. Fix the heading structure · **S** · HIGH
- Add an `<h1>` to the homepage (currently **zero**)
- Fix 19 pages emitting 2–3 `<h1>`s; on 11 of them it is the *same* string three times
  (e.g. `/prompt/romantic-low-key-studio-couple-portrait-ai-prompt`). Demote the repeats to
  `<h2>`/`<p>` or dedupe the component that renders them.

### 7. Cut the homepage payload · **M** · HIGH
`/api/get_data` ships **286 KB / all 102 prompts** client-side to render the 16 above the fold.

- Paginate the endpoint (`?page=1&limit=16`), or
- Move the first page into the server component so the grid renders without a client fetch

Homepage HTML is 440 KB with 177 inline scripts (338 KB) — this is the main lever on it.

### 8. Defer the ad stack · **M** · HIGH
45 requests / ~270 KB from `pagead2.googlesyndication.com`, `fundingchoicesmessages.google.com`,
`googleads.g.doubleclick.net`, `adtrafficquality.google`. `adsbygoogle.js` took 1,467 ms.

Load AdSense with `next/script` `strategy="afterInteractive"` (or `lazyOnload`), and move the
"Discover more" related-search unit **below** the first row of prompt cards. Right now it owns
the entire mobile above-the-fold — no headline, no content, first prompt card ~1,450 px down.

### 9. Ship WOFF2 fonts · **S** · HIGH
`Outfit-Regular/Medium/Black.ttf` are 55 KB each, all three preloaded, no `.woff2` in the repo.
Convert (`fonttools`, `woff2_compress`, or `next/font/local`) → ~20 KB each, ~105 KB saved on the
critical path. Also: the three preload tags in [app/layout.js:131](app/layout.js#L131) render
**twice** in the served HTML — six tags for three fonts.

### 10. Trim titles and meta descriptions · **S** · MEDIUM
- 16 titles > 70 chars (longest 100). `/prompt/hanumanji-divine-aura-…` ends "…by PromptKing - PromptKing" — the brand suffix is doubled.
- 35 meta descriptions > 160 chars (longest 201)
- Add a length guard in the metadata builder so new rows cannot regress

### 11. Contain the `?search=` URLs · **S** · MEDIUM
581 unique `/?search=<term>` URLs are linked from prompt pages and are `index, follow`.
They canonical to the homepage, so this is crawl-budget waste rather than duplication — but on a
128-page site that is a 5× crawl inflation. Add `rel="nofollow"` to the search chips and
`Disallow: /*?search=` to `robots.txt`.

---

## Phase 3 — Content & authority (month 2)

### 12. Build a real author entity · **M** · MEDIUM
`BlogPosting.author.url` currently points at the homepage. Create `/author/<slug>` with a bio,
credentials and `sameAs` links, point the schema at it, and add a visible byline + published/
updated date on articles. This is the largest E-E-A-T gap for a site positioned around "expert
prompt engineers".

### 13. Fix sitemap `lastmod` · **S** · MEDIUM
All 128 entries carry an identical generation timestamp, so Google discounts the signal entirely.
Emit each row's real `updated_at` — note `published_at` and `updated_at` are currently **NULL**
for blog rows, so backfill those first.

### 14. Expand the 7 thin pages · **S** · MEDIUM
`/categories` (104 w), `/faq` (153 w), `/adsense-policy` (241 w),
`/prompt/acoustic-guitar-in-a-magical-garden-ai-prompt` (282 w),
`/prompt/moody-pine-forest-cinematic-portrait-color-grade` (295 w), plus the two category pages
once they work.

### 15. Add `width`/`height` to images · **M** · MEDIUM
463 of 693 images lack dimensions → CLS. Prefer `next/image`, which handles this and lazy-loading
(only 101 of 693 are currently lazy). **Keep the alt text — 693/693 have it, and that is the best
result in this audit.**

### 16. Schema polish · **S** · LOW
- Add `ItemList` to `/blog` and the homepage prompt grid
- Add `ContactPage` / `AboutPage` to those two pages
- Ship one `og:image`, not both `.jpg` and `.png`

### 17. Fix internal linking · **M** · MEDIUM
112 of 128 pages have only 1–2 inbound internal links; `/categories` has zero. There is no header
navigation. Add a persistent nav (Prompts / Categories / Blog / About) and related-prompt blocks
on prompt pages. Largely resolved by #3.

---

## Phase 4 — Monitoring (ongoing)

### 18. Connect the measurement APIs
This audit ran blind on field data. Configure:
- **Google API key** → PageSpeed, CrUX field CWV, CrUX history (`~/.config/claude-seo/google-api.json`)
- **Search Console OAuth** → real indexation status, impressions, CTR
- **GA4** → organic traffic trends
- **Moz or Bing Webmaster key** → backlink profile (currently tier 0, Common Crawl only)

Then re-run this audit — Performance and Technical scores will be based on real user data rather
than a single lab session.

### 19. Verify the fixes in Search Console
After Phase 1, use URL Inspection on 3 article URLs to confirm Google now reports the
`/article/*` URL as canonical, and request re-indexing.

### 20. Set a drift baseline
`claude-seo run drift_baseline.py https://promptking.in` after Phase 2 so future deploys are
diffed against a known-good snapshot.
