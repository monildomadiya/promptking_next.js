# Images — 70/100

Across 128 crawled pages: **693 `<img>` elements**.

| Check | Result |
|---|---|
| Missing `alt` | **0 / 693** ✅ |
| Missing `width`/`height` | **463 / 693** ❌ |
| `loading="lazy"` | 101 / 693 |
| Delivery | Cloudinary, WebP, auto-format |
| Homepage image transfer | 40 requests, ~0 KB (fully cached) |

## What works

**Every image on the site has alt text.** 693 for 693. This is the strongest single result in the
audit and is rare on a directory site of this size — protect it with a lint rule or a
`next/image` wrapper that requires `alt`.

Cloudinary is doing the heavy lifting correctly: WebP negotiation, CDN caching, and near-zero
repeat transfer.

## Findings

### [MEDIUM] 463 of 693 images have no `width`/`height`
Direct Cumulative Layout Shift exposure — the browser cannot reserve space before the image
loads. The prompt grid and before/after sliders are the main offenders.

**Fix:** migrate to `next/image`, which enforces dimensions and handles lazy-loading, responsive
`srcset`, and modern formats automatically. Cloudinary URLs work with it via a custom loader.

### [MEDIUM] Only 101 of 693 images are lazy-loaded
15%. Everything below the fold should be `loading="lazy"`; the LCP candidate should be
`fetchpriority="high"` and explicitly *not* lazy.

### [LOW] Both `og-image.jpg` and `og-image.png` shipped on every page
Identical `1200×630` dimensions and alt text, duplicated in the head of all 128 pages. Ship one.

### [LOW] No image sitemap
With 693 images across 102 prompt pages — visual content that *is* the product — an image sitemap
(or `<image:image>` entries in the existing sitemap) would help Google Images discovery. Given the
niche, image search is a plausible traffic channel that is currently unaddressed.
