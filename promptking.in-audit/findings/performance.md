# Performance (Core Web Vitals) — 35/100

**Lab data only.** No Google API key is configured, so there is no CrUX field data
(`google_auth.py --check` reports all six Google services missing). Measurements come from one
automated Chromium session against the live site plus server-side timings from the 128-page crawl.

Treat the *ranking* of bottlenecks as reliable and the absolute FCP figure as indicative.

## Homepage measurements
| Metric | Value | Target |
|---|---|---|
| TTFB | 456 ms | < 800 ms ✅ |
| First Paint / FCP | **7,928 ms** | < 1,800 ms ❌ |
| DOMContentLoaded | 1,620 ms | — |
| Load event | 3,035 ms | — |
| Total transfer | 825 KB | — |
| Requests | 189 | — |
| DOM nodes | 1,043 | < 1,500 ✅ |
| `<script>` elements | 200 | — |

LCP element could not be resolved by the PerformanceObserver in this session — the largest
above-the-fold paint is the AdSense related-search unit, not site content (see `visual.md`).

## Transfer by initiator
| Type | Requests | KB |
|---|---|---|
| script | 25 | 327 |
| fetch | 82 | 157 |
| link | 26 | 115 |
| css | 3 | 93 |
| iframe | 5 | 57 |
| xhr | 11 | 13 |
| img | 36 | ~0 (cached) |

## Third-party breakdown
| Host | Requests | KB |
|---|---|---|
| `pagead2.googlesyndication.com` | 23 | 123 |
| `fundingchoicesmessages.google.com` | 15 | 76 |
| `googleads.g.doubleclick.net` | 3 | 57 |
| `res.cloudinary.com` | 40 | ~0 (cached) |
| `ep1/ep2.adtrafficquality.google` | 4 | 13 |
| `fonts.googleapis.com` | 2 | 4 |
| `googletagmanager.com` / `google-analytics.com` | 3 | ~0 |

**~45 requests and ~270 KB from the Google ad + consent stack.**

## Findings

### [CRITICAL] `/api/get_data` — 286 KB, 1.7 s cold, 4,536 ms observed in-session
The homepage fetches **all 102 prompts** client-side on every load to render the 16 shown in the
first grid page:
```
prompts -> 102
likes -> 0
categories -> 2
```
**Fix:** paginate the endpoint, or render the first page server-side in the RSC payload.

### [HIGH] 177 inline scripts totalling 338 KB; homepage HTML 440 KB
Site-wide median page HTML is 96 KB — the homepage is 4.6× that. The Next.js RSC flight payload
dominates the document.

Heaviest pages:
| Size | TTFB | URL |
|---|---|---|
| 440 KB | 1,444 ms | `/` |
| 219 KB | 1,161 ms | `/article/turn-photos-into-cartoon-styles-using-chatgpt` |
| 215 KB | 1,121 ms | `/article/create-ai-influencers-free-dashboard` |
| 212 KB | 1,250 ms | `/article/midjourney-may-update-v8-1-v8-2-editor` |

### [HIGH] Ad stack blocks the critical path
`adsbygoogle.js` took **1,467 ms**; `googleads.g.doubleclick.net/pagead/ads` a further 947 ms
starting at t=3,599 ms. Load AdSense with `next/script strategy="afterInteractive"` or
`lazyOnload`.

### [HIGH] Fonts served as uncompressed TTF
```
public/assets/fonts/Outfit-Black.ttf     55,372 B
public/assets/fonts/Outfit-Medium.ttf    54,820 B
public/assets/fonts/Outfit-Regular.ttf   54,912 B
```
No `.woff2` exists anywhere in the repo. All three are `<link rel="preload">`ed, so all three sit
on the critical path. WOFF2 conversion → ~20 KB each, **~105 KB saved**.

### [MEDIUM] Duplicate font preloads
`app/layout.js:131-133` declares three preloads; the served HTML contains **six** preload tags
(each font twice). Deduplicate.

### [MEDIUM] Two render-blocking `fonts.googleapis.com` stylesheets
`Google Sans:400` and `Google Sans:700`, injected by the ad stack — cross-origin and
render-blocking.

### [MEDIUM] 463 of 693 images lack `width`/`height` → CLS exposure
Only 101 of 693 use `loading="lazy"`.

### [MEDIUM] 12 JS chunks all start at t=972 ms and take 1.3–2.0 s
A single request wave; the longest is `3rly_llnkow2u.js` at 2,044 ms for 9 KB — latency-bound,
not size-bound. Consider fewer, larger chunks for the initial route.

### [LOW] One slow page: `/prompt/chatgpt-pink-couture-fashion-editorial-prompt` at 2,866 ms
vs a ~450 ms median — consistent with a cold ISR cache (`x-nextjs-cache: MISS`) rather than a
page-specific defect.
