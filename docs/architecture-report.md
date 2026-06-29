# Knowledge OS — Production Architecture Report

**Date:** 2026-06-29  
**Version:** 1.0 (Architecture Freeze)  
**Deployment:** https://knowledge-os-gray.vercel.app

## Executive Summary

Knowledge OS is a fully autonomous, zero-cost publishing platform built on:

- **Next.js 16** (App Router, Turbopack, ISR)
- **Vercel** (serverless functions, edge, cron jobs)
- **Supabase** (Postgres, auth, storage)
- **Batch processing** (no always-running workers)

The system discovers demand, clusters topics, generates content, optimizes SEO, tracks performance, and self-improves — all without paid external APIs or always-on infrastructure.

This report confirms the architecture is production-ready and capable of scaling toward 1,000,000 quality pages without fundamental changes.

---

## 1. Architecture Overview

```
Demand Discovery → Topic Clustering → Queue Filter → Content Generation → Quality Gate → Publish → ISR → Sitemap → Learning Loop
```

### Core Components

| Component | Responsibility | File |
|-----------|---------------|------|
| Demand Intelligence | Discover + cluster topics | `services/demand/` |
| Content Generation | Template/AI article creation | `jobs/workers/contentGenerationWorker.ts` |
| Quality Gate | Humanization, duplicate, SEO, links, metadata | `services/quality/publishQualityGate.ts` |
| SEO Intelligence | Gaps, internal links, weak clusters | `services/seo/seoIntelligenceEngine.ts` |
| Health Scoring | Performance-based scoring | `services/performance/contentHealthScoring.ts` |
| Auto-Optimization | Re-queue low performers | `services/optimization/autoOptimizationEngine.ts` |
| Affiliate Layer | Product sync + placement | `services/affiliate/` |
| Learning Loop | Orchestrates daily cycle | `services/learning/learningLoop.ts` |
| Scheduler | Runs generation/update queues | `services/execution/jobScheduler.ts` |
| Dashboard | Monitoring UI | `app/(admin)/admin/` |

---

## 2. Scalability Assessment

### 2.1 Compute Model

- **Serverless functions**: Vercel automatically scales to zero and up.
- **No always-running workers**: All heavy work is batch/cron-driven.
- **Configurable rate limits**: `publish_limit_per_run` prevents runaway publishing.
- **Atomic queue claiming**: `claim_queue_item` RPC prevents duplicate processing.

### 2.2 Database Scalability

Supabase Postgres is the primary datastore. The schema is normalized with:

- Language-aware translation tables
- Category/tag many-to-many relationships
- Queue tables with status + priority indexes
- Health/metrics tables partitioned by object

### 2.3 Caching & ISR

- **ISR**: Dynamic pages revalidate every 1 hour (`revalidate: 1h`).
- **Static pages**: Admin, login, sitemap, robots.
- **Edge delivery**: Vercel global CDN serves cached pages.
- **Supabase caching**: Read queries hit PostgREST caching where enabled.

---

## 3. Database Index Audit

Existing indexes cover the hot paths:

- `idx_topics_status`, `idx_articles_status` — filtering by status
- `idx_seo_metadata_object` — metadata lookups
- `idx_update_queue_status` — queue processing
- `idx_performance_metrics_object` — metrics aggregation
- `idx_internal_links_source` / `target` — link graph traversal
- Trigram indexes on titles — full-text similarity
- `idx_demand_signals_scores` — demand sorting
- `idx_affiliate_products_conversion` — product scoring
- `idx_demand_topic_queue_status` — topic queue filtering
- `idx_articles_lifecycle` — lifecycle queries

**Recommendation:** Monitor query performance as data grows. Add partial indexes on `status = 'published'` if necessary. Consider partitioning `performance_metrics` and `execution_logs` by date once they exceed 10M rows.

---

## 4. Cron Job Schedule

| Route | Schedule | Purpose |
|-------|----------|---------|
| `/api/affiliate/sync` | 02:00 UTC | Sync affiliate products |
| `/api/demand/run` | 03:00 UTC | Discover demand + queue topics |
| `/api/jobs/execute` | 04:00 UTC | Process generation/update queues |
| `/api/learning/run` | 05:00 UTC | Health scoring, optimization, SEO intel |

