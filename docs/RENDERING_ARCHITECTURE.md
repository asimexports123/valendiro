# Rendering Architecture v1.0 — FROZEN (Feature Complete)

**Status:** FROZEN — FEATURE COMPLETE  
**Approved:** 2026-07-02  
**Feature Complete:** 2026-07-02  
**Depends on:** Knowledge Package Architecture v3.1 (FROZEN)  
**Rule:** No further rendering features unless driven by real user feedback or measurable product needs.

---

## 1. Core Pipeline

```
Knowledge Package (Layer 1 — Source of Truth)
        ↓
  Render Rules Engine (policy + eligibility)
        ↓
  Renderer (Layer 2 — Pure Transformation)
        ↓
  Citation Renderer (dedicated, composable)
        ↓
  Document Tree (Intermediate Representation — Block Model)
        ↓
  Render Quality Score (post-render validation)
        ↓
  Output Serializer (Layer 3 — Format-specific)
        ↓
  Rendered Output (HTML / Markdown / PDF / JSON)
```

### Core Principles

- **Pure function:** `render(KnowledgePackage, RendererConfig) → DocumentTree`
- **No side effects.** No database writes during rendering. No network calls.
- **No mutations.** The renderer never modifies the Knowledge Package.
- **Deterministic.** Same package + same config = identical output, byte-for-byte.
- **Stateless.** The renderer holds no memory between invocations.
- **Knowledge Package is never bypassed.** All downstream content originates from packages.

### Cache Key

```
cache_key = hash(knowledge_hash + renderer_version + template_version + output_format)
```

All four components must match for a cache hit. Any change triggers re-render.

---

## 2. Render Rules Engine

The Render Rules Engine sits **before** the Renderer and determines:

1. **Eligibility** — Is this package ready to render? (status = "ready", minimum fact count met)
2. **Policy selection** — Which rendering policies apply? (category-specific overrides)
3. **Template selection** — Which format + style combination to use
4. **Block priority ordering** — Which sections appear first, which are optional
5. **Missing knowledge detection** — Flag gaps before rendering begins

```typescript
interface RenderRulesEngine {
  evaluate(pkg: KnowledgePackage): RenderDecision;
}

interface RenderDecision {
  eligible: boolean;
  reason: string | null;
  policy: RenderingPolicy;
  blockOrder: BlockPriority[];
  missingKnowledge: MissingKnowledgeFlag[];
  warnings: string[];
}
```

### Rendering Policies (Category-Specific)

Different entity types / categories may have different rendering rules:

```typescript
interface RenderingPolicy {
  id: string;
  name: string;                           // "software-development", "general", "historical"
  categoryMatch: string[];                // which taxonomy categories this applies to
  requiredFactTypes: FactType[];          // must have these fact types to render
  preferredFormat: string;                // default format for this category
  preferredStyle: string[];               // default style
  minFactCount: number;                   // minimum facts to render
  minCitationCount: number;              // minimum citations required
  sectionOverrides: SectionOverride[];    // category-specific section ordering
  commercialPlaceholders: boolean;        // whether to reserve commercial blocks
}
```

Default policy applies when no category-specific policy matches.

---

## 3. Block Priority Ordering

Every block in the Document Tree has a **priority** that determines rendering order:

```typescript
interface BlockPriority {
  sectionType: string;          // "definition", "history", "properties", etc.
  priority: number;             // lower = higher priority = appears first
  required: boolean;            // if true, Missing Knowledge flag raised if absent
  minFacts: number;             // minimum facts to include this section
  maxFacts: number | null;      // cap facts per section (null = unlimited)
}
```

Default priority order:

| Priority | Section | Required | Min Facts |
|----------|---------|----------|-----------|
| 1 | Definition / Overview | Yes | 1 |
| 2 | Key Properties / Features | No | 2 |
| 3 | History / Background | No | 1 |
| 4 | How-to / Procedures | No | 1 |
| 5 | Comparisons | No | 2 |
| 6 | Measurements / Statistics | No | 1 |
| 7 | Warnings / Pitfalls | No | 1 |
| 8 | Related Topics | No | 0 |
| 9 | Citations / Bibliography | Yes | 0 |

Category-specific policies can override this order via `sectionOverrides`.

---

## 4. Format × Style Taxonomy

### Formats (structural templates)

