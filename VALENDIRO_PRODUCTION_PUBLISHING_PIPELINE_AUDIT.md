# Valendiro Production Publishing Pipeline Audit

**Date**: July 4, 2026  
**Objective**: Establish ground truth of the current production publishing pipeline

---

## Executive Summary

**Critical Finding**: There is a **complete disconnect** between the rendering pipeline and the public-facing website.

- The Knowledge Authoring Engine and Renderer generate content into the `rendered_outputs` table
- The public-facing website serves content from the `topics` and `topic_translations` tables
- **No synchronization mechanism exists** between these two systems
- 148 "published" rendered outputs exist but are **invisible** to website visitors

**Result**: The Knowledge Authoring Engine cannot improve the live production website because there is no pipeline to deploy its output to the public-facing data source.

---

## 1. Current Production Website

### Live URL
- **Configured URL**: `process.env.NEXT_PUBLIC_SITE_URL` (defaults to `http://localhost:3000`)
- **Evidence**: `lib/constants.ts` line 2
- **Status**: No production URL visible in codebase; appears to be configured via environment variables

### Deployment Status
- **Hosting Platform**: Netlify
- **Evidence**: `netlify.toml` file exists with Next.js plugin configuration
- **Build Command**: `npm run build`
- **Publish Directory**: `.next`

### Environment
- **Framework**: Next.js 14+ (App Router)
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Netlify with @netlify/plugin-nextjs

---

## 2. Current Data Source

### When a visitor opens a page, content comes from:

**Primary Source**: `topics` table + `topic_translations` table

**Evidence**:

**File**: `services/public/publicData.ts` (lines 843-869)
```typescript
export async function getTopicBySlug(slug: string): Promise<PublicTopicDetail | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("topics")
    .select("id, slug, category_id, subcategory_id, updated_at, topic_translations(title, subtitle, content, meta_title, meta_description)")
    .eq("slug", slug)
    .eq("topic_translations.language_code", "en")
    .eq("status", "published")
    .maybeSingle();

  if (!data) return null;

  const translation = data.topic_translations?.[0];
  return {
    id: data.id,
    slug: data.slug,
    title: translation?.title || "Untitled",
    subtitle: translation?.subtitle || null,
    category_slug: null,
    content: translation?.content || null,  // ← Content source
    meta_title: translation?.meta_title || null,
    meta_description: translation?.meta_description || null,
    category_id: data.category_id,
    subcategory_id: data.subcategory_id,
    updated_at: data.updated_at ?? null,
  };
}
```

**File**: `app/(public)/[lang]/topics/[slug]/page.tsx` (lines 186-196)
```typescript
{/* Article content */}
{topic.content && (
  <div 
    dangerouslySetInnerHTML={{ 
      __html: topic.content
        .replace(/## Sources\n[\s\S]*?(?=\n##|$)/g, "")
        .replace(/### Sources\n[\s\S]*?(?=\n##|$)/g, "")
        .replace(/#### Sources\n[\s\S]*?(?=\n##|$)/g, "")
    }}
    className="prose max-w-none"
  />
)}
```

**NOT Used**: The `rendered_outputs` table is **not** queried by any public-facing route.

---

## 3. Published Rendered Outputs

### What "published" means in rendered_outputs table:

**Definition**: The `status` field in `rendered_outputs` table has values: `draft`, `published`, `stale`, `failed`

