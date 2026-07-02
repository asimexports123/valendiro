# Phase 11 Implementation Roadmap — Rendering Layer

**Status:** IMPLEMENTED  
**Depends on:** Rendering Architecture v1.0 (FROZEN)  
**Scope:** Long Article + FAQ renderers only. Additional formats deferred to Phase 12.

---

## 1. Database Changes

### New Table: `rendered_outputs`

Stores serialized output alongside cache keys, diagnostics, and quality scores.

```sql
CREATE TABLE rendered_outputs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id      UUID NOT NULL REFERENCES knowledge_packages(id) ON DELETE CASCADE,
  knowledge_hash  TEXT NOT NULL,
  renderer_id     TEXT NOT NULL,           -- "long-article-v1", "faq-v1"
  renderer_version TEXT NOT NULL,          -- "1.0.0"
  template_version TEXT NOT NULL,          -- "1.0.0"
  output_format   TEXT NOT NULL,           -- "html", "markdown"
  style           TEXT[] NOT NULL DEFAULT '{}',
  cache_key       TEXT NOT NULL UNIQUE,    -- hash(knowledge_hash + renderer_version + template_version + format)
  content         TEXT NOT NULL,           -- serialized output
  document_tree   JSONB NOT NULL,          -- intermediate block model
  word_count      INTEGER NOT NULL DEFAULT 0,
  section_count   INTEGER NOT NULL DEFAULT 0,
  citation_count  INTEGER NOT NULL DEFAULT 0,
  quality_score   JSONB NOT NULL,          -- RenderQualityScore
  diagnostics     JSONB NOT NULL,          -- RenderDiagnostics
  render_duration_ms INTEGER NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'stale', 'failed')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_rendered_outputs_package ON rendered_outputs(package_id);
CREATE INDEX idx_rendered_outputs_cache ON rendered_outputs(cache_key);
CREATE INDEX idx_rendered_outputs_status ON rendered_outputs(status);
```

### New Table: `rendering_policies`

Stores category-specific rendering policies.

