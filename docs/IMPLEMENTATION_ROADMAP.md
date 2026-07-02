# Valendiro v1.0 — Official Implementation Roadmap

**Status:** Approved
**Architecture:** Frozen
**Date:** 2 July 2026

---

## Project Governance Rules

### Rule 1: Database Backup Before Any Migration

Before any database migration is applied to any environment (local, staging, or production), a full database backup must be taken. For Supabase, this means:
- Production: Verify Supabase automatic daily backup exists, or trigger a manual backup from the Supabase dashboard before migration.
- Local/Staging: Export current state before applying migration.

No migration may proceed without a confirmed backup.

### Rule 2: Phase Completion Checklist

Every phase must pass ALL of the following before it is considered complete:

- [ ] All deliverables for the phase are implemented
- [ ] All code compiles without TypeScript errors (`npx tsc --noEmit`)
- [ ] All changes tested locally (manual or script verification)
- [ ] No regressions — existing functionality still works
- [ ] If database changes: migration validated on local/staging before production
- [ ] If database changes: backup confirmed before production migration
- [ ] Phase deliverables documented (what was created, what was changed)
- [ ] Founder has reviewed and explicitly approved the phase completion

Only after ALL checkboxes pass may the next phase begin.

### Rule 3: Single Active Phase

Only one implementation phase may be active at any time. The next phase cannot begin until the current phase is:
1. Fully implemented
2. Passed the Phase Completion Checklist
3. Reviewed and explicitly approved by the founder

No parallel phase work. No "starting Phase 2 while finishing Phase 1." Sequential execution only.

---

## Phase 0: Foundation Audit

**Risk:** None
**Scope:** Validation only — no code changes, no migrations
**Prerequisite:** Database backup before any queries that might be destructive (Phase 0 is read-only, but backup rule applies from this point forward)

### Deliverables:
1. Verify live DB state — confirm which tables exist in production Supabase
2. Verify which migrations (000001–000012) have actually been applied to production
3. Verify live row counts: categories, subcategories, topics, articles, entities
4. Verify existing `entities` table structure — confirm name collision plan with new Entity Types
5. Verify existing pipeline tables — `content_generation_queue`, `demand_topic_queue`, `demand_topic_clusters` existence and data
6. Document exact live DB state (tables, row counts, applied migrations)
7. Verify local dev environment — `npm run dev` builds and connects to Supabase
8. Confirm Supabase automatic backup is enabled for production project

### Milestone:
Complete, verified map of what exists in production. No surprises during migration phases.

### Phase Completion Checklist:
- [ ] All 8 deliverables completed
- [ ] Live DB state documented
- [ ] No code changes made
- [ ] Founder reviewed and approved

---

## Phase 1: Database — Entity Types & Blueprints

**Risk:** Low
**Scope:** Schema + Types — local/staging first
**Prerequisite:** Phase 0 approved

### Migration: `000013_entity_types_and_blueprints.sql`

New tables (purely additive):
- `entity_types` (id, slug, created_at, updated_at)
- `entity_type_translations` (entity_type_id, language_code, name, description)
- `entity_type_sections` (id, entity_type_id, slug, sort_order)
- `entity_type_section_translations` (section_id, language_code, name, description)
- `entity_type_slots` (id, section_id, entity_type_id, slug, sort_order)
- `entity_type_slot_translations` (slot_id, language_code, title, description)

No changes to existing tables.

### Steps:
1. Take database backup
2. Write migration SQL
3. Run on local/staging Supabase
4. Validate tables exist, constraints correct
5. Add TypeScript interfaces to `lib/types.ts`
6. After local validation → apply to production

### Milestone:
Entity type blueprint template tables exist. No existing functionality affected.

### Reversible:
`DROP TABLE` for all new tables. No existing tables touched.

---

## Phase 2: Database — Hub Slots (Topic Instance Layer)

**Risk:** Low
**Scope:** Schema + one ALTER — local/staging first
**Prerequisite:** Phase 1 approved

### Migration: `000014_hub_slots.sql`

New tables:
- `hub_sections` (id, topic_id, entity_type_section_id, slug, sort_order)
- `hub_section_translations` (section_id, language_code, name, description)
- `hub_slots` (id, section_id, topic_id, entity_type_slot_id, slug, sort_order, status, article_id nullable FK)
- `hub_slot_translations` (slot_id, language_code, title, description)

One ALTER:
- `ALTER TABLE topics ADD COLUMN entity_type_id UUID REFERENCES entity_types(id) ON DELETE SET NULL` (nullable — non-breaking)

### Steps:
1. Take database backup
2. Write migration SQL
3. Run on local/staging, validate
4. Verify existing topics table still works
5. Apply to production

### Milestone:
Topics can be assigned an entity type. Hub sections/slots can be materialized per topic.

### Reversible:
Drop new tables + `ALTER TABLE topics DROP COLUMN entity_type_id`.

---