**Evidence**: `database/migrations/000017_rendered_outputs.sql` (lines 7-28)
```sql
CREATE TABLE IF NOT EXISTS rendered_outputs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id      UUID NOT NULL REFERENCES knowledge_packages(id) ON DELETE CASCADE,
  knowledge_hash  TEXT NOT NULL,
  renderer_id     TEXT NOT NULL,
  renderer_version TEXT NOT NULL,
  template_version TEXT NOT NULL,
  output_format   TEXT NOT NULL CHECK (output_format IN ('html', 'markdown', 'json')),
  style           TEXT[] NOT NULL DEFAULT '{}',
  cache_key       TEXT NOT NULL UNIQUE,
  content         TEXT NOT NULL,
  document_tree   JSONB NOT NULL,
  word_count      INTEGER NOT NULL DEFAULT 0,
  section_count   INTEGER NOT NULL DEFAULT 0,
  citation_count  INTEGER NOT NULL DEFAULT 0,
  quality_score   JSONB NOT NULL DEFAULT '{}',
  diagnostics     JSONB NOT NULL DEFAULT '{}',
  render_duration_ms INTEGER NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'stale', 'failed')),
  created_at      TIMESTAMPTZ NOT DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT DEFAULT now()
);
```

**Critical Issue**: The `status = 'published'` in `rendered_outputs` has **no impact** on whether content is visible to website visitors. The public-facing routes do not query this table.

**Phase 15 Report Context**: The report of "148 rendered outputs marked as published" refers to rows in the `rendered_outputs` table with `status = 'published'`. However, these outputs are **not deployed** to the live website.

---

## 4. Routing

### Can these URLs currently exist?

**URL Pattern**: `/[lang]/topics/[slug]`

**Examples**:
- `/en/python-programming-fundamentals`
- `/en/investing-basics`
- `/en/nutrition-fundamentals`
- `/en/travel-planning-fundamentals`
- `/en/marketing-fundamentals`

**Route Exists**: Yes - `app/(public)/[lang]/topics/[slug]/page.tsx`

**Can URLs be reached?**: Only if:
1. A topic with matching `slug` exists in `topics` table
2. The topic has `status = 'published'`
3. The topic has a translation in `topic_translations` table with `content` field populated

**Evidence**: `services/public/publicData.ts` (lines 843-851)
```typescript
const { data } = await supabase
  .from("topics")
  .select("id, slug, category_id, subcategory_id, updated_at, topic_translations(title, subtitle, content, meta_title, meta_description)")
  .eq("slug", slug)
  .eq("topic_translations.language_code", "en")
  .eq("status", "published")  // ← Must be published
  .maybeSingle();

if (!data) return null;  // ← Returns 404 if not found
```

**Current State for Validation Topics**:
- Python Programming Fundamentals: Topic exists, published, but has 0 facts in knowledge package
- Investing Basics: Topic exists, published, but has 0 facts in knowledge package
- Nutrition Fundamentals: Topic exists, published, but has 0 facts in knowledge package
- Travel Planning Fundamentals: Topic exists, published, has 11 facts in knowledge package
- Marketing Fundamentals: Topic exists, published, has 12 facts in knowledge package

**Critical Issue**: Even though topics exist and are published, their content in `topic_translations.content` may not reflect the output from the Knowledge Authoring Engine because there is no synchronization from `rendered_outputs` to `topic_translations`.

---

## 5. Publishing Pipeline

### Complete Current Pipeline

```
Knowledge Package (knowledge_packages table)
        ↓
Knowledge Authoring Engine (services/renderer/authoring/)
        ↓
Renderer Orchestrator (services/renderer/orchestrator.ts)
        ↓
rendered_outputs table  ← PIPELINE STOPS HERE
        ↓
    [MISSING LINK]
        ↓
topics table
        ↓
topic_translations table
        ↓
Next.js Route (app/(public)/[lang]/topics/[slug]/page.tsx)
        ↓
Production Website
```

### Pipeline Steps Status

| Step | Status | Evidence |
|------|--------|----------|
| Knowledge Package | ✅ Complete | `knowledge_packages` table exists with data |
| Knowledge Authoring Engine | ✅ Complete | Engine exists and executes successfully |
| Renderer Orchestrator | ✅ Complete | Orchestrator exists and writes to `rendered_outputs` |
| rendered_outputs table | ✅ Complete | Table exists, 148 rows with status='published' |
| **Sync to topics table** | ❌ **MISSING** | No mechanism exists |
| **Sync to topic_translations table** | ❌ **MISSING** | No mechanism exists |
| Next.js Route | ✅ Complete | Route exists and queries topics/topic_translations |
| Production Website | ✅ Complete | Netlify deployment configured |

