# Valendiro Architecture — LOCKED

**Status:** FROZEN as of Phase 0 implementation.  
**Unlock criteria:** critical production issue, data integrity, security, or proven scaling limitation only.

## Canonical flow

```
Knowledge Connector → Knowledge Source Adapter → KnowledgeAsset
  → Verification → Knowledge Extraction → ExtractionArtifact
  → Package Writer ∥ Graph Writer → Projection Engine → Publication → Reader Experiences
```

## Golden rule

No human, AI, admin, script, worker, or cron may publish directly.

## Canonical writers (only)

| Table | Module |
|-------|--------|
| `knowledge_packages` | `services/knowledge/packageService.ts` |
| `knowledge_graph_nodes` | `services/knowledge/graphService.ts` |
| `rendered_outputs` / projections | `services/render/writers.ts` |
| `topics`, `topic_translations` | `services/publish/writers.ts` |

## Retired (Phase 0+)

- Demand pipeline (`services/demand/*`, `/api/demand/*`, `/api/cron/autonomous-pipeline`)
- Direct topic/article publish bypasses

## Phase gates (every merge)

Compile · Tests · Golden integration tests · DB validation · Browser · Production · Rollback plan
