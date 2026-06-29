# Zero-Cost / Ultra-Low-Cost Architecture

This document describes the cost-optimized, scalable architecture redesign for Knowledge OS.

## Goal

Run the entire production system on free-tier infrastructure with a maximum monthly budget of ₹0–₹1000.

## Principles

- No always-running services
- No background daemons
- No per-request heavy computation
- No paid external APIs for core flow
- Precompute everything via cron jobs
- Cache aggressively at every layer

## Architecture Overview

```
User Request
    │
    ▼
Vercel Edge / CDN (static/ISR pages)
    │
    ▼
API Route with Cache-Control (1h static, 24h sitemap)
    │
    ▼
Supabase (only on cache miss or write)
```

## Precomputed Architecture

All expensive work happens offline:

- Knowledge graph scoring → batch SQL function + cron
- Content decisions → batch generation via `/api/demand/run`
- Content generation → batch processing via `/api/jobs/execute`
- Priority updates → batch recomputation via cron

No runtime heavy computation is performed on user requests.

## Cron-Based Batch System

Configured in `vercel.json`:

| Cron | Path | Frequency | Purpose |
|------|------|-----------|---------|
| Demand pipeline | `/api/demand/run` | Daily at 03:00 UTC | Capture demand signals, detect gaps, feed queue |
| Execution pipeline | `/api/jobs/execute` | Daily at 04:00 UTC | Process top 10 generation + 10 update items |

Batch limits per run:
- Generation: 10 items
- Update: 10 items
- Priority decisions: 10 items

Cron authentication uses the `CRON_SECRET` environment variable automatically injected by Vercel.

**Note:** Vercel Hobby (free tier) limits cron jobs to daily frequency. For more frequent runs (e.g., hourly), trigger the API endpoints manually or via an external free cron service using the `CRON_SECRET` token. The system is designed to process batches idempotently, so calling it more frequently is safe.

## Template-Based Content Generation (No AI Required)

AI is removed from the core pipeline. Content is generated deterministically using templates:

- `services/templates/articleTemplateEngine.ts` — entry point
- `services/templates/informationalTemplate.ts`
- `services/templates/faqTemplate.ts`
- `services/templates/comparisonTemplate.ts`
- `services/templates/affiliateTemplate.ts`

AI remains optional: only items with `priority_score >= 98` and `metadata.enable_ai = true` use the AI generator. This limits AI usage to the top 1% of high-priority content.

## Caching Strategy

### 1. Next.js ISR
All public pages have `export const revalidate = 3600` (1 hour).
The `[lang]` layout exports `generateStaticParams` for all supported languages.

### 2. API Route Caching
All public GET API routes return `Cache-Control: public, max-age=3600, s-maxage=3600, stale-while-revalidate=7200`.
The sitemap is cached for 24 hours.

Helper: `lib/utils/cache.ts`

### 3. Edge Caching
Vercel automatically caches responses at edge nodes for static and ISR pages. Cache-Control headers extend this to API routes.

Target: **90% of user requests should NOT hit the database**.

## Supabase Optimization

Migration: `database/migrations/000005_cost_optimization_indexes.sql`

Added indexes for:
- `status` on all content tables
- `category_id`, `topic_id`, `intent_type`
- `published_at` on all content tables
- `language_code` on all translation tables
- `priority_score` on all queue tables
- `overall_priority_score` on content_scores
- Composite indexes on demand signals and relationship tables

These indexes reduce query cost and execution time, keeping the database within free-tier limits.

## Lightweight Queue System

- Database-driven (no Redis)
- Processed in batches via Vercel Cron
- Idempotent via atomic `claim_queue_item` SQL function
- Prevents duplicate processing across concurrent cron runs

The `claim_queue_item` function atomically transitions a queue item to `in_progress` and returns it only if the transition succeeds.

## Cost Control Design

| Component | Cost Strategy |
|-----------|---------------|
| Hosting | Vercel free tier (Hobby) |
| Database | Supabase free tier |
| Compute | No always-running workers |
| Cron | Vercel Cron (included in Pro; free via external cron if needed) |
| AI | Optional only; not required |
| Caching | Free Vercel edge + browser cache |

## Edge-First Delivery

- Static generation preferred over SSR
- ISR revalidates hourly
- API routes cache responses
- CDN serves cached pages globally

## Next Steps

1. Set `CRON_SECRET` environment variable in Vercel dashboard.
2. Verify cron jobs are running in Vercel logs.
3. Monitor Supabase usage to stay within free-tier limits.
4. Add real content to public pages for full ISR benefit.
