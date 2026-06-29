# Self-Learning SEO + Affiliate Revenue Optimization Layer

This document describes the final intelligence layer that transforms Knowledge OS into a self-learning, revenue-optimizing content platform.

## Architecture

The system runs as a daily batch loop triggered by `/api/learning/run`:

```
Publish → Track → Analyze → Re-optimize → Update → Re-publish
```

## Components

### 1. Performance Metrics

- Table: `performance_metrics` (existing)
- Tracked metrics: views, unique views, CTR, bounce rate, avg time on page, affiliate clicks
- Metrics are aggregated by `services/performance/contentHealthScoring.ts` over a 30-day window.

### 2. Content Health Scores

- Table: `content_health_scores`
- Precomputed scores per object/language:
  - **SEO score** (meta, word count, internal links)
  - **Engagement score** (views, bounce rate, time on page, CTR)
  - **Revenue score** (affiliate links, clicks, conversion rate)
  - **Freshness score** (based on content age)
  - **Overall health score** (weighted composite)
- SQL helper: `get_objects_for_health_scoring`, `get_object_metrics`
- Service: `services/performance/contentHealthScoring.ts`

### 3. Auto-Optimization Engine

- Service: `services/optimization/autoOptimizationEngine.ts`
- Automatically re-queues:
  - Low health content (< 50 overall health)
  - SEO decay (low SEO + stale content)
  - High affiliate potential but low revenue
- Uses `enqueueContentUpdate` to push into `content_update_queue`.

### 4. Affiliate Revenue Optimization

- Table: `affiliate_conversions`
- Service: `services/affiliate/affiliateRevenueOptimizer.ts`
- Detects high affiliate potential content
- Suggests product placements (inline, sidebar, footer) based on context matching
- Tracks estimated revenue per product per content object
- SQL helper: `get_affiliate_opportunities`

### 5. Human Touch Layer

- Service: `services/humanization/humanizationProcessor.ts`
- Every generated or updated article passes through this processor before publish.
- Rules applied:
  - Removes robotic transitions
  - Adds hedging phrases ("generally", "in most cases", etc.)
  - Adds light opinion tone where appropriate
  - Varies sentence structure
  - Ensures readability

### 6. Duplicate Content Protection

- Table: `duplicate_content_detections`
- Service: `services/seo/duplicateContentDetector.ts`
- Hash-based exact duplicate detection
- Jaccard similarity semantic check (threshold 75%)
- Prevents near-duplicate content in the same topic cluster
- SQL helper: `get_content_for_duplicate_check`

### 7. SEO Intelligence Engine

- Tables: `seo_keyword_gaps`, `internal_link_suggestions`
- Service: `services/seo/seoIntelligenceEngine.ts`
- Identifies keyword gaps from topic titles
- Suggests internal links between related objects
- Detects weak topic clusters
- SQL helpers: `identify_keyword_gaps`, `suggest_internal_links`, `find_weak_topic_clusters`

### 8. Learning Loop Orchestrator

- Service: `services/learning/learningLoop.ts`
- Runs the full cycle:
  1. Calculate content health scores
  2. Run auto-optimization
  3. Run affiliate optimization
  4. Run SEO intelligence
  5. Run duplicate detection scan
  6. Execute priority/generation/update queues
- API route: `app/api/learning/run/route.ts`
- Cron: `vercel.json` schedules `/api/learning/run` daily at 05:00 UTC

### 9. Affiliate Product Auto-Import System

A self-updating product intelligence layer that ingests affiliate products from external sources and makes them available for content generation.

#### Connectors
- `services/affiliate/connectors/baseConnector.ts` — shared interface and multi-network config loader
- `services/affiliate/connectors/genericJsonConnector.ts` — any JSON API endpoint
- `services/affiliate/connectors/csvConnector.ts` — manual CSV import
- `services/affiliate/connectors/amazonConnector.ts` — Amazon PA-API stub for future integration

Configuration via environment variable:
```
AFFILIATE_API_URLS=https://api1.com/products|network1|Merchant1|0.05;https://api2.com/products|network2|Merchant2|0.03
```

#### Auto Sync Engine
- Service: `services/affiliate/syncEngine.ts`
- API route: `/api/affiliate/sync` (GET + POST for CSV)
- Cron: daily at 02:00 UTC
- Fetches products, deduplicates by `source_network` + `external_id`/`product_url`, upserts into `affiliate_products`, and creates English translations.