## Phase 3: Seed Master Taxonomy + First Entity Type

**Risk:** Low
**Scope:** Data seeding — local/staging first
**Prerequisite:** Phase 2 approved

### Migration: `000015_seed_first_entity_type.sql`

1. Apply migration `000012` (master taxonomy — 7 categories + 85 subcategories) if not already applied
2. Seed first entity type: "Programming Language" with complete blueprint sections and slots

### Steps:
1. Take database backup
2. Write seed SQL
3. Run on local/staging, validate
4. Verify subcategories appear on category pages
5. Apply to production

### Milestone:
Live DB has 85 subcategories. One complete entity type blueprint exists.

### Reversible:
DELETE seed data. No structural changes.

---

## Phase 4: Hub Service Layer

**Risk:** Low
**Scope:** New service files only
**Prerequisite:** Phase 3 approved

### New files:
- `services/hub/hubService.ts`
- `services/hub/blueprintInheritance.ts`
- `services/hub/coverageService.ts`

### Steps:
1. Build blueprint materialization function
2. Build hub CRUD service
3. Build coverage query service
4. Test: create topic, assign entity type, materialize blueprint, verify coverage = 0%

### Milestone:
Can programmatically create a knowledge hub from a blueprint. Coverage is queryable.

### Reversible:
Delete new service files. No DB or frontend changes.

---

## Phase 5: Admin UI — Entity Types & Hub Management

**Risk:** Low
**Scope:** New admin pages
**Prerequisite:** Phase 4 approved

### New pages:
- Entity type CRUD pages
- Hub view with coverage
- Topic list with entity type + coverage column

### Milestone:
Founder can manage entity types, view hub coverage from browser.

### Reversible:
Delete new page files.

---

## Phase 6: Discovery Engine

**Risk:** Medium
**Scope:** New service + new migration — local/staging first
**Prerequisite:** Phase 5 approved

### Migration: `000016_discovery_engine.sql`

New tables (created in THIS phase, not earlier):
- `discovery_sources`
- `discovery_runs`
- `discovery_candidates`

### New services + API:
- Source extractors (Wikipedia TOC, official docs TOC)
- Deduplication engine
- Scoring engine
- Discovery orchestrator
- API endpoint + admin UI

### Steps:
1. Take database backup
2. Write + validate migration on local/staging
3. Build extractors, scoring, dedup
4. Test end-to-end locally
5. Apply migration to production

### Milestone:
Can discover knowledge inventory from structured sources and auto-triage into hub slots.

### Reversible:
Drop discovery tables. Delete service files. Hub system continues with manual blueprints.

---

## Phase 7: Coverage-Driven Pipeline (Parallel Build)

**Risk:** Medium
**Scope:** New pipeline alongside existing
**Prerequisite:** Phase 6 approved

### New files:
- `services/pipeline/coveragePipeline.ts`
- `app/api/cron/coverage-pipeline/route.ts` (separate from existing cron)

### Steps:
1. Build new pipeline (reuses existing content generator, quality guardrails, drip publisher)
2. Deploy alongside old pipeline
3. Test on 5-10 slots
4. Only after validation: disable old pipeline
5. Old pipeline code preserved, not deleted

### Milestone:
Hubs fill themselves based on coverage gaps.

### Reversible:
Re-enable old cron, disable new cron. Both coexist.

---

## Phase 8: Public Frontend Enhancement

**Risk:** Low
**Scope:** Frontend only
**Prerequisite:** Phase 7 approved

### Changes:
- Topic page renders as Knowledge Hub
- Category/subcategory pages show coverage
- Homepage surfaces hubs

### Milestone:
Users experience Valendiro as a knowledge platform.

### Reversible:
Revert frontend components.

---

## Phase Summary

| Phase | What | Risk | Reversible | Depends On |
|-------|------|------|------------|------------|
| 0 | Audit live DB | None | N/A | Nothing |
| 1 | Entity type tables | Low | DROP tables | Phase 0 |
| 2 | Hub slot tables + topics ALTER | Low | DROP + ALTER DROP | Phase 1 |
| 3 | Seed taxonomy + first entity type | Low | DELETE data | Phase 2 |
| 4 | Hub service layer | Low | Delete files | Phase 3 |
| 5 | Admin UI | Low | Delete files | Phase 4 |
| 6 | Discovery engine + tables | Medium | DROP + delete files | Phase 5 |
| 7 | Coverage pipeline (parallel) | Medium | Disable cron | Phase 6 |
| 8 | Public frontend | Low | Revert components | Phase 7 |

---

## Taxonomy Policy

The taxonomy is a **living structure**, not an artificial target.

- We refer to it as: **"7 Categories + Official Master Taxonomy"**
- Current version: **82 Subcategories**
- New subcategories are only introduced when there is a clear long-term knowledge architecture reason
- Never add subcategories simply to reach an arbitrary number
- If taxonomy organically grows to 86, 90, or more in the future — that is fine
