# Content Quality & E-E-A-T — 55/100

## Word-count distribution (128 pages)
| Band | Pages |
|---|---|
| < 300 | 7 |
| 300–599 | 23 |
| 600–1,199 | 5 |
| ≥ 1,200 | **93** |

Median 1,526 words · max 5,223 · text/HTML ratio median 0.107

## What works
- 93 of 128 pages exceed 1,200 words — strong depth for a directory
- Average 10.4 `<h2>` per page; **0 pages** with an `h3`-before-`h2` skip
- Complete trust surface: About (786 w), Contact (481 w), Privacy, Terms, Disclaimer, AdSense Policy
- 83 prompt pages carry structured FAQ sections — good passage-level answerability
- Content is server-rendered; `is_spa: false`

## Findings

### [CRITICAL] Category taxonomy non-functional
- `/categories` → "No categories found" (104 words). Backed by `/api/website_categories`, which returns `[]`.
- `/api/categories` returns 2 rows (`chatgpt`, `gemini-pro`), whose pages render "Category Not Found".
- `/categories` contains **zero** `href="/category/*"` links.

Two disconnected category systems, neither functional. A 102-prompt library with no browse
taxonomy has no mid-funnel landing pages and no internal-link hub.

### [HIGH] Factual claims contradicted by the site's own API
`/api/get_data` returns:
```
prompts -> 102
categories -> 2
```

Claimed across the site:
- Sitewide meta description (used on 3 pages): *"Explore 1000+ free AI prompts…"*
- `llms.txt`: *"1,000+ expert-engineered prompts … across 50+ categories"*, *"world's leading"*, *"Updated daily"*
- Homepage body: *"Search 1,000+ prompts by keyword"*

`llms.txt` also enumerates ~50 categories (Poetry, Screenwriting, DevOps Scripts, Financial
Analysis, Legal Documents, Machine Learning…) with no corresponding pages.

### [HIGH] `/faq` renders 153 words and no answers
16 questions render as headings; answer text is absent from the DOM. The page simultaneously
publishes `FAQPage` schema with 16 `acceptedAnswer` values — see `schema.md`.

### [MEDIUM] No author entity
`BlogPosting.author` = `{"@type":"Person","name":"Darshan Patel","url":"https://promptking.in"}`.
No author page, no bio, no credentials, no `sameAs`, no visible byline or date on articles.
For a site positioned on "expert prompt engineers", this is the largest E-E-A-T gap.

### [MEDIUM] 7 pages under 300 words
| Words | URL |
|---|---|
| 81 | `/category/chatgpt` |
| 81 | `/category/gemini-pro` |
| 104 | `/categories` |
| 153 | `/faq` |
| 241 | `/adsense-policy` |
| 282 | `/prompt/acoustic-guitar-in-a-magical-garden-ai-prompt` |
| 295 | `/prompt/moody-pine-forest-cinematic-portrait-color-grade` |

Next tier (300–380 w), worth expanding: `/prompt/dreamy-chibi-fantasy-portrait-ai-prompt` (301),
`/prompt/luxury-studio-editorial-portrait-ai-prompt` (309),
`/prompt/moody-cinematic-night-portrait-collage-with-full-moon-and-streetlights-ai-prompt` (339),
`/prompt/cinematic-double-exposure-portrait-ai-prompt` (341), `/disclaimer` (374).

### [MEDIUM] Duplicate content signals
- Title "Category Not Found - PromptKing" ×2
- Title "AI Image Prompt Engineering Guide for Better Results" ×2 (duplicate sitemap entry)
- Sitewide "Explore 1000+ free AI prompts…" description reused on 3 pages
- A second article description duplicated across 2 pages

### [MEDIUM] Ad density above the fold
Mobile first screen (375 px, verified by screenshot): logo → search bar → Google AdSense
related-search unit ("Discover more"). No headline, no description, no content. First prompt card
appears ~1,450 px down. 4 ad slots on the homepage.