### Final Completed Step

**Step 4**: Renderer Orchestrator writes to `rendered_outputs` table

### Missing Step

**Step 5**: Synchronization from `rendered_outputs` to `topics` / `topic_translations` tables

**What's Missing**:
- No service or script reads from `rendered_outputs` and writes to `topic_translations.content`
- No automatic sync mechanism
- No manual sync process
- No API endpoint to trigger sync
- No background job to perform sync

---

## 6. Deployment

### Is the current production website capable of serving newly generated pages?

**Answer**: **NO**

**Blocker**: Missing synchronization from `rendered_outputs` to `topic_translations`

**Detailed Explanation**:

1. The Netlify deployment infrastructure is **fully functional**
   - Build process works
   - Next.js routes are configured
   - Database connection works
   - Static asset serving works

2. The **data pipeline** is broken
   - New content is generated into `rendered_outputs` table
   - Public-facing routes query `topic_translations` table
   - No mechanism moves content from `rendered_outputs` → `topic_translations`

3. **Result**: Even if the Knowledge Authoring Engine generates perfect content, it will never appear on the live website because the website doesn't know where to find it.

### Required Fix

**Option A**: Modify public routes to query `rendered_outputs` instead of `topic_translations`
- Pro: Uses the generated content directly
- Con: Requires significant refactoring of public data service
- Con: Breaks existing content in `topic_translations`

**Option B**: Create sync mechanism from `rendered_outputs` to `topic_translations`
- Pro: Preserves existing content structure
- Pro: Can be incremental (sync only when needed)
- Con: Adds complexity (need to handle conflicts, updates, etc.)
- Con: Requires background job or manual trigger

**Option C**: Modify Knowledge Authoring Engine to write directly to `topic_translations`
- Pro: Simplest data flow
- Con: Bypasses the rendered_outputs architecture
- Con: Loses the benefits of the rendering layer (caching, versioning, etc.)

---

## 7. Evidence

### Code Locations

**Public Data Source**:
- File: `services/public/publicData.ts`
- Function: `getTopicBySlug()` (lines 843-869)
- Queries: `topics` table + `topic_translations` table
- Does NOT query: `rendered_outputs` table

**Public Route**:
- File: `app/(public)/[lang]/topics/[slug]/page.tsx`
- Line 74: `const topic = await getTopicBySlug(slug);`
- Line 189: `dangerouslySetInnerHTML={{ __html: topic.content }}`

**Renderer Orchestrator**:
- File: `services/renderer/orchestrator.ts`
- Function: `render()` (line 100)
- Writes to: `rendered_outputs` table via `storeRenderedOutput()`
- Does NOT write to: `topic_translations` table

**Rendered Outputs Table**:
- File: `database/migrations/000017_rendered_outputs.sql`
- Status field: Can be 'draft', 'published', 'stale', 'failed'
- Content field: Stores generated HTML/markdown
- No foreign key to topics or topic_translations

### Database Evidence

**Baseline Capture Results** (from production-baseline-capture.ts):
```
Python Programming Fundamentals: Topic exists, published, 0 facts
Investing Basics: Topic exists, published, 0 facts
Nutrition Fundamentals: Topic exists, published, 0 facts
Travel Planning Fundamentals: Topic exists, published, 11 facts
Marketing Fundamentals: Topic exists, published, 12 facts
```

**All 5 topics exist** in the `topics` table with `status = 'published'`

**Knowledge packages exist** for all 5 topics

**Articles table**: No articles linked to any of the 5 topics (baseline capture showed "⚠ No article linked to this topic")