All routes respect the `AUTOMATION_ENABLED` kill switch and `publish_limit_per_run`.

---

## 5. Quality Gate

Before any article is published, it must pass:

1. **Humanization** — no robotic phrases, sentence variety
2. **Duplicate detection** — hash + semantic similarity check
3. **SEO completeness** — valid title, meta, description, length
4. **Metadata** — title + excerpt present
5. **Internal linking** — at least one internal link suggestion generated

If any check fails, the article is **not published** and the queue item is returned for retry or manual review.

---

## 6. Content Lifecycle

Articles have lifecycle states managed by the learning loop:

- `draft` → `published` → `indexed` → `growing` / `stable` / `declining` → `update_required` → `archived`

Only humans can archive; the system never auto-deletes content.

---

## 7. Error Handling & Resilience

- **Queue retry limit**: 3 attempts before marking failed.
- **Atomic claiming**: Prevents concurrent cron collisions.
- **Kill switch**: `AUTOMATION_ENABLED=false` stops all automation.
- **Logging**: `execution_logs` and `system_events` track every run.
- **Graceful degradation**: External demand sources fail silently; internal sources continue.

---

## 8. Multilingual Routing

- `DEFAULT_LANGUAGE` = `en`
- App Router supports `/[lang]` dynamic segments
- `generateStaticParams` pre-renders `en` routes
- All translation tables use `language_code` with foreign keys
- Hreflang + sitemap support for future expansion

---

## 9. Sitemap

- `/api/sitemap` generates sitemap index
- `/robots.txt` is static
- ISR ensures sitemap stays fresh
- New published articles are included automatically on next revalidation

---

## 10. Build Performance

- **Build time**: ~10–11 seconds (Turbopack)
- **Pages generated**: 47 (static + dynamic)
- **TypeScript check**: passes
- **No runtime errors** in build

---

## 11. Security

- RLS enabled on all user tables
- Admin routes protected by auth + role checks
- Cron/API routes protected by `CRON_SECRET` / `JOB_SECRET`
- No hardcoded API keys
- Feature flags disable monetization by default

---

## 12. Known Limitations & Recommendations

| Limitation | Mitigation |
|------------|------------|
| Google Autocomplete may rate-limit | Cached + falls back to Wikipedia/Reddit |
| Google Trends requires paid API | Stub in place; optional integration |
| No full-text search engine | Postgres trigram + GIN indexes; can migrate to Meilisearch later |
| Single language default | Architecture ready for `es`, `fr`, `hi`, etc. |
| Quality gate may reject articles if no related topics | Broaden internal link generation or lower threshold |

---

## 13. Scaling to 1,000,000 Pages

To scale beyond 100K–1M pages, the following operational changes are recommended (no architectural changes):

1. **Vercel Pro**: Higher function limits + bandwidth.
2. **Supabase read replicas**: For analytics-heavy queries.
3. **Partition metrics tables**: By `recorded_at` month.
4. **Add caching layer**: Redis for demand signals and health scores.
5. **Increase publish rate**: `publish_limit_per_run` from 100 to 1000+.
6. **Bulk operations**: Replace per-row updates with batch RPCs.
7. **CDN**: Ensure all static assets are edge-cached.

The current architecture supports these as incremental improvements, not redesigns.

---

## 14. Final Verdict

**Production-ready:** ✅

**Scalable to 1,000,000 pages:** ✅ (with operational scaling above)

**Architecture freeze:** Active. No new business modules should be added without explicit approval.

---

## 15. Environment Variables

Required:

```
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CRON_SECRET=            # or JOB_SECRET
```

Optional:

```
AUTOMATION_ENABLED=true        # kill switch
publish_limit_per_run=100      # rate limit
ENABLE_DEMAND_DISCOVERY=true
ENABLE_AFFILIATE=false
ENABLE_ADSENSE=false
AFFILIATE_API_URLS=            # URL|network|merchant|rate
GOOGLE_TRENDS_API_KEY=         # optional
```
