# Canonical Components - Phase 1 Production Audit Report

## Status Legend
- **ACTIVE**: Currently used in production
- **LEGACY**: Old code still present but not actively used
- **DEPRECATED**: Should be removed
- **DUPLICATE**: Duplicate functionality exists elsewhere

## Pipeline Systems

### Canonical Production Pipeline
**`/app/api/cron/autonomous-pipeline/route.ts`** - **ACTIVE**
- Runs every 4 hours via Vercel Cron or external scheduler
- Full content lifecycle without human intervention:
  1. Generate topics for subcategories
  2. Quality-check draft articles → promote passing ones
  3. Inject internal links
  4. Drip-publish ready articles
- Uses services: topicAutoGenerator, qualityGuardrails, contentLinkInjector, dripPublisher

### Manual Pipeline Trigger
**`/app/api/admin/pipeline/run/route.ts`** - **ACTIVE**
- Manual pipeline trigger with stages: full, discover, topics, articles, images, links
- Uses autonomousPublishingEngine
- More comprehensive than dashboard version

### Dashboard Pipeline Routes
**`/app/api/admin/dashboard/dashboard/pipeline/run/route.ts`** - **DUPLICATE**
- Simple pipeline run endpoint
- Just calls runFullPublishingCycle()
- Duplicate of `/api/admin/pipeline/run/route.ts` - should use admin version

**`/app/api/admin/dashboard/dashboard/pipeline-status/route.ts`** - **ACTIVE**
- Returns queue sizes and status for pipeline stages
- Used by dashboard for pipeline status display

## Rendering Paths

### Primary Rendering System
**`/services/renderer/`** - **ACTIVE**
- Complex rendering system with orchestrator
- Contains: orchestrator.ts, qualityScorer.ts, compositionPlanner.ts, etc.
- Used by autonomous rendering

### Secondary Rendering Path
**`/services/rendering/autonomousRendering.ts`** - **DUPLICATE**
- Simpler autonomous rendering
- Imports from `/services/renderer/orchestrator`
- Functionality overlaps with primary renderer
- Should be consolidated into primary renderer

## Publishing Paths

**`/services/publishing/`** - **ACTIVE**
- Single publishing path
- Contains dripPublisher, qualityGuardrails, featuredImageService

## Discovery Paths

**`/services/discovery/`** - **ACTIVE**
- Single discovery path
- Contains RSS connectors and discovery logic

## API Routes Classification

### Dashboard APIs
- `/api/admin/dashboard/dashboard/stats` - **ACTIVE**
- `/api/admin/dashboard/dashboard/articles` - **ACTIVE**
- `/api/admin/dashboard/dashboard/pipeline-status` - **ACTIVE**
- `/api/admin/dashboard/dashboard/automation/status` - **ACTIVE**
- `/api/admin/dashboard/dashboard/automation/toggle` - **ACTIVE**
- `/api/admin/dashboard/dashboard/pipeline/run` - **DUPLICATE** (use admin version instead)

### Article APIs
- `/api/admin/articles/[id]/approve` - **UNKNOWN** (needs audit)
- `/api/admin/articles/relink-topics` - **UNKNOWN** (needs audit)

### Other APIs
- `/api/admin/delete` - **UNKNOWN** (needs audit)
- `/api/admin/pipeline/run` - **ACTIVE** (canonical pipeline trigger)

## Pages

### Admin Pages
- `/admin/dashboard` - **ACTIVE** (main admin dashboard)
- `/admin/dashboard/articles` - **ACTIVE** (articles management)
- `/admin` - **ACTIVE** (redirect to dashboard)

### Parallel Route
- `/(admin)/admin/dashboard` - **DEPRECATED** (causes routing conflict, should be removed)

## Summary of Issues Found

### Duplicate Components
1. **Pipeline Run Endpoints**: `/api/admin/pipeline/run/route.ts` vs `/api/admin/dashboard/dashboard/pipeline/run/route.ts`
2. **Rendering Paths**: `/services/renderer/` vs `/services/rendering/`

### Deprecated Components
1. **Parallel Admin Route**: `/(admin)/admin/dashboard` - causes routing conflicts

### Unknown Components
1. Article approval and relinking APIs
2. Delete API implementation
3. Various pipeline sub-routes (debug-write, evaluate, providers, test-run)

## Recommendations

### Immediate Actions
1. Remove `/(admin)/admin/dashboard` to fix routing conflicts
2. Consolidate rendering paths - move autonomousRendering.ts into renderer/ or deprecate
3. Use `/api/admin/pipeline/run/route.ts` as canonical pipeline trigger, remove dashboard duplicate

### Phase 2 Actions
1. Audit unknown API routes
2. Verify deployment configuration
3. Test canonical pipeline execution

## Last Updated
2026-07-07