| Format | Structure | Best For |
|--------|-----------|----------|
| **Long Article** | Intro → Sections → Subsections → Conclusion | Deep coverage, SEO |
| **Beginner Guide** | Prerequisites → Step-by-step → Tips → Next Steps | Onboarding |
| **FAQ** | Question → Answer pairs | Quick answers |
| **Cheat Sheet** | Category → Item → Syntax/Example | Quick reference |
| **Comparison** | Feature matrix + prose per dimension | Decision-making |
| **Timeline** | Chronological events with context | Historical topics |
| **Checklist** | Ordered actionable items with explanations | Procedural |
| **Glossary** | Term → Definition pairs | Vocabulary reference |

### Styles (composable modifiers)

| Style | Effect |
|-------|--------|
| `beginner` | Simpler vocabulary, more context |
| `intermediate` | Standard, balanced |
| `expert` | Concise, technical |
| `casual` | Conversational tone |
| `formal` | Academic/professional tone |
| `concise` | Minimal prose, bullet-heavy |

Styles can be composed: `{ format: "long-article", style: ["expert", "concise"] }`.

**Phase 11 scope:** Long Article + FAQ only. Additional formats in Phase 12+.

---

## 5. Natural Language Strategy

### Template Composition with Deterministic Variation

Four-level template hierarchy:

```
Section Templates    →  define structure (intro, body, conclusion)
Paragraph Templates  →  define paragraph shape (topic + supporting + transition)
Sentence Templates   →  define individual sentence patterns with slots
Grammar Rules        →  handle agreement, plurality, articles, conjunctions
```

### Sentence Templates

```typescript
interface SentenceTemplate {
  id: string;
  pattern: string;           // "{subject} {verb} {object}"
  variants: string[];        // alternative phrasings
  factTypes: FactType[];     // which fact types this handles
  styles: string[];          // which styles this suits
}
```

### Deterministic Variation

Template selection uses a seeded hash — no randomness:

```typescript
function selectVariant(variants: string[], factIndex: number, slug: string): string {
  const seed = hashCode(`${slug}:${factIndex}`);
  return variants[seed % variants.length];
}
```

Same package = same variant selection = identical output.

### Paragraph Assembly

```
1. Topic sentence    (main claim)
2. Supporting facts  (1-3 elaborating facts)
3. Evidence note     (inline citation reference)
4. Transition        (connects to next paragraph)
```

### Section Assembly

Sections ordered by Block Priority. Facts grouped by type and clustered by relationship.

### Transition Bank

Deterministic transitions selected by position hash:

```
Additive:     ["Additionally,", "Furthermore,", "Moreover,"]
Contrastive:  ["However,", "On the other hand,", "That said,"]
Causal:       ["As a result,", "Consequently,", "Therefore,"]
Sequential:   ["First,", "Next,", "Finally,"]
```

---

## 6. Document Tree — Block Model

The intermediate representation all renderers produce:

```typescript
type DocumentNode =
  | HeadingNode
  | ParagraphNode
  | ListNode
  | ListItemNode
  | CodeBlockNode
  | BlockquoteNode
  | TableNode
  | CitationRefNode
  | CitationBlockNode
  | InternalLinkNode
  | DividerNode
  | MetadataNode
  | MissingKnowledgeNode
  | ImagePlaceholderNode
  | CommercialPlaceholderNode;

interface HeadingNode {
  type: "heading";
  level: 1 | 2 | 3 | 4;
  text: string;
  anchor: string;
}

interface ParagraphNode {
  type: "paragraph";
  children: InlineNode[];
}

interface ListNode {
  type: "list";
  ordered: boolean;
  items: ListItemNode[];
}

interface ListItemNode {
  type: "list-item";
  children: InlineNode[];
}

interface CodeBlockNode {
  type: "code-block";
  language: string;
  code: string;
}

interface BlockquoteNode {
  type: "blockquote";
  children: DocumentNode[];
}

interface TableNode {
  type: "table";
  headers: string[];
  rows: string[][];
}

interface CitationRefNode {
  type: "citation-ref";
  index: number;
  citationId: string;
}

interface CitationBlockNode {
  type: "citation-block";
  entries: CitationEntry[];
}

interface InternalLinkNode {
  type: "internal-link";
  targetSlug: string;
  text: string;
  relationship: string;
  strength: string;
}

interface DividerNode {
  type: "divider";
}

interface MetadataNode {
  type: "metadata";
  key: string;
  value: string;
}

interface MissingKnowledgeNode {
  type: "missing-knowledge";
  expectedFactType: string;
  sectionName: string;
  severity: "critical" | "recommended" | "optional";
}

interface ImagePlaceholderNode {
  type: "image-placeholder";
  altText: string;
  context: string;
  suggestedType: "diagram" | "screenshot" | "chart" | "illustration" | "photo";
  width: "full" | "half" | "inline";
}

interface CommercialPlaceholderNode {
  type: "commercial-placeholder";
  placement: "top" | "mid" | "bottom" | "sidebar";
  context: string;
  category: string;
  reserved: true;
}

interface CitationEntry {
  index: number;
  sourceName: string;
  sourceUrl: string | null;
  authority: string;
  retrievedAt: string;
}

type InlineNode =
  | string
  | CitationRefNode
  | InternalLinkNode
  | { type: "bold"; text: string }
  | { type: "italic"; text: string }
  | { type: "code"; text: string };
```

