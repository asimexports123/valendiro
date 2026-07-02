# Implementation Roadmap v2 — Knowledge Package Pipeline

> **Status: APPROVED**
> **Approved: 2 July 2026**
> **Prerequisite: KNOWLEDGE_PACKAGE_ARCHITECTURE.md (FROZEN)**
> **Rule: No coding begins until this roadmap is approved.**

---

## Phase 8: Knowledge Package Foundation

**Goal:** Database tables + TypeScript types for Knowledge Packages, Facts, Citations, Relationships, Provenance.

### Deliverables

| # | What | Type |
|---|------|------|
| 1 | `000016_knowledge_package_v2.sql` migration | DB — new tables |
| 2 | TypeScript interfaces in `lib/types.ts` | Types |
| 3 | Domain Glossary table + seed data | DB + seed |

### New Tables

- `knowledge_packages` — slot-scoped packages with version + hash
- `knowledge_facts` — atomic facts with type + confidence
- `knowledge_citations` — source records with authority level
- `knowledge_evidence` — links facts to citations
- `knowledge_relationships` — multi-level typed graph
- `knowledge_provenance` — full traceability chain
- `domain_glossary` — canonical vocabulary for normalization

### Success Criteria

- All tables created with proper FK constraints
- TypeScript interfaces match schema exactly
- Domain Glossary seeded with initial terms (50+ entries)
- Backward compatibility with Phase 6-7 discovery tables

---

## Phase 9: Knowledge Assembler

**Goal:** Build the 8-step assembler pipeline.

### Deliverables

| # | What | Type |
|---|------|------|
| 1 | `services/knowledge/normalizer.ts` | Step 1: text normalization + glossary lookup |
| 2 | `services/knowledge/factExtractor.ts` | Step 2: decompose candidates into atomic facts |
| 3 | `services/knowledge/factDeduplicator.ts` | Step 3: slug + semantic dedup |
| 4 | `services/knowledge/conflictResolver.ts` | Step 4: contradiction detection + resolution |
| 5 | `services/knowledge/confidenceCalculator.ts` | Step 5: evidence-based confidence scoring |
| 6 | `services/knowledge/relationshipBuilder.ts` | Step 6: intra + inter-package relationships |
| 7 | `services/knowledge/packageVersioner.ts` | Step 7: hash computation + versioning |
| 8 | `services/knowledge/assembler.ts` | Orchestrator: runs all 8 steps in sequence |
| 9 | `services/knowledge/index.ts` | Barrel export |

### Success Criteria

- End-to-end: Discovery Candidates -> Knowledge Package
- Atomic fact decomposition verified
- Deduplication across sources verified
- Versioning + hash change detection verified
- Full provenance chain stored

---

## Phase 10: Knowledge Preview UI

**Goal:** Preview pages to visualize Knowledge Packages.

### Deliverables

| # | What |
|---|------|
| 1 | `/preview/knowledge` — list all packages with fact/citation counts |
| 2 | `/preview/knowledge/[id]` — package detail: facts, citations, relationships, provenance |
| 3 | `/preview/knowledge/[id]/graph` — relationship visualization |

### Success Criteria

- Facts displayed with type, confidence, evidence
- Citations displayed with source authority
- Provenance chain visible per fact
- Relationships displayed with type + direction

---

## Phase 11: Rendering Layer

**Goal:** Build Rendering Package + first renderer (Long Article).

### Deliverables

| # | What | Type |
|---|------|------|
| 1 | `rendering_packages` table | DB |
| 2 | `services/rendering/renderingPackageBuilder.ts` | Builds format-specific rendering hints |
| 3 | `services/rendering/articleRenderer.ts` | First renderer: Knowledge Package -> Long Article |
| 4 | `services/rendering/index.ts` | Barrel export |

### Inviolable Rule

> Renderers are pure consumers. They never create, modify, or delete facts or relationships.

### Success Criteria

- Knowledge Package -> Rendered Article (markdown)
- Citations inherited from package
- Article is regeneratable from L1 + L2
- Quality Gate passes

---

## Phase 12: Additional Renderers

**Goal:** Prove one-package-many-outputs by building 2+ more renderers.

### Deliverables

| # | What |
|---|------|
| 1 | FAQ Renderer — extracts facts by type, generates Q&A format |
| 2 | Cheat Sheet Renderer — condensed reference from definitions + procedures |

### Success Criteria

- Same Knowledge Package produces 3 different outputs
- All outputs inherit citations from the package
- No renderer modifies any fact

---

## Phase Sequence

```
Phase 8:  Knowledge Package Foundation    (tables + types)
Phase 9:  Knowledge Assembler             (8-step pipeline)
Phase 10: Knowledge Preview UI            (visualization)
Phase 11: Rendering Layer                 (first renderer)
Phase 12: Additional Renderers            (prove multi-output)
```

Each phase requires approval before the next begins.

---

## Out of Scope (Explicitly Deferred)

- AI/LLM-based fact extraction (Phase 9 uses deterministic extraction)
- Cron jobs or automated scheduling
- Autonomous publishing pipeline
- Multilingual knowledge
- Knowledge graph visualization (beyond basic preview)
- Evergreen update automation (architecture supports it, implementation later)

---

## Engineering Rules (FROZEN)

These rules are part of the architecture. They cannot be violated.

### Rule 1: Single Source of Truth

The Knowledge Package is the only canonical source of truth.
Everything else is derived. Never duplicate knowledge into rendered outputs.

### Rule 2: Renderers Are Pure Functions

Input: Knowledge Package. Output: Rendered content.

Renderers:
- Never fetch external sources
- Never create facts
- Never modify facts
- Never modify relationships

### Rule 3: Assembler Exclusivity

The Knowledge Assembler is the only component allowed to create or modify Knowledge Packages.
No other service may directly manipulate package contents.

### Rule 4: Mandatory Provenance

Every atomic fact must always preserve:
- Citation
- Evidence
- Provenance

These three must never become optional.

### Rule 5: Hash-Gated Regeneration

If `knowledgeHash` is unchanged:
- Do not regenerate renderers
- Do not regenerate articles
- Do not invalidate caches

Only update verification timestamps when appropriate.

### Rule 6: Phase Discipline

Every implementation phase must include:
- Preview UI
- Verification report
- Rollback strategy
- TypeScript clean build
- Regression check

### Rule 7: Layer Independence

No phase may introduce coupling between:
- Discovery
- Knowledge Assembly
- Rendering

Each layer must remain independently replaceable.

---

## Project Identity

> We are not building an article generation system.
> We are building a **Knowledge Operating System** whose first renderer happens to produce articles.
> This distinction must remain true throughout implementation.

---

*This roadmap implements the Knowledge Package Architecture v3.1 as approved on 2 July 2026.*
