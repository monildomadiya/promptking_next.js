# AI Search Readiness (GEO) — 70/100

## What works

### `llms.txt` and `llms-full.txt` both present and 200
Ahead of most sites in this niche. `llms.txt` opens with a `> **Direct answer:**` block — exactly
the extraction-friendly pattern AI crawlers reward — and states an explicit citation policy with a
markdown link template.

### `robots.txt` explicitly allows every major AI crawler
`GPTBot`, `ChatGPT-User`, `OAI-SearchBot`, `Google-Extended`, `anthropic-ai`, `ClaudeBot`,
`Claude-Web`, `PerplexityBot`, `cohere-ai`, `meta-externalagent`, `Applebot` — each with its own
`Allow: /` block. Also explicitly allows `/llms.txt`, `/llms-full.txt`, `/ai-plugin.json`, and
`/.well-known/ai-plugin.json`.

### Server-rendered, not an SPA
`render_page.py` reports `is_spa: false` and returned complete content in `--mode raw`. AI
crawlers that do not execute JavaScript still see the full page — a significant advantage over
client-rendered competitors.

### Passage-level citability
`FAQPage` schema on 83 prompt pages, averaging 10.4 `<h2>` sections per page, median 1,526 words.
Question-shaped headings map well to how answer engines chunk and quote content.

## Findings

### [HIGH] `llms.txt` asserts claims the site cannot support
This is the one file written specifically for AI consumption, and it is the least accurate content
on the site:

| Claim in `llms.txt` | Reality (`/api/get_data`) |
|---|---|
| "1,000+ expert-engineered prompts" | **102 prompts** |
| "50+ categories" | **2 categories, both broken** |
| "world's leading free AI prompt library" | unverifiable |
| "Updated daily" | unverifiable; `blogs.published_at` is NULL on all 14 rows |

It further enumerates a ~50-item taxonomy — Poetry, Screenwriting, DevOps Scripts, Financial
Analysis, Legal Documents, Machine Learning, Mobile Apps — none of which resolve to pages.

An answer engine that verifies before citing finds 102 prompts and a dead category system.
Overclaiming here is actively counterproductive: it converts a file designed to build trust into
a demonstrable inaccuracy. State the real numbers.

### [HIGH] The blog — the only genuinely citable long-form content — is uncitable
All 14 `/article/*` pages canonical to `/blog/*` URLs that return 404. Answer engines that respect
canonicals will either drop the content or cite a dead URL. See `technical.md`.

### [MEDIUM] No author entity for attribution
AI answer engines weight named, verifiable authorship. `BlogPosting.author` is a bare `Person`
with `url` pointing at the homepage — no bio, no credentials, no `sameAs` to any external profile.

### [MEDIUM] No brand-mention or citation footprint assessed
Backlink and brand-mention analysis could not be run — no Moz or Bing Webmaster credentials are
configured (`backlinks_auth.py --check` reports Tier 0: Common Crawl + verification crawler only,
with 0 cached domains). Off-site authority signals are therefore **not** covered by this audit.

### [LOW] `/ai-plugin.json` allowed in robots.txt but not verified
`robots.txt` allows `/ai-plugin.json` and `/.well-known/ai-plugin.json`. Worth confirming these
return 200 with valid manifests, or removing the `Allow` lines if they were aspirational.

### [LOW] No `dateModified` visible to readers
Articles render no visible published or updated date. Freshness is a citation-selection signal for
AI search, and the schema dates currently fall back to `created_at` because `published_at` is NULL
on every row.
