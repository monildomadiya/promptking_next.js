# Visual / Above-the-Fold — findings

Screenshots captured with Playwright at desktop (1920×1080), laptop, and mobile (375×812).
Tablet capture timed out at 30 s — worth re-testing, as it may indicate a slow render at that
breakpoint rather than a tooling fault.

Artifacts: `screenshots/promptking_in_desktop.png`, `_laptop.png`, `_mobile.png`

## Mobile above-the-fold (375 px)

Reading down the first viewport:
1. Logo tile (~180 px tall)
2. Search bar + "Premium" / "Support Us" buttons
3. **Google AdSense related-search unit** — "Discover more → Photo / Photo Software / AI Tools, Chatbots & Virtual Assistants / Graphics & Animation Software / Online Image Galleries" (~700 px tall)
4. First prompt card begins at roughly **1,450 px** — well below the fold

There is **no headline, no `<h1>`, and no descriptive copy anywhere in the first screen.** A user
landing from search sees a logo, a search box, and an ad unit.

## Desktop above-the-fold (1920×1080)

Same ordering, and the ad unit still occupies the prime slot between the search bar and the
content grid. The first row of prompt cards starts at ~590 px and is only partially visible.

Also notable: **there is no header navigation.** No links to Blog, Categories, About or FAQ in the
masthead — only the logo, search, Premium and Support Us. This is the visual explanation for the
internal-linking findings in `onpage.md` (112 of 128 pages have 1–2 inbound links, `/categories`
has zero).

## Findings

### [HIGH] Ad unit owns the entire above-the-fold slot
4 AdSense slots on the homepage; the related-search unit is placed above all content on both
mobile and desktop. This is simultaneously:
- an **LCP** problem — the largest above-fold paint is third-party, arriving after a 1,467 ms
  `adsbygoogle.js` load
- a **Helpful Content / ad-density** risk under Google's page-experience guidance
- a **conversion** problem — the product is invisible on first paint

**Fix:** move the related-search unit below the first row of prompt cards.

### [HIGH] No `<h1>` and no value proposition above the fold
The homepage renders zero `<h1>` (confirmed in raw HTML across the crawl). Add a real headline and
a one-line description above the grid — this addresses the on-page heading gap and the
above-the-fold emptiness in the same change.

### [MEDIUM] No header navigation
Add a persistent nav (Prompts / Categories / Blog / About). This is the cheapest available fix for
the site-wide internal-linking weakness.

### [LOW] Tablet render timed out at 30 s
Re-test the 768 px breakpoint manually to rule out a genuine rendering stall.
