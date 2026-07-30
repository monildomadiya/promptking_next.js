# On-Page SEO — 62/100

## Coverage (128 pages)
| Element | Present | Missing |
|---|---|---|
| `<title>` | 128 | **0** |
| meta description | 128 | **0** |
| canonical | 128 | **0** |
| `og:title` / `og:description` / `og:image` | 128 | **0** |
| `twitter:card` | 128 | **0** |
| viewport | 128 | **0** |
| `lang` | 128 | **0** |

Title length: `<30`: 0 · `30–60`: **101** · `61–70`: 11 · `>70`: **16**
Meta description length: `<120`: 14 · `120–160`: **79** · `>160`: **35** (max 201)

## What works
Full metadata coverage with no gaps, 79% of titles in the ideal band, and complete Open Graph /
Twitter Card implementation including `og:image:width`, `og:image:height` and `og:image:alt`.
Average 24.9 internal links per page.

## Findings

### [HIGH] Homepage has no `<h1>`
H1 count distribution: `0` → **3 pages**, `1` → 106, `2` → 8, `3` → **11**

Pages with zero H1: `/` (homepage), `/category/chatgpt`, `/category/gemini-pro`.

### [HIGH] 19 pages emit 2–3 `<h1>` tags
11 pages repeat the **same string three times**, e.g.
`/prompt/romantic-low-key-studio-couple-portrait-ai-prompt`:
```
<h1>Romantic Low-Key Studio Couple Portrait AI Prompt</h1>  ×3
```
Others emit two *different* H1s, sending conflicting topic signals:
| URL | H1 #1 | H1 #2 |
|---|---|---|
| `/prompt/lego-world-selfie-photo-ai-prompt` | "Photorealistic LEGO World Selfie AI Prompt…" | "LEGO World Selfie Photo Ai Prompt" |
| `/prompt/transform-yourself-into-a-ipl-cricketer-ai-prompt` | "Become an IPL Superstar with AI" | "Transform Yourself Into a IPL Cricketer" |
| `/prompt/breaking-through-instagrams-profile-page-ai-prompt` | "Cinematic Instagram Profile Breakout AI Prompt…" | "Breaking through Instagram's profile page Ai Prompt" |

### [MEDIUM] 16 titles exceed 70 characters
| Chars | URL |
|---|---|
| 100 | `/prompt/3d-balloon-typography-fashion-portrait-gemini-ai-prompt` |
| 98 | `/prompt/pastel-papercraft-diorama-aesthetic-ai-prompt` |
| 96 | `/prompt/hanumanji-divine-aura-ai-prompt-cinematic-guardian-power-photo-edit-by-promptking` |
| 94 | `/prompt/a-cinematic-story-told-through-forgotten-pictures-ai-prompt` |
| 93 | `/prompt/moody-cinematic-night-portrait-collage-with-full-moon-and-streetlights-ai-prompt` |
| 93 | `/prompt/cinematic-underwater-portrait-of-a-man-in-white-shirt-with-sun-rays-and-floating-bubbles-ai-prompt` |
| 89 | `/prompt/miniature-chocolate-lover-doll-image-ai-prompt` |
| 81 | `/prompt/soft-aesthetic-portrait-gemini-ai-prompt-pinterest-style-photo-edit` |

The 96-char title ends `"…Photo Edit by PromptKing - PromptKing"` — the brand suffix is applied
twice. Two titles also contain a mojibake character (`�`) where an em-dash should be —
check the encoding on the `meta_title` column.

### [MEDIUM] 35 meta descriptions exceed 160 characters
| Chars | URL |
|---|---|
| 201 | `/prompt/chatgpt-peaceful-giant-landmark-travel-portrait-prompt` |
| 199 | `/prompt/rain-soaked-crimson-buddha-cinematic-movie-poster-ai-prompt` |
| 197 | `/prompt/creative-classroom-teacher-portrait-prompt` |
| 196 | `/prompt/romantic-low-key-studio-couple-portrait-ai-prompt` |
| 194 | `/prompt/chatgpt-india-pixar-style-collectible-figurine-diorama-prompt` |
| 194 | `/prompt/chatgpt-luxury-european-travel-lifestyle-editorial-prompt` |

### [MEDIUM] Duplicate `og:image` on every page
Each page emits `og-image.jpg` **and** `og-image.png` with identical `1200×630` dimensions and
identical alt text. Ship one.

### [MEDIUM] `/categories` is orphaned
Zero internal inbound links across the whole crawl.

### [LOW] 112 of 128 pages have only 1–2 inbound internal links
Includes all 14 articles (1 each, from `/blog`) and nearly every prompt page. There is no header
navigation menu, and no working category hub, so link equity has nowhere to flow.
Average outbound internal links is high (24.9) but concentrated in `?search=` chips.

### [LOW] External linking is minimal
9 external hosts total across 128 pages: `chat.openai.com`, `gemini.google.com`, `ko-fi.com`,
plus Google ad/privacy policy links. No citations to authoritative sources — a missed
trust signal for the blog.

### [LOW] `<meta name="keywords">` present on all pages — ignored by every major engine.