---

## 7. Missing Knowledge Indicators

When the Render Rules Engine detects gaps, `MissingKnowledgeNode` blocks are inserted into the Document Tree:

```typescript
interface MissingKnowledgeFlag {
  factType: string;           // what's missing
  sectionName: string;        // where it would appear
  severity: "critical" | "recommended" | "optional";
  suggestion: string;         // actionable: "Add definition facts for this topic"
}
```

**Severity levels:**

| Severity | Meaning | Render Behavior |
|----------|---------|-----------------|
| `critical` | Package cannot produce quality output | Block rendering, return diagnostic-only |
| `recommended` | Output will lack important sections | Render with placeholder, flag in diagnostics |
| `optional` | Nice-to-have sections missing | Render without, note in diagnostics |

In production output, `MissingKnowledgeNode` blocks are **stripped** by the serializer. They only appear in preview/admin views and diagnostics.

---

## 8. Render Quality Score

After rendering, the Document Tree is scored:

```typescript
interface RenderQualityScore {
  overall: number;              // 0-100
  factCoverage: number;         // % of package facts used in output
  citationCoverage: number;     // % of facts with citation references
  sectionCompleteness: number;  // % of required sections present
  readabilityEstimate: number;  // based on sentence length + vocabulary level
  missingKnowledgeCount: number;
  missingKnowledgeSeverity: Record<string, number>;  // { critical: 0, recommended: 1, optional: 2 }
  wordCount: number;
  sectionCount: number;
  internalLinkCount: number;
  citationCount: number;
}
```

**Quality thresholds:**

| Score | Label | Action |
|-------|-------|--------|
| 80-100 | Excellent | Publish |
| 60-79 | Good | Publish with review flag |
| 40-59 | Fair | Publish as draft only |
| 0-39 | Poor | Do not publish, flag for knowledge assembly |

The quality score is stored with the rendered output for monitoring and auditing.

---

## 9. Render Diagnostics

Every render produces a diagnostics report alongside the output:

```typescript
interface RenderDiagnostics {
  rendererId: string;
  rendererVersion: string;
  templateVersion: string;
  packageSlug: string;
  knowledgeHash: string;
  cacheKey: string;

  // Timing
  renderDurationMs: number;
  rulesEvaluationMs: number;
  citationRenderMs: number;
  serializationMs: number;

  // Coverage
  factsTotal: number;
  factsUsed: number;
  factsSkipped: string[];           // fact IDs not used (with reason)
  citationsTotal: number;
  citationsReferenced: number;

  // Quality
  qualityScore: RenderQualityScore;
  missingKnowledge: MissingKnowledgeFlag[];

  // Decisions
  policyApplied: string;
  blockOrder: BlockPriority[];
  templateSelectionsUsed: number;
  variantSeed: string;

  // Warnings
  warnings: string[];
}
```

Diagnostics are stored with each rendered output for full auditability. The diagnostics are not served to public users — they are admin/preview only.

---

## 10. Renderer Plugins

Section rendering is extensible via plugins:

```typescript
interface RendererPlugin {
  id: string;
  name: string;
  version: string;
  sectionTypes: string[];                  // which section types this plugin handles
  render(facts: KnowledgeFactRow[], config: PluginConfig): DocumentNode[];
}

interface PluginConfig {
  style: string[];
  maxFacts: number | null;
  slug: string;
  sectionIndex: number;
}
```

### Built-in Plugins

