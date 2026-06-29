# Demand Intelligence Layer

This document describes the demand-aware layer that continuously feeds the execution engine with content opportunities.

## Overview

The Demand Intelligence Layer observes internal and external demand signals, detects gaps in the knowledge graph, and pushes high-value opportunities into the `content_generation_queue`. It operates without UI and without manual content planning.

## Flow

```
Demand Sources
  ├── Internal Search Intent  ──> Demand Signals ──┐
  ├── Seasonal Trends                               │
  └── External APIs (future)                        │
                                                    v
                                          Topic Gap Detection
                                                    │
                                                    v
                                          Opportunity Generator
                                                    │
                                                    v
                                          Priority Boosting
                                                    │
                                                    v
                                          Automatic Queue Feeder
                                                    │
                                                    v
                                          content_generation_queue
```

## Components

### 1. Demand Sources Layer

Location: `services/demand/demandSources.ts`

#### Internal Search Intent Simulation
- Analyzes the `questions` table
- Assigns `volume_score` based on intent type:
  - transactional = 90
  - commercial = 80
  - navigational = 60
  - informational = 50
- Assigns `affiliate_potential_score` based on commercial intent
- Stores rows in `demand_signals` with `signal_type = 'search_intent'`

#### External Trend Input Hooks
- `captureExternalTrend(input)` — generic interface for future APIs
- Designed for Google Trends, Search Console, affiliate trend APIs

#### Seasonal Trends
- Hardcoded seasonal calendar (summer guide, holiday tips, etc.)
- `captureSeasonalTrends(languageCode)` scores relevance by current month
- Stored with `signal_type = 'seasonal'`

### 2. Topic Gap Detection Engine

Location: `services/demand/topicGapDetection.ts`

SQL functions: `database/functions/demand_intelligence_functions.sql`

- `calculate_topic_gap_scores(language_code)` — computes coverage, intent, gap, and opportunity scores per topic
- `find_high_opportunity_topics(...)` — returns topics with high opportunity and no published article
- `find_high_intent_unanswered_questions(...)` — commercial/transactional questions missing articles
- `find_underdeveloped_clusters(...)` — topics with few graph relationships

Opportunity score formula:
```
coverage = questions*15 + articles*30 + relationships*10 (capped at 100)
gap = 100 - coverage
opportunity = gap*0.5 + intent*0.3 + (100 - articles*30)*0.2
```

### 3. Content Opportunity Generator

Location: `services/demand/opportunityGenerator.ts`

- Generates opportunities from `demand_signals`
- Generates opportunities from `topic_gap_scores`
- Creates a structured opportunity object with title, object type, priority score, and reason

### 4. Priority Boosting System

Location: `services/demand/priorityBoosting.ts`

Weighted score formula:
```
boosted_score = base*0.3
              + volume*0.30
              + affiliate*0.25
              + (100 - competition)*0.20
              + seasonal*0.15
              + trend*0.10
```

Seasonal multiplier:
- score >= 80 → 1.3x
- score >= 60 → 1.15x
- score >= 40 → 1.05x

### 5. Automatic Queue Feeder

Location: `services/demand/autoQueueFeeder.ts`

Orchestrates the full pipeline:
1. Capture internal search intent demand
2. Capture seasonal trends
3. Calculate topic gap scores
4. Generate opportunities from demand signals
5. Generate opportunities from topic gaps
6. Push high-priority opportunities to `content_generation_queue`

Entry point: `runDemandPipeline(options)`

API trigger: `POST /api/demand/run` with `X-Job-Secret` or admin session.

## Database Additions

Migration: `database/migrations/000004_demand_intelligence.sql`

New tables:
- `demand_signals` — raw demand signals
- `topic_gap_scores` — computed gap/opportunity per topic
- `trend_scores` — trend scores per object (future external data)
- `opportunity_sources` — metadata for configured demand sources

## Triggering

### Manual API call
```bash
curl -X POST https://knowledge-os-gray.vercel.app/api/demand/run \
  -H "X-Job-Secret: your-job-secret"
```

### Combined with execution engine
```bash
# 1. Feed queue with demand opportunities
curl -X POST https://knowledge-os-gray.vercel.app/api/demand/run \
  -H "X-Job-Secret: your-job-secret"

# 2. Execute generation and update workers
curl -X POST https://knowledge-os-gray.vercel.app/api/jobs/execute \
  -H "X-Job-Secret: your-job-secret"
```

## Next Steps

1. Set `JOB_SECRET` environment variable.
2. Connect real external APIs (Google Trends, Search Console, affiliate trends) via `captureExternalTrend`.
3. Schedule pipeline with Vercel Cron or external scheduler.
4. Backfill scores and intent classifications for existing questions/topics.
