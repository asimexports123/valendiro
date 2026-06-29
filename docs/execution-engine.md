# Autonomous Execution Engine

This document describes the execution layer that turns Knowledge OS decisions into real actions.

## Overview

The Intelligence Engine produces decisions and queues them. The Execution Engine reads those queues, runs workers, and creates/updates content drafts. It does not publish automatically — all output is stored as drafts for review.

## Architecture

```
content_priority_queue  ----->  Priority Execution Engine  ----->  content_generation_queue
                                      |                              |
                                      v                              v
                           execution_logs                         Content Generation Worker
                                                                      |
                                                                      v
                                                                  articles (draft)

content_update_queue  ----->  Content Update Worker  ----->  article_translations (refreshed)
```

## Components

### 1. Content Generation Worker

Location: `jobs/workers/contentGenerationWorker.ts`

- Reads `content_generation_queue` where `status = 'pending'` and `retry_count < 3`
- Sorts by `priority_score` descending
- Calls the AI content generator abstraction (`services/ai/aiContentGenerator.ts`)
- Creates an `articles` row with `status = 'draft'`
- Inserts an `article_translations` row with generated title, excerpt, content, and SEO metadata
- Marks queue item `completed` on success
- Increments `retry_count` and logs failure on error

Entry point: `runContentGenerationWorker(limit = 5)`

### 2. Content Update Worker

Location: `jobs/workers/contentUpdateWorker.ts`

- Reads `content_update_queue` where `status = 'pending'` and `retry_count < 3`
- Sorts by `priority_score` descending
- Currently supports `object_type = 'article'`
- Fetches the existing English article translation
- Regenerates improved content using the AI abstraction
- Updates the translation content, excerpt, meta title, and meta description
- Marks queue item `completed` on success
- Increments `retry_count` and logs failure on error

Entry point: `runContentUpdateWorker(limit = 5)`

### 3. Priority Execution Engine

Location: `services/execution/priorityExecutionEngine.ts`

- Reads `content_priority_queue` where `status = 'approved'` and `retry_count < 3`
- Sorts by `priority_score` descending
- Executes top N decisions:
  - `create` → enqueues a new item in `content_generation_queue`
  - `update` → enqueues a new item in `content_update_queue`
  - `ignore` → marked as done, no action
- Logs each execution step
- Auto-approve helper: `autoApproveHighPriorityDecisions(threshold = 80)`

Entry point: `executePriorityDecisions({ topN = 10 })`

### 4. Job Scheduler

Location: `services/execution/jobScheduler.ts`

Orchestrates one full cycle:
1. Auto-approve high-priority decisions
2. Execute approved priority decisions
3. Run content generation worker
4. Run content update worker

Entry point: `runSchedulerCycle(options)`

API trigger: `POST /api/jobs/execute` with header `X-Job-Secret` (if `JOB_SECRET` env var is set) or admin session.

### 5. Execution Logger

Location: `services/execution/executionLogger.ts`

- Writes every step to `execution_logs`
- Fields: queue_type, queue_item_id, object_id, action, status, message, metadata, duration_ms
- Supports querying by queue item or recent status

### 6. AI Integration Layer (Prep)

Location: `services/ai/aiContentGenerator.ts`

- `AIContentGenerator` interface
- `PlaceholderAIContentGenerator` deterministic implementation until external AI is wired
- `setAIContentGenerator` / `getAIContentGenerator` for swapping in real providers

Prompt templates: `services/ai/prompts/`
- `buildSEOPrompt`
- `buildAffiliatePrompt`
- `buildExplainerPrompt`
- `buildComparisonPrompt`
- `buildFAQPrompt`

To integrate a real AI provider, implement `AIContentGenerator` and call `setAIContentGenerator(new YourProvider())` at app startup.

## Database Additions

Migration: `database/migrations/000003_execution_engine.sql`

- Added `retry_count`, `failed_reason`, `processing_started_at` to all queue tables
- Added processing indexes
- Created `execution_logs` table
- Added RLS policy for `execution_logs` (admin/editor only)

## Retry Logic

- Max retries per queue item: 3
- On failure, the queue item is reset to `pending` and `retry_count` is incremented
- `failed_reason` stores the error message
- `execution_logs` records every attempt
- `isRetryable(errorMessage)` helper identifies transient errors (timeout, rate limit, network)

## Triggering Execution

### Manual API call
```bash
curl -X POST https://knowledge-os-gray.vercel.app/api/jobs/execute \
  -H "X-Job-Secret: your-job-secret"
```

### Vercel Cron (future)
Add to `vercel.json`:
```json
{
  "crons": [
    { "path": "/api/jobs/execute", "schedule": "0 */6 * * *" }
  ]
}
```

## Next Steps

1. Set `JOB_SECRET` environment variable for secure cron/API access.
2. Implement a real `AIContentGenerator` provider (OpenAI, Anthropic, etc.).
3. Wire Vercel Cron or an external scheduler to call `/api/jobs/execute`.
4. Add notification webhooks for completed/failed jobs.
5. Build a lightweight admin monitor page (optional, not part of this phase).
