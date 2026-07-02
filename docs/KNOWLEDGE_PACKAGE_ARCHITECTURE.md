# Knowledge Package Architecture v3.1

> **Status: FROZEN — Approved**
> **Date: 2 July 2026**
> **This document is the canonical reference for all knowledge management in Valendiro.**
> **No implementation should deviate from this architecture without explicit approval.**

---

## Core Principle

Valendiro is a **knowledge platform**, not a content platform.

The fundamental unit of value is **knowledge** — not articles.

Articles, FAQs, cheat sheets, and all other outputs are **renderings** of knowledge.

The **Knowledge Package** is the canonical source of truth.

---

## 1. The Atomic Fact

The smallest reusable unit of knowledge is an **Atomic Fact**.

### Definition

> An atomic fact is a single statement such that:
> - It contains exactly one subject-predicate-object relationship
> - It can be verified against a single source
> - Splitting it further would lose meaning or create fragments that aren't independently useful

### Atomicity Test

1. It can be true or false on its own — without needing another statement for context
2. It cannot be split into smaller claims that are independently verifiable
3. Negating any part of it changes the entire meaning

### Examples

| Statement | Atomic? | Why |
|-----------|---------|-----|
| "Python was created by Guido van Rossum" | Yes | Single verifiable claim |
| "Python was created by Guido van Rossum in 1991" | No | Two claims: creator + year |
| "Python supports OOP, procedural, and functional programming" | No | Three independent claims |
| "Python 3.12 requires a C compiler to build from source" | Yes | Single verifiable claim |

### Schema

```
Fact {
  id              string
  statement       string
  type            "definition" | "property" | "rule" | "measurement" |
                  "historical" | "causal" | "procedural" | "warning" |
                  "comparison" | "opinion"
  confidence      "verified" | "high" | "medium" | "low" | "disputed"
  domain          string
  scope           "universal" | "contextual" | "narrow"
  evidence[]      Evidence[]
  provenance      FactProvenance
  tags[]          string[]
}
```

### Confidence Levels

| Level | Meaning |
|-------|---------|
| `verified` | Official source confirms |
| `high` | 2+ independent sources agree |
| `medium` | 1 authoritative source |
| `low` | 1 community source only |
| `disputed` | Sources contradict |

---

## 2. Evidence and Citations

### Evidence

Links a fact to a citation with the relevant excerpt.

```
Evidence {
  citationId      string
  excerpt         string
  retrievedAt     string
  lastVerifiedAt  string
}
```

### Citation

A registered source of knowledge.

```
Citation {
  id              string
  sourceName      string
  sourceUrl       string | null
  adapterName     string
  extractionMethod string
  sourceAuthority  "official" | "encyclopedic" | "community" | "academic" | "unknown"
  retrievedAt     string
  lastVerifiedAt  string
}
```

### Rule

Every fact must reference at least one citation via evidence.

No unsourced facts are permitted in a ready-status Knowledge Package.

---

## 3. Full Provenance Chain

Every fact is traceable back to the original discovery process.

```
FactProvenance {
  factId              string
  discoveryRunId      string
  discoveryCandidateId string
  adapterName         string
  sourceSlug          string
  extractedAt         string
}
```

### Traceability

```
Published Output: "Python uses dynamic typing"
        |  rendered from
KnowledgePackage (slot: "Python: Type System", v3)
        |  contains
Fact { statement: "Python uses dynamic typing", id: "f-42" }
        |  assembled from
FactProvenance {
  factId: "f-42",
  discoveryRunId: "run-7",
  discoveryCandidateId: "cand-23",
  adapterName: "WikipediaAdapter",
  sourceSlug: "wikipedia-en"
}
        |  discovered by
DiscoveryRun -> DiscoverySource
```

---

## 4. Relationships (First-Class Citizens)

### Schema

```
KnowledgeRelationship {
  id              string
  sourceId        string
  sourceLevel     "fact" | "package" | "slot" | "topic"
  targetId        string
  targetLevel     "fact" | "package" | "slot" | "topic"
  type            (see taxonomy)
  strength        "strong" | "moderate" | "weak"
  explanation     string
  bidirectional   boolean
}
```