```sql
CREATE TABLE rendering_policies (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL UNIQUE,
  category_match    TEXT[] NOT NULL DEFAULT '{}',
  required_fact_types TEXT[] NOT NULL DEFAULT '{}',
  preferred_format  TEXT NOT NULL DEFAULT 'long-article',
  preferred_style   TEXT[] NOT NULL DEFAULT '{intermediate}',
  min_fact_count    INTEGER NOT NULL DEFAULT 5,
  min_citation_count INTEGER NOT NULL DEFAULT 1,
  section_overrides JSONB NOT NULL DEFAULT '[]',
  commercial_placeholders BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### No Changes to Existing Tables

- `knowledge_packages` — unchanged
- `knowledge_facts` — unchanged
- `knowledge_citations` — unchanged
- `knowledge_evidence` — unchanged
- `knowledge_provenance` — unchanged
- `knowledge_relationships` — unchanged
- `domain_glossary` — unchanged
- `discovery_*` tables — unchanged

---

## 2. Services

### Service List

| # | Service | File | Responsibility |
|---|---------|------|----------------|
| 1 | **Document Tree Types** | `services/renderer/types.ts` | All TypeScript interfaces for Document Tree nodes, render config, diagnostics, quality score |
| 2 | **Render Rules Engine** | `services/renderer/rulesEngine.ts` | Evaluate package eligibility, select policy, compute block order, detect missing knowledge |
| 3 | **Template Library** | `services/renderer/templates.ts` | Sentence templates, paragraph templates, section templates, transition bank, grammar rules |
| 4 | **Long Article Renderer** | `services/renderer/renderers/longArticle.ts` | Produce Document Tree in long-article format |
| 5 | **FAQ Renderer** | `services/renderer/renderers/faq.ts` | Produce Document Tree in FAQ format |
| 6 | **Section Plugins** | `services/renderer/plugins/*.ts` | Per-fact-type section rendering (definition, property, history, procedure, warning, measurement, comparison) |
| 7 | **Citation Renderer** | `services/renderer/citationRenderer.ts` | Resolve citation references, inject bibliography block |
| 8 | **Internal Link Renderer** | `services/renderer/linkRenderer.ts` | Resolve relationships into internal links |
| 9 | **Quality Scorer** | `services/renderer/qualityScorer.ts` | Score the Document Tree after rendering |
| 10 | **HTML Serializer** | `services/renderer/serializers/html.ts` | Serialize Document Tree to HTML |
| 11 | **Markdown Serializer** | `services/renderer/serializers/markdown.ts` | Serialize Document Tree to Markdown |
| 12 | **Cache Manager** | `services/renderer/cacheManager.ts` | Compute cache keys, check/store/invalidate cache |
| 13 | **Render Orchestrator** | `services/renderer/orchestrator.ts` | Coordinate full pipeline: rules → render → cite → link → score → serialize → cache |
| 14 | **Barrel Export** | `services/renderer/index.ts` | Public API |

---

## 3. Rendering Pipeline — Execution Flow

```
Step 1: RULES EVALUATION
  Input:  KnowledgePackage (from GET /api/knowledge/:id)
  Action: RulesEngine.evaluate(pkg) → RenderDecision
  Output: { eligible, policy, blockOrder, missingKnowledge, warnings }
  Guard:  If not eligible → return diagnostics only, no render

Step 2: CACHE CHECK
  Input:  knowledge_hash + renderer_version + template_version + output_format
  Action: CacheManager.check(cacheKey)
  Output: cached RenderedOutput or null
  Guard:  If cache hit → return cached output immediately

Step 3: RENDER
  Input:  KnowledgePackage + RendererConfig + RenderDecision
  Action: Renderer.render(pkg, config, decision) → DocumentNode[]
  Output: Raw Document Tree (without citations or links resolved)
  Method: Template Library + Section Plugins produce nodes per blockOrder

Step 4: CITATION RENDERING
  Input:  DocumentNode[] + KnowledgeCitationRow[]
  Action: CitationRenderer.decorate(tree, citations)
  Output: Document Tree with CitationRefNode markers resolved + CitationBlockNode appended

Step 5: INTERNAL LINK RENDERING
  Input:  DocumentNode[] + KnowledgeRelationshipRow[]
  Action: LinkRenderer.decorate(tree, relationships)
  Output: Document Tree with InternalLinkNode markers inserted

Step 6: QUALITY SCORING
  Input:  DocumentNode[] + RenderDecision
  Action: QualityScorer.score(tree, decision)
  Output: RenderQualityScore
  Guard:  If score < 40 → status = "failed", store diagnostics only

Step 7: SERIALIZATION
  Input:  DocumentNode[] + OutputFormat
  Action: Serializer.serialize(tree, format)
  Output: string (HTML or Markdown)

Step 8: DIAGNOSTICS
  Input:  All pipeline metadata
  Action: Build RenderDiagnostics object
  Output: Full audit record

Step 9: PERSIST
  Input:  content + document_tree + quality_score + diagnostics
  Action: CacheManager.store(renderedOutput)
  Output: Stored in rendered_outputs table
```

---

## 4. Public Integration

### Topic Pages

Topic pages consume rendered outputs, **not** Knowledge Packages directly:

```
User requests /topics/python-programming-fundamentals
        ↓
Next.js page fetches rendered_output WHERE package.slug = slug AND status = 'published'
        ↓
If found → serve cached HTML
If not found → trigger lazy render → serve result
If stale → serve stale + queue re-render (stale-while-revalidate)
```

### Knowledge Hubs

Hub pages aggregate multiple rendered outputs:

```
User requests /hubs/software-development
        ↓
Fetch all Knowledge Packages linked to this hub via slots
        ↓
For each package → fetch its published rendered_output
        ↓
Assemble hub page from multiple rendered outputs
```

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `GET /api/render/:packageId` | GET | Fetch or trigger render for a package |
| `GET /api/render/:packageId/preview` | GET | Preview render (includes diagnostics + missing knowledge) |
| `POST /api/render/batch` | POST | Trigger batch rendering for multiple packages |

### Rule: No Direct Rendering at Request Time

Public pages serve pre-rendered content from `rendered_outputs`. The only exception is the first request for a never-rendered package (lazy mode), which triggers a render and caches the result.

---

## 5. Render Cache

### Cache Key Computation

```typescript
function computeCacheKey(
  knowledgeHash: string,
  rendererVersion: string,
  templateVersion: string,
  outputFormat: string
): string {
  return sha256(`${knowledgeHash}:${rendererVersion}:${templateVersion}:${outputFormat}`);
}
```

### Cache Invalidation

A cached output becomes **stale** when:

1. The Knowledge Package's `knowledge_hash` changes (package was re-assembled)
2. The `renderer_version` changes (renderer code was updated)
3. The `template_version` changes (template library was updated)

Invalidation is detected by comparing the stored `knowledge_hash` against the current package hash.

### Regeneration Modes

| Mode | Implementation | Phase 11 Scope |
|------|---------------|----------------|
| **Lazy** | On request, check hash. If stale, re-render synchronously. | Yes — primary mode |
| **Eager** | On package update, immediately re-render all outputs. | Yes — for preview |
| **Batch** | Scheduled job scans `rendered_outputs` for stale entries. | Deferred to Phase 12 |

### Render Queue (Future)

Not implemented in Phase 11. When batch rendering is needed:

```
Stale scan → enqueue package IDs → worker processes render queue → update rendered_outputs
```

Phase 11 uses synchronous rendering only.

---

## 6. Verification — Success Criteria

### Unit Tests

| Test | What It Verifies |
|------|-----------------|
| Template variant selection is deterministic | Same slug + index → same variant every time |
| Grammar rules produce correct output | Pluralization, articles, conjugation, list joining |
| Section plugins produce valid DocumentNodes | Each plugin returns well-formed nodes |
| Rules engine correctly evaluates eligibility | Missing facts → ineligible; sufficient facts → eligible |
| Missing knowledge detection is accurate | Flags correct fact types as missing |
| Block priority ordering is deterministic | Same policy → same section order |

### Integration Tests

| Test | What It Verifies |
|------|-----------------|
| Full pipeline produces identical output for identical input | Determinism end-to-end |
| Re-render of unchanged package returns cached output | Cache hit works |
| Re-render after package change produces new output | Cache invalidation works |
| Citation references resolve correctly | Every `[1]` maps to a real citation |
| Quality score is computed and stored | Score present in rendered_outputs |
| Diagnostics are complete | All fields populated |
| HTML serializer produces valid HTML | Well-formed, no broken tags |
| Markdown serializer produces valid Markdown | Renders correctly |

### End-to-End Tests

| Test | What It Verifies |
|------|-----------------|
| Knowledge Package → Long Article → HTML works end-to-end | Full pipeline |
| Knowledge Package → FAQ → HTML works end-to-end | Second format |
| Rendered output is serveable via API | `/api/render/:id` returns content |
| Preview mode shows diagnostics and missing knowledge | Admin view works |
| Stale detection triggers re-render | Hash mismatch detected |

### Measurable Criteria

- Deterministic: 10 consecutive renders of the same package produce byte-identical output
- Quality score: seeded package scores ≥ 60 (Good)
- Render time: < 500ms for a 29-fact package
- Cache hit: < 10ms to serve cached output
- Zero modification to Knowledge Package tables
- Zero modification to Discovery tables
- All existing Phase 9 and Phase 10 tests continue passing

---

## 7. Rollback Strategy

Phase 11 is **completely isolated** from prior phases:

### What Phase 11 Creates

- `rendered_outputs` table (new)
- `rendering_policies` table (new)
- `services/renderer/` directory (new)
- API routes under `/api/render/` (new)

### What Phase 11 Does NOT Modify

- `knowledge_packages` — no changes
- `knowledge_facts` — no changes
- `knowledge_citations` — no changes
- `knowledge_evidence` — no changes
- `knowledge_provenance` — no changes
- `knowledge_relationships` — no changes
- `domain_glossary` — no changes
- `discovery_sources` — no changes
- `discovery_runs` — no changes
- `discovery_candidates` — no changes
- `services/knowledge/` — no changes
- `app/api/knowledge/` — no changes
- `app/preview/knowledge/` — no changes

### Rollback Procedure

1. Drop `rendered_outputs` table
2. Drop `rendering_policies` table
3. Delete `services/renderer/` directory
4. Delete `/api/render/` routes
5. All prior functionality continues unchanged

No migration to existing tables. No column additions. No foreign key modifications to existing tables (except the FK from `rendered_outputs` → `knowledge_packages`, which is in the new table).

---

## 8. Deliverables Checklist

### Database

- [ ] Migration: `rendered_outputs` table
- [ ] Migration: `rendering_policies` table
- [ ] Seed: default rendering policy
- [ ] TypeScript types for new tables in `lib/types.ts`

### Types & Interfaces

- [ ] `services/renderer/types.ts` — DocumentNode, InlineNode, all node types, RenderConfig, RenderDecision, RenderQualityScore, RenderDiagnostics, BlockPriority, MissingKnowledgeFlag, RenderingPolicy

### Core Services

- [ ] `services/renderer/rulesEngine.ts` — Render Rules Engine
- [ ] `services/renderer/templates.ts` — Template Library (sentence, paragraph, section, transitions, grammar)
- [ ] `services/renderer/qualityScorer.ts` — Render Quality Scorer
- [ ] `services/renderer/citationRenderer.ts` — Dedicated Citation Renderer
- [ ] `services/renderer/linkRenderer.ts` — Internal Link Renderer
- [ ] `services/renderer/cacheManager.ts` — Cache Manager

### Renderers

- [ ] `services/renderer/renderers/longArticle.ts` — Long Article renderer
- [ ] `services/renderer/renderers/faq.ts` — FAQ renderer

### Section Plugins

- [ ] `services/renderer/plugins/definitionPlugin.ts`
- [ ] `services/renderer/plugins/propertyPlugin.ts`
- [ ] `services/renderer/plugins/historyPlugin.ts`
- [ ] `services/renderer/plugins/procedurePlugin.ts`
- [ ] `services/renderer/plugins/warningPlugin.ts`
- [ ] `services/renderer/plugins/measurementPlugin.ts`
- [ ] `services/renderer/plugins/comparisonPlugin.ts`

### Serializers

- [ ] `services/renderer/serializers/html.ts` — HTML output
- [ ] `services/renderer/serializers/markdown.ts` — Markdown output

### Orchestrator

- [ ] `services/renderer/orchestrator.ts` — Full pipeline coordination
- [ ] `services/renderer/index.ts` — Barrel export

### API

- [ ] `app/api/render/[packageId]/route.ts` — Fetch or trigger render
- [ ] `app/api/render/[packageId]/preview/route.ts` — Preview with diagnostics

### Verification

- [ ] `scripts/verify-phase11.ts` — Full verification suite

### Documentation

- [ ] Update `docs/IMPLEMENTATION_ROADMAP_V2.md` — Phase 11 status

---

## Implementation Order

The deliverables should be implemented in this sequence:

1. **Types** — all interfaces and node definitions
2. **Database** — migration + seed + TypeScript types
3. **Template Library** — sentence/paragraph/section templates + grammar rules
4. **Section Plugins** — one per fact type
5. **Renderers** — Long Article first, then FAQ
6. **Citation Renderer** — dedicated citation decoration
7. **Link Renderer** — internal link injection
8. **Rules Engine** — eligibility + policy + block ordering
9. **Quality Scorer** — post-render scoring
10. **Serializers** — HTML first, then Markdown
11. **Cache Manager** — cache key computation + storage
12. **Orchestrator** — full pipeline coordination
13. **API Routes** — render + preview endpoints
14. **Verification** — comprehensive test suite

---

## Engineering Rules (Inherited)

All 11 rules from the frozen Rendering Architecture apply:

1. Knowledge Package is the single source of truth
2. Renderers are pure functions
3. Document Tree is the intermediate representation
4. Citations rendered by dedicated Citation Renderer
5. Composite cache keys
6. Missing Knowledge flagged, not fabricated
7. Quality scored and auditable
8. Plugins extend without modifying core
9. Commercial placeholders reserved, not implemented
10. Localization is serializer-level
11. **The Renderer must never make business decisions**

### System Separation

```
KNOWLEDGE → PRESENTATION → BUSINESS
```

These three systems never cross boundaries.
