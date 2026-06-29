# Knowledge Intelligence Engine

This document describes the backend intelligence layer that transforms Knowledge OS from a content management system into a self-organizing knowledge intelligence platform.

## Overview

The Intelligence Engine is a modular backend layer that operates purely on data, relationships, and scoring. It does not generate UI or handle CRUD screens. It provides the decision-making foundation for future AI automation and content pipelines.

## Components

### 1. Knowledge Graph Engine

Location: `services/intelligence/knowledgeGraphService.ts`

Purpose: model relationships between any knowledge object as a generic graph.

Key tables:
- `knowledge_relationships` — generic edges between topics, questions, entities, articles, and knowledge objects.

Relationship types:
- `belongs_to`, `answers`, `explains`, `references`, `related_to`, `prerequisite`, `follow_up`, `sibling`, `parent`, `child`

Key functions:
- `createRelationship(input)` — create a graph edge
- `getRelationshipsForObject(...)` — incoming/outgoing/both edges for a node
- `findRelatedObjects(...)` — find neighbors with optional relationship type and strength filter
- `findUnderdevelopedTopics(limit)` — find published topics with few relationships (uses `find_underdeveloped_topics` SQL function)
- `buildObjectGraph(...)` — build a first-degree graph around a node

### 2. Search Intent Classification Engine

Location: `services/intelligence/intentClassificationService.ts`

Purpose: classify every question into one of four search intents.

Intent types:
- `informational`
- `commercial`
- `transactional`
- `navigational`

Storage:
- `questions.intent_type`

Classification uses keyword heuristics (replaceable with an ML model later):
- Transactional keywords: buy, purchase, price, deal, subscribe, etc.
- Commercial keywords: best, top, review, compare, alternative, etc.
- Navigational keywords: login, official, support, phone number, etc.
- Default: informational

Key functions:
- `classifyIntentFromText(text)` — pure classification helper
- `classifyQuestionIntent(questionId)` — classify and store a single question
- `batchClassifyQuestionIntents(limit)` — classify all unclassified questions
- `getIntentDistribution()` — aggregate intent counts

### 3. Content Scoring Engine

Location: `services/intelligence/contentScoringService.ts`

Purpose: score every knowledge object across multiple dimensions and compute an overall priority score.

Storage:
- `content_scores` — one row per `(object_id, object_type, language_code)`

Score fields:
- `search_volume_score` (0–100)
- `competition_score` (0–100)
- `affiliate_potential_score` (0–100)
- `ctr_estimate_score` (0–100)
- `freshness_score` (0–100)
- `overall_priority_score` (0–100)

Weight formula:
```
overall_priority_score =
  search_volume_score * 0.30 +
  competition_score * 0.15 +
  affiliate_potential_score * 0.25 +
  ctr_estimate_score * 0.15 +
  freshness_score * 0.15
```

Key functions:
- `calculateAndSaveScore(input)` — compute and upsert score
- `getScoreForObject(...)` — retrieve a score
- `getTopPriorityObjects(...)` — list highest-priority objects
- `deleteScore(id)` — remove a score

### 4. Content Decision Engine

Location: `services/intelligence/contentDecisionEngine.ts`

Purpose: decide what content should be created, updated, or ignored, and manage the work queues.

Storage:
- `content_priority_queue` — evaluation decisions with `decision_type` (`create`, `update`, `ignore`)
- `content_generation_queue` — proposed new content items
- `content_update_queue` — proposed content refresh items

Key functions:
- `evaluateAndQueue(input)` — upsert a create/update/ignore decision for an object
- `enqueueContentGeneration(...)` — add a new content idea to the generation queue
- `enqueueContentUpdate(...)` — add an existing object to the update queue
- `getPendingDecisions(limit)` — list pending priority decisions
- `approveDecision(id)` / `rejectDecision(id)` — change priority decision status
- `getQueueItems(type, status, limit)` — list generation/update/priority queue items
- `runContentOpportunityScan(...)` — scan for unscored objects and queue them for review

### 5. Internal Linking Engine

Location: `services/intelligence/internalLinkingEngine.ts`

Purpose: suggest internal links that connect related content and strengthen topic clusters.

Storage:
- `internal_link_suggestions` — auto-generated suggestions awaiting approval
- `internal_links` — approved links (existing table)

Suggestion signals:
- Shared category membership (via `get_object_category_ids` and `find_objects_by_category_ids` SQL functions)
- Topic cluster membership (via `knowledge_relationships`)
- Relevance score and cluster strength score

Key functions:
- `createLinkSuggestion(input)` — create a suggestion manually or from another engine
- `getSuggestionsForSource(...)` — list suggestions for a given object
- `approveSuggestion(id)` / `rejectSuggestion(id)` — change suggestion status
- `generateSuggestionsForObject(...)` — auto-generate suggestions based on shared categories
- `buildTopicClusterLinks(topicId, languageCode)` — generate links between all members of a topic cluster

## Database Additions

Migration: `database/migrations/000002_intelligence_engine.sql`

New tables:
- `content_scores`
- `knowledge_relationships`
- `content_generation_queue`
- `content_update_queue`
- `content_priority_queue`
- `internal_link_suggestions`

Modified tables:
- `questions.intent_type`

RLS policies: `database/policies/intelligence_rls_policies.sql`
Triggers: `database/triggers/intelligence_triggers.sql`
Helper functions: `database/functions/intelligence_functions.sql`

## Scalability Notes

- All score and relationship tables are indexed by `object_id`, `object_type`, and `language_code`.
- Priority queue indexes sort by `priority_score` descending for fast top-N retrieval.
- Relationship table uses a composite unique key to prevent duplicate edges.
- Scoring is idempotent via `upsert` on `(object_id, object_type, language_code)`.
- SQL helper functions keep complex graph/cluster queries in the database layer.

## AI / Automation Readiness

The engines are designed to be plugged into future AI workers:
- `batchClassifyQuestionIntents` can be replaced by an NLP model without changing the schema.
- `calculateAndSaveScore` can ingest external SEO/keyword data.
- `evaluateAndQueue` can be called by a scheduler that scans for opportunities.
- `generateSuggestionsForObject` and `buildTopicClusterLinks` can be enhanced with embeddings.

## Next Steps

1. Backfill scores and intent classifications for existing content.
2. Schedule a daily job to run `runContentOpportunityScan` and `buildTopicClusterLinks`.
3. Connect the decision queues to future content generation workers.
4. Add external keyword/SEO data ingestion to feed the scoring engine.