| Plugin | Handles | Output |
|--------|---------|--------|
| `DefinitionPlugin` | definition facts | Heading + paragraphs |
| `PropertyListPlugin` | property facts | Heading + bullet list |
| `HistoryPlugin` | historical facts | Heading + chronological paragraphs |
| `ProcedurePlugin` | procedural facts | Heading + ordered list |
| `ComparisonPlugin` | comparison facts | Heading + table |
| `WarningPlugin` | warning facts | Heading + blockquote callouts |
| `MeasurementPlugin` | measurement facts | Heading + stats blocks |
| `FAQPlugin` | any facts | Q&A pairs |

### Plugin Registry

```typescript
interface PluginRegistry {
  plugins: Map<string, RendererPlugin>;
  register(plugin: RendererPlugin): void;
  getForSection(sectionType: string): RendererPlugin | null;
}
```

New plugins can be added without modifying the core renderer. Each plugin produces `DocumentNode[]` — the core renderer assembles them into the full Document Tree.

---

## 11. Citation Rendering (Dedicated)

A separate, composable stage:

```
Renderer produces DocumentTree with CitationRefNode markers
        ↓
Citation Renderer resolves references against package citations
        ↓
Injects CitationBlockNode (bibliography) into DocumentTree
```

```typescript
interface CitationRenderer {
  decorate(tree: DocumentNode[], citations: KnowledgeCitationRow[]): DocumentNode[];
}
```

Citation rendering is:
- Testable in isolation
- Style-swappable (APA, IEEE, inline, numbered)
- Independent of article format

---

## 12. Internal Linking

Knowledge Relationships drive internal links:

```typescript
interface InternalLink {
  targetSlug: string;
  targetLevel: string;       // "package" | "fact" | "section"
  anchorText: string;        // from relationship explanation or target title
  relationship: string;
  strength: string;
}
```

**Placement rules:**
- **Strong** relationships → inline links within paragraphs
- **Moderate** relationships → "See also" callouts
- **Weak** relationships → "Related Topics" footer section

Link text is derived from structured data — never invented.

---

## 13. Multi-Output Strategy

```
                    Knowledge Package
                          │
              ┌───────────┼───────────────┐
              ↓           ↓               ↓
       Long Article    FAQ Page      Cheat Sheet
              │           │               │
              ↓           ↓               ↓
        DocumentTree  DocumentTree   DocumentTree
              │           │               │
         ┌────┤      ┌────┤          ┌────┤
         ↓    ↓      ↓    ↓          ↓    ↓
       HTML  MD    HTML   MD       HTML   MD
```

### Render Manifest

```typescript
interface RenderManifest {
  packageId: string;
  outputs: {
    rendererId: string;
    style: string[];
    formats: OutputFormat[];
  }[];
}
```

Default: `long-article (intermediate) → [html, markdown]`. Expandable per slot/topic.

---

## 14. Update Strategy

**Selective regeneration, hash-gated.**

```
Package hash changes → compare vs cached outputs → re-render only stale outputs
```

| Mode | Trigger | Use Case |
|------|---------|----------|
| **Eager** | Package updated → immediate re-render | Small sites, preview |
| **Lazy** | Page requested → check hash → re-render if stale | Large sites |
| **Batch** | Scheduled scan → re-render stale outputs | Millions of pages |

Start with Lazy. Design for all three.

---

## 15. Performance

- **Determinism = cacheability.** Outputs cached until cache key changes.
- **CDN-friendly.** `knowledge_hash` as ETag.
- **No runtime rendering for reads.** All reads hit cache or pre-built artifacts.
- **ISR-compatible.** Next.js Incremental Static Regeneration fits naturally.
- **No AI inference cost.** Templates are CPU-only, ~50-200ms per page.
- **Parallelizable.** Each package renders independently.

---

## 16. Localization (Serializer-Ready)

The Document Tree is locale-agnostic. Localization is handled at the serializer layer:

```typescript
interface LocaleConfig {
  language: string;          // "en", "es", "de"
  dateFormat: string;
  numberFormat: string;
  translationKeys: Map<string, string>;  // UI strings only — fact content stays in source language
}
```

- Fact content is **not** translated by the serializer (that would require a separate Knowledge Package per locale)
- UI chrome (section headings, "Related Topics", "Sources") is locale-aware
- Date/number formatting is locale-aware
- The Document Tree structure is identical across locales

---

## 17. Image Placeholder Blocks

Renderers can insert image placeholders where visual content would enhance understanding:

```typescript
interface ImagePlaceholderNode {
  type: "image-placeholder";
  altText: string;                // descriptive alt text
  context: string;                // what this image should depict
  suggestedType: "diagram" | "screenshot" | "chart" | "illustration" | "photo";
  width: "full" | "half" | "inline";
}
```

- Placeholders are **not** rendered in production output initially
- They serve as structured requests for future image generation or manual upload
- Preview UI shows placeholders with their context for editorial review
- When images are provided, they replace the placeholder via a separate asset pipeline

---

## 18. Commercial Placeholder Blocks (Reserved)

Reserved for the future Revenue Engine. Not implemented yet.

```typescript
interface CommercialPlaceholderNode {
  type: "commercial-placeholder";
  placement: "top" | "mid" | "bottom" | "sidebar";
  context: string;               // topic context for relevance matching
  category: string;              // content category
  reserved: true;                // always true — this is a reservation
}
```

- The renderer inserts these at policy-defined positions
- `RenderingPolicy.commercialPlaceholders` controls whether they appear
- The serializer renders them as empty `<div>` with data attributes
- A future Revenue Engine fills them at serve-time
- **No ad logic in the renderer.** The renderer only reserves positions.

---

## 19. AI Extensibility (Future-Proofing)

### Strategy Pattern

```typescript
interface RenderStrategy {
  name: string;
  version: string;
  render(pkg: KnowledgePackage, config: RendererConfig): DocumentTree;
}
```

Today: `TemplateRenderStrategy` — deterministic, template-based.
Future: `AIAssistedRenderStrategy` — LLM-powered prose generation.

Both strategies:
- Receive the same Knowledge Package input
- Produce the same Document Tree output format
- Never modify the Knowledge Package
- Populate the same cache key structure
- Go through the same Citation Renderer + Quality Score pipeline

### AI Guardrails (Future)

1. AI receives **only** the Knowledge Package as context
2. AI output validated against fact set — no hallucinated facts
3. Citations are never AI-generated
4. AI output stored with distinct `renderer_version`
5. Deterministic rendering remains available as fallback

---

## Engineering Rules

1. **The Knowledge Package is the single source of truth.** The renderer never invents, modifies, or bypasses knowledge.
2. **Renderers are pure functions.** No side effects, no state, no network calls.
3. **Document Tree is the intermediate representation.** All renderers produce it. All serializers consume it.
4. **Citations are rendered by a dedicated Citation Renderer.** Never embedded in article rendering logic.
5. **Cache keys include knowledge_hash + renderer_version + template_version + output_format.**
6. **Missing Knowledge is flagged, not fabricated.** Gaps produce indicators, not invented content.
7. **Quality is scored and auditable.** Every render produces diagnostics.
8. **Plugins extend section rendering without modifying the core.** New fact types = new plugins, not core changes.
9. **Commercial placeholders are reserved, not implemented.** No ad logic in the renderer.
10. **Localization is serializer-level.** The Document Tree is locale-agnostic.
11. **The Renderer must never make business decisions.** No affiliate placement, no advertisement decisions, no monetization logic, no pricing logic, no revenue optimization. The renderer's sole responsibility is presentation. Future Revenue Engineering consumes the Document Tree and injects commercial components afterward. Knowledge, Presentation, and Business are three independent systems. This separation must never be violated.

---

## System Separation Principle

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   KNOWLEDGE     │     │  PRESENTATION   │     │    BUSINESS     │
│                 │     │                 │     │                 │
│ Discovery       │     │ Renderer        │     │ Revenue Engine  │
│ Assembler       │     │ Document Tree   │     │ Ad Placement    │
│ Knowledge Pkg   │     │ Serializer      │     │ Monetization    │
│                 │     │ Cache           │     │ Pricing         │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         └───────────►───────────┘                       │
                  consumes                               │
                                 └───────────►───────────┘
                                       consumes
```

These three systems never cross boundaries. Each consumes the output of the previous. None modifies upstream data.

---

## Unidirectional Knowledge Flow

```
Discovery
      ↓
Knowledge Assembler
      ↓
Knowledge Package (single source of truth)
      ↓
Render Rules Engine
      ↓
Renderer (pure function)
      ↓
Document Tree
      ↓
Citation Renderer + Quality Score
      ↓
Output Serializer
      ↓
Rendered Output (HTML / Markdown / PDF)
```

No shortcuts. No bypasses. No duplicate knowledge stores.