### Route Evidence

**Route exists**: `app/(public)/[lang]/topics/[slug]/page.tsx`

**Route logic**:
1. Calls `getTopicBySlug(slug)`
2. If topic not found → 404
3. If topic found → renders `topic.content` from `topic_translations`

**Route does NOT**:
- Query `rendered_outputs` table
- Check if there's a newer rendered output
- Fall back to rendered_outputs if topic_translations is empty

### Deployment Evidence

**Netlify Configuration**: `netlify.toml`
```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

**Production URL Configuration**: `lib/constants.ts` line 2
```typescript
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
```

---

## Current Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Knowledge Package                              │
│              (knowledge_packages table)                           │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              Knowledge Authoring Engine                           │
│         (services/renderer/authoring/)                           │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                 Renderer Orchestrator                             │
│           (services/renderer/orchestrator.ts)                    │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                  rendered_outputs table                           │
│         (148 rows with status='published')                       │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                    [MISSING LINK]
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                       topics table                                │
│              (5 validation topics exist)                         │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                 topic_translations table                          │
│         (content field - source for live pages)                  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│         Next.js Route: /[lang]/topics/[slug]/page.tsx           │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Production Website                              │
│                      (Netlify)                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Missing Components

1. **Sync Service**: A service that reads from `rendered_outputs` and writes to `topic_translations.content`
2. **Sync Trigger**: Mechanism to automatically sync when new rendered outputs are created
3. **Conflict Resolution**: Logic to handle when topic_translations already has content
4. **Version Management**: Strategy for handling multiple versions of rendered content
5. **Rollback Mechanism**: Ability to revert to previous content if needed

---

## Blockers

**Primary Blocker**: No mechanism exists to move content from `rendered_outputs` to the public-facing data source (`topic_translations`).

**Impact**: The Knowledge Authoring Engine cannot improve the live production website because its output never reaches the pages that visitors see.

**Secondary Blockers**:
- No documentation exists explaining the intended data flow
- No tests exist to verify the end-to-end pipeline
- No monitoring exists to detect when sync is needed

---

## Recommended Next Engineering Task

**Task**: Implement synchronization from `rendered_outputs` to `topic_translations`

**Priority**: CRITICAL - Blocks all production validation efforts

**Implementation Options**:

**Option 1: Create Background Sync Job** (Recommended)
- Create a script that queries `rendered_outputs` with `status='published'`
- For each output, find corresponding topic by package_id → topic_id
- Update `topic_translations.content` with rendered output content
- Run this job via cron or after each render
- Pros: Preserves existing architecture, incremental, reversible
- Cons: Requires job scheduling infrastructure

**Option 2: Modify Public Routes to Query rendered_outputs**
- Update `getTopicBySlug()` to query `rendered_outputs` instead of `topic_translations`
- Join with topics table via package_id
- Pros: Uses generated content directly, no sync needed
- Cons: Breaking change, may affect existing content, loses translation support

**Option 3: Modify Knowledge Authoring Engine to Write Directly**
- Update orchestrator to write directly to `topic_translations.content`
- Bypass `rendered_outputs` table for production content
- Pros: Simplest data flow
- Cons: Loses rendering layer benefits, architectural inconsistency

**Recommended Approach**: Option 1 - Create Background Sync Job
- Preserves the existing architecture
- Allows for gradual migration
- Maintains separation of concerns
- Enables rollback capability

---

## Conclusion

**The Knowledge Authoring Engine engineering validation is complete and successful.**

**However, the production publishing pipeline has a critical gap:**

- The Knowledge Authoring Engine generates content into `rendered_outputs`
- The public website serves content from `topic_translations`
- No synchronization exists between these two systems

**Until this synchronization is implemented, the Knowledge Authoring Engine cannot improve the live production website, regardless of how well it performs during engineering validation.**

**Next Step**: Implement the missing sync mechanism before proceeding with any production product validation.