#### Product Intelligence Scoring
- Service: `services/affiliate/productScoring.ts`
- Calculates `conversion_score` from:
  - Relevance to topic keywords
  - Estimated CTR (price, category signals)
  - Commission potential
- Scores are stored back on `affiliate_products`.

#### Content Integration
- Service: `services/affiliate/productFinder.ts`
- Finds top 3 relevant products for each article title at generation time.
- `contentGenerationWorker` passes these products into the template engine.
- Templates dynamically inject product blocks:
  - Informational: 3 products before conclusion
  - FAQ: 2 products before summary
  - Comparison: products as compared options + 3 product block
  - Affiliate: top 3 products as top picks
- Affiliate link cap: max 3 products per article to avoid spam.

#### Affiliate Revenue Optimization
- `affiliateRevenueOptimizer.ts` now orders products by `conversion_score` and limits links per object to 3.
- Existing links are counted before inserting new ones.

### 10. Autonomous Demand Intelligence & Publishing Engine

The final component that decides what to write before any content is generated.

#### Pipeline

```
Demand Discovery → Topic Clustering → Queue Filtering → Content Generation → Humanization → Duplicate Check → SEO Metadata → Internal Linking → Publish → Sitemap → Learning Loop
```

#### Demand Sources
- `services/demand/externalDemandSources.ts`
  - **Google Autocomplete**: `fetchGoogleAutocomplete()` — public suggestion endpoint
  - **Google Trends**: `fetchGoogleTrends()` — stub for official API integration
  - **Wikipedia Pageviews**: `fetchWikipediaPageviews()` — free Wikimedia API
  - **Reddit Discussions**: `fetchRedditDiscussions()` — public subreddit hot posts
  - **Internal search intent**: existing question analysis
  - **Seasonal trends**: calendar-based signals

#### Topic Clustering
- `services/demand/topicClustering.ts`
- Groups demand signals by Jaccard similarity on significant keywords
- Auto-generates cluster name from top keywords
- Auto-creates categories if they do not exist
- Assigns cluster IDs to signals

#### Topic Queue Filtering
- `services/demand/demandTopicQueue.ts`
- Filters out exact duplicates (normalized keyword match)
- Filters out near-duplicates / cannibalized topics (70% word overlap)
- Only high opportunity score clusters enter `demand_topic_queue`
- Statuses: `pending`, `approved`, `rejected`, `duplicate`, `cannibalized`

#### Autonomous Publishing Orchestrator
- `services/demand/autonomousPublishingEngine.ts`
- Runs the full pipeline
- Promotes approved demand topics to `content_generation_queue`
- Can optionally publish articles directly via `publishApprovedDemandArticles()`
- API route: `POST /api/demand/run`
- Cron: `vercel.json` schedules `/api/demand/run` daily at 03:00 UTC

#### Feature Flags
- `ENABLE_AFFILIATE=false` by default
- `ENABLE_ADSENSE=false` by default
- `ENABLE_DEMAND_DISCOVERY=true` by default
- Set in Vercel environment variables to enable monetization later.

#### Demand Intelligence Dashboard
- `/admin/demand-intelligence`
- Shows discovered keywords, queued topics, rejected/duplicate/cannibalized topics, categories created, pending clusters
- Added to admin navigation

### 11. Admin Dashboard UI

Pages added under `/admin`:
- `/admin/dashboard` — Overview metrics
- `/admin/demand-intelligence` — Demand discovery, topic clusters, queue status
- `/admin/performance` — Top and low performing content
- `/admin/seo-insights` — Keyword gaps and internal link suggestions
- `/admin/affiliate-revenue` — Estimated revenue and top products
- `/admin/queue-monitor` — Generation, update, and priority queues
- `/admin/system-logs` — Execution logs

Design:
- SaaS-style card layout
- Dark mode toggle
- Mobile responsive sidebar
- Fast loading, no heavy UI libraries

## Zero-Cost Compatibility

- All heavy work is batch-processed via cron
- No always-running workers
- No paid external APIs used
- Caching and Supabase indexes from previous optimization remain intact
- Daily cron frequency matches Vercel Hobby free tier

## Next Steps

1. Verify `CRON_SECRET` is set in Vercel environment.
2. Run the learning loop once manually to validate data flow.
3. Feed real performance metrics (or simulated metrics) into `performance_metrics`.
4. Monitor dashboard and refine scoring weights.