### Relationship Type Taxonomy

| Type | Direction | Meaning |
|------|-----------|---------|
| `requires` | A -> B | A needs B to be understood first |
| `depends_on` | A -> B | A cannot function without B |
| `contradicts` | A <-> B | A and B make opposing claims |
| `extends` | A -> B | A adds depth to B |
| `replaces` | A -> B | A supersedes B |
| `related_to` | A <-> B | A and B share domain context |
| `part_of` | A -> B | A is a component of B |
| `causes` | A -> B | A leads to B |
| `prevents` | A -> B | A stops B from happening |
| `precedes` | A -> B | A comes before B in sequence |
| `specializes` | A -> B | A is a narrower form of B |
| `generalizes` | A -> B | A is a broader form of B |

Bidirectional: `contradicts`, `related_to`. All others are directional.

### Multi-Level Support

| Source -> Target | Example |
|-----------------|---------|
| Fact -> Fact | "Dynamic typing" specializes "Type system" |
| Package -> Package | "Installation" precedes "Getting Started" |
| Slot -> Slot | "Syntax" extends "Advanced Syntax" |
| Topic -> Topic | "Python" related_to "JavaScript" |

### Architectural Rule

> Relationships are discovered during assembly, but they remain independently editable.
> Editing a relationship does not require regenerating the source package.

---

## 5. Domain Glossary (Canonical Vocabulary)

The Knowledge Assembler consults a Domain Glossary during normalization.

### Purpose

| Input | Canonical Form |
|-------|---------------|
| OOP | Object-Oriented Programming |
| JS | JavaScript |
| Py | Python |
| ML | Machine Learning |
| k8s | Kubernetes |

### Rules

- The glossary is the source of truth for terminology
- Not hardcoded — maintained as data (editable, extensible)
- Used during assembler Step 1 (Normalize)
- Ensures consistency across facts, relationships, search, and rendering

---

## 6. Knowledge Package Schema

```
KnowledgePackage {
  -- Identity --
  id                  UUID
  hubSlotId           UUID
  topicId             UUID
  slug                string
  version             number
  knowledgeHash       string        <- sha256(sorted_facts + sorted_relationships)

  -- Atomic Knowledge --
  facts[]             Fact[]
  citations[]         Citation[]
  relationships[]     KnowledgeRelationship[]
  provenance[]        FactProvenance[]

  -- Metadata --
  sourceCount         number
  factCount           number
  relationshipCount   number
  discoveryRunIds[]   UUID[]
  lastUpdatedAt       timestamp
  lastVerifiedAt      timestamp
  status              "draft" | "ready" | "stale" | "archived"
}
```

### What is NOT in a Knowledge Package

- No image suggestions (rendering concern)
- No table layouts (rendering concern)
- No article outlines (rendering concern)
- No word counts (rendering concern)
- No section ordering (rendering concern)
- No prose (rendering concern)

---

## 7. Knowledge Assembler

The central component of the platform. Transforms Discovery Candidates into Knowledge Packages.

### 8-Step Pipeline

```
Step 1: NORMALIZE
  - Normalize text (casing, whitespace, encoding)
  - Resolve abbreviations via Domain Glossary
  - Standardize terminology

Step 2: EXTRACT
  - Decompose candidate descriptions into atomic facts
  - Classify each fact by type
  - Create Citation record for each source
  - Create Evidence linking fact -> citation
  - Attach provenance (candidateId, adapterId, runId)

Step 3: DEDUPLICATE
  - Slug-match: identical slugified statements
  - Semantic-match: Jaccard similarity > threshold
  - On duplicate: merge evidence arrays
    (one fact, multiple evidence sources)
  - Higher source count = higher confidence

Step 4: RESOLVE CONFLICTS
  - Detect contradicting facts (same subject, opposing predicates)
  - Higher authority source wins (official > encyclopedic > community)
  - If equal authority: keep both, mark "disputed", flag for review

Step 5: CALCULATE CONFIDENCE
  - verified:  official source confirms
  - high:      2+ independent sources agree
  - medium:    1 authoritative source
  - low:       1 community source only
  - disputed:  sources contradict

Step 6: BUILD RELATIONSHIPS
  - Intra-package: fact-to-fact (shared entities, ordering, prerequisites)
  - Inter-package: package-to-package (shared topics, slot adjacency)

Step 7: VERSION
  - Compute knowledgeHash (facts + relationships)
  - Existing package + hash changed -> increment version, mark downstream stale
  - Existing package + hash unchanged -> update lastVerifiedAt only
  - New package -> version = 1

Step 8: PERSIST
  - Store KnowledgePackage with full provenance
  - Return packageId + diff summary
```

