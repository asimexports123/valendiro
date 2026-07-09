# 04 — Navigation Audit

**Method:** Live link testing + site structure review  
**Goal:** Zero dead ends. Every click leads somewhere valuable.

---

## Executive Summary

Navigation **looks complete** (7 categories, 82 subcategories) but **breaks on click**. Category hubs, entity pages, and sitemap are broken. Footer duplicates create noise. Learning Paths are decorative.

**Navigation quality score: 28/100**

---

## Confirmed Broken (F — Fix Immediately)

| URL / Path | Issue | User impact | Priority |
|------------|-------|-------------|----------|
| `/sitemap.xml` | 404 | SEO crawl failure; no discovery map | **P0** |
| `/en/categories/personal-finance/investing` | 404 | Nav/footer link dead end | **P0** |
| `/en/entities/vanguard` | 404 | Entity link from content fails | **P1** |
| `/en/entities/*` (all tested) | 404 | Knowledge graph unreachable | **P1** |
| Subcategory URLs (pattern untested but likely) | Probable 404 cascade | Category → subcategory broken | **P0 audit all** |

---

## Empty Hubs (F/D — Hide or Populate)

| Hub | Listed content | Actual | Issue |
|-----|----------------|--------|-------|
| Education & Learning | 10 subcategories | ~0 topics shown on homepage | Empty promise |
| Travel & Transportation | 11 subcategories | **3 topics** | Category is hollow |
| Health & Wellness | 12 subcategories | **6 topics** | Mostly empty |
| Personal Finance | 12 subcategories | **11 topics** | Thin |
| Investing subcategory hub | Linked from nav | 404 | Broken |
| Learning Path sections | On every topic page | Headings only, no steps | Decorative dead end |

---

## Dead Ends (User arrives, nowhere useful to go)

| Location | Dead end behavior | Fix |
|----------|-------------------|-----|
| 404 page | Generic; no search on page | Add search + top 10 flagships |
| Topic page footer mega-nav | 30+ links, overwhelming | Compact footer |
| "Related guides" repeating same topic | Index Funds links to Index Funds | Dedupe related logic |
| "Articles in this topic: 1 article" | Self-referential loop | Link to parent hub + next in path |
| "Learning roadmap" empty | User scrolls to nothing | Hide until populated |
| Featured homepage cards | "Strategy Seo" → weak page | Curate to flagships only |

---

## Duplicate Destinations

| Issue | Example | Impact |
|-------|---------|--------|
| Same topic in 4 page sections | Index Funds in related, more-in, articles, contents | Confusing redundancy |
| Breadcrumb + nav + footer all repeat | Mutual Funds appears 3× | Noise |
| Homepage "Latest" = "Featured" = Articles | Same 6 tech topics repeated | Feels empty, not rich |
| Discovery + production slug pair | Two packages → home-renovation | Wrong duplicate mapping |

---

## Unreachable Pages (Exist but undiscoverable)

| Page type | Issue |
|-----------|-------|
| Strong pages (nodejs-cluster) | Not on homepage featured; buried |
| Recently updated tech pages | Only in one homepage section |
| Business non-strategy topics | Hidden under junk featured |
| Phase 5 improved pages | No "improved" signal to reader |

---

## Prioritized Fix List (ROI Ranked)

| Rank | Fix | Effort | Reader impact | SEO impact |
|------|-----|--------|---------------|------------|
| 1 | Audit + fix all subcategory hub 404s (top 20 nav links) | M | Critical | High |
| 2 | Publish working sitemap.xml | S | — | Critical |
| 3 | Hide Learning Path / Roadmap until real steps exist | S | Reduces frustration | — |
| 4 | Fix related-guides deduplication | S | Cleaner flow | Medium |
| 5 | Create 20 subcategory hub landing pages (Investing, Programming, etc.) | L | Hub SEO + orientation | Very high |
| 6 | Remove or fix entity links until entity pages live | S | Stop 404s | Medium |
| 7 | Homepage featured → flagship 50 only | S | First click value | High |
| 8 | 404 page → search + flagship links | S | Retain bounces | Medium |
| 9 | Compact footer (remove full category tree) | S | Mobile reading | Low |
| 10 | Add "Start here" + "Next" on flagship pages | M | Session depth | High |
| 11 | Entity pages for top 30 entities (when substantive) | L | Discovery | High |
| 12 | Breadcrumb fix for wrong category mapping | M | Trust | Medium |

---

## Navigation KPIs

| Metric | Current | 30-day | 90-day |
|--------|---------|--------|--------|
| Internal click → 404 rate | Unknown (high) | 0% | 0% |
| Pages per session | ~1.2 est. | 1.8 | 2.5 |
| Hub → topic click-through | N/A (404) | 40% | 55% |
| % topics reachable in ≤3 clicks from homepage | Unknown | 100% flagship | 100% quality |

---

## Working Navigation (Preserve)

| Element | Status |
|---------|--------|
| Top nav category dropdowns | ✅ Work |
| Search entry (⌘K) | ✅ Present (quality TBD) |
| Breadcrumbs on topic pages | ✅ Work |
| Table of contents sidebar | ✅ Good UX |
| Dark mode toggle | ✅ Polish |
| `/en/categories` overview | ✅ Works |
| `/en/articles` listing | ✅ Works (content quality separate) |
| Topic URLs `/en/topics/{slug}` | ✅ Generally resolve |

---

*Next: `05_PUBLISHING_AUDIT.md`*
