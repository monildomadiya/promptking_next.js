# Schema / Structured Data — 68/100

## Coverage across 128 pages
| Type | Pages |
|---|---|
| `Organization` + `ContactPoint` + `ImageObject` | 128 |
| `WebSite` + `SearchAction` + `EntryPoint` | 128 |
| `BreadcrumbList` + `ListItem` | 116 |
| `CreativeWork` + `SoftwareSourceCode` | 102 |
| `FAQPage` + `Question` + `Answer` | 83 |
| `WebPage` | 15 |
| `BlogPosting` + `Person` | 14 |

**Pages with zero schema: 0. Invalid JSON-LD blocks: 0.**

## What works
- 100% schema coverage with no parse failures across 128 pages — genuinely well executed
- `WebSite` + `SearchAction` makes the site eligible for the sitelinks search box
- `BreadcrumbList` on 116 pages
- Modelling prompts as `CreativeWork` + `SoftwareSourceCode` is a defensible, well-chosen mapping
- `Organization.logo`, `ContactPoint`, and `ImageObject` all populated

## Findings

### [HIGH] `FAQPage` on `/faq` without visible answers
`/faq` emits `mainEntity` with **16 `acceptedAnswer`** values, but the rendered page is 153 words
and contains none of the answer text. Google's structured-data policy requires marked-up content
to be visible to users. Risk: loss of the rich result, and at worst a structured-data manual action.

**Fix:** render the answers in the DOM (a collapsed accordion is acceptable — the text must exist
in the HTML), or remove the `FAQPage` block.

### [MEDIUM] `author.url` points at the homepage
```json
"author": {"@type":"Person","name":"Darshan Patel","url":"https://promptking.in"}
```
Should resolve to a dedicated author page carrying a bio and `sameAs` links.

### [MEDIUM] `mainEntityOfPage.@id` inherits the broken canonical
`app/article/[slug]/page.jsx:123` sets `@id` from the same `canonicalUrl` variable, so
`BlogPosting.mainEntityOfPage.@id` and `BreadcrumbList` item 3 both point to the 404ing
`/blog/<slug>` URL. Fixing the canonical (see `technical.md`) resolves all three at once.

### [MEDIUM] No `ItemList` / `CollectionPage` on listing pages
`/blog` (14 articles), `/categories`, and the homepage prompt grid carry only the global
`Organization`/`WebSite` blocks. `ItemList` is a cheap carousel-eligibility win.

### [LOW] Missing page-type schema
- `/contact` → no `ContactPage`
- `/about` → no `AboutPage` or `Organization.founder`
- `/privacy`, `/terms`, `/disclaimer` → no `WebPage` typing

### [LOW] Prompt pages could carry `HowTo` or `Review`
The prompt pages already contain step-like instructions and before/after imagery. Neither is
required, but `HowTo` would map naturally to the "how to use this prompt" sections.