---

## 8. Three-Layer Architecture

### Permanent Architectural Rule

```
+--------------------------------------+
|       Layer 1: KNOWLEDGE             |
|                                      |
|  KnowledgePackage                    |
|    facts, citations, relationships,  |
|    provenance, version, hash         |
|                                      |
|  Pure knowledge.                     |
|  No rendering. No presentation.      |
+------------------+-------------------+
                   |
                   v
+--------------------------------------+
|       Layer 2: RENDERING PACKAGE     |
|                                      |
|  RenderingPackage                    |
|    outputFormat, sectionOrder,       |
|    tableOpportunities,               |
|    imageSuggestions, emphasisHints,   |
|    targetAudience, targetWordCount   |
|                                      |
|  Presentation strategy.              |
|  Format-specific.                    |
|  Multiple per Knowledge Package.     |
+------------------+-------------------+
                   |
                   v
+--------------------------------------+
|       Layer 3: RENDERED OUTPUT       |
|                                      |
|  Article / FAQ / CheatSheet / etc.   |
|    content, inheritedCitations,      |
|    qualityScore, renderedAt          |
|                                      |
|  Final output.                       |
|  Regeneratable from L1 + L2.         |
+--------------------------------------+
```

### Inviolable Rules

1. **Renderers are pure consumers.** They never create facts. They never modify facts. They never modify relationships. They only transform Knowledge Packages into presentation formats.

2. **Knowledge Packages never contain presentation logic.** No images, tables, layouts, word counts, or prose.

3. **Layer 3 is always regeneratable.** If Layer 1 and Layer 2 exist, Layer 3 can be rebuilt from scratch.

---

## 9. Supported Output Formats

The same Knowledge Package may render into:

- Long Articles
- Beginner Guides
- FAQs
- Comparison Pages
- Checklists
- Cheat Sheets
- Learning Paths
- AI Assistant Responses
- API Responses
- Mobile Views

**The Knowledge Package is the permanent asset. Everything else is a view of that asset.**

---

## 10. Evergreen Updates

```
Source changed
        |
Re-run discovery adapter
        |
New candidates compared against existing package
        |
Knowledge Assembler updates package:
  - knowledgeHash changed -> version++, downstream marked "stale"
  - knowledgeHash unchanged -> lastVerifiedAt updated only
        |
Stale outputs regenerated from updated package
```

---

## 11. Complete Pipeline

```
Discovery Source
        |
Discovery Run
        |
Discovery Candidates (many per slot)
        |
Knowledge Assembler
  +-- Normalize (via Domain Glossary)
  +-- Extract (-> atomic facts + provenance)
  +-- Deduplicate
  +-- Resolve conflicts
  +-- Calculate confidence
  +-- Build relationships (multi-level)
  +-- Version + hash
  +-- Persist
        |
Knowledge Package (Layer 1)
        |
Rendering Package (Layer 2)
        |
Renderer
        |
Rendered Output (Layer 3)
        |
Quality Gate
        |
Published
```

---

## Approval History

| Version | Date | Status |
|---------|------|--------|
| v1 | 2 Jul 2026 | Rejected — too article-shaped |
| v2 | 2 Jul 2026 | 95% approved — needs refinement |
| v3 | 2 Jul 2026 | 98% approved — 5 points to clarify |
| **v3.1** | **2 Jul 2026** | **APPROVED — Architecture frozen** |

---

*This document is the canonical foundation for every future content generation, rendering, evergreen update, and knowledge management capability in Valendiro.*
