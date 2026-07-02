# Phase 12 Implementation Roadmap — Product Polish

**Status:** COMPLETE — RENDERING ENGINE FROZEN  
**Depends on:** Phase 11 Rendering Layer (COMPLETE)  
**Objective:** Transform rendered outputs from functional articles into premium educational content.

---

## Guiding Principle

Phase 12 is not about renderer quantity. It is about **output quality**.

Every change must answer: "Does this make the reading experience measurably better?"

---

## 1. Typography & Reading Rhythm

### Problem

Current output is syntactically correct but reads flat. Sentence variety is limited, paragraph rhythm is uniform, and there's no visual hierarchy beyond heading levels.

### Deliverables

- **Sentence length variation** — Introduce short/medium/long sentence patterns per paragraph. Avoid monotone rhythm.
- **Opening sentence diversity** — Expand variant pools from 3-4 to 8-12 per fact type. Eliminate repetitive openers.
- **Paragraph breathing** — Vary paragraph length (1-sentence emphasis, 2-sentence transitions, 3-4 sentence standard). Current system produces uniform 2-3 sentence paragraphs.
- **Lead paragraph** — First paragraph of every article should be a concise, compelling summary (inverted pyramid style).
- **Reading flow signals** — Add transitional phrases between sections, not just between paragraphs.

### Measurement

- No two adjacent paragraphs should start with the same word
- Sentence length standard deviation > 5 words per section
- Lead paragraph ≤ 40 words

---

## 2. Section Transitions

### Problem

Sections currently begin abruptly. There's no connecting tissue between a "Properties" section and a "History" section.

### Deliverables

- **Inter-section transitions** — Dedicated transition sentences between major sections.
- **Section introduction lines** — Brief 1-sentence context before diving into facts.
- **Section conclusion lines** — Optional wrap-up sentences for longer sections (4+ facts).
- **Contextual connectors** — Transitions that reference the previous section's topic, not just generic "Additionally" fillers.

### Measurement

- Every section with 3+ facts should have an intro line
- Transitions between sections should reference the previous section's subject

---

## 3. Callout Blocks

### Problem

Warnings and important notes render as plain blockquotes. They lack visual distinction and semantic weight.

### Deliverables

- **New Document Tree node: `CalloutNode`**
  ```typescript
  interface CalloutNode {
    type: "callout";
    variant: "info" | "warning" | "tip" | "important" | "example";
    title: string | null;
    children: DocumentNode[];
  }
  ```
- **Warning facts** → rendered as `warning` callouts
- **Key definitions** → rendered as `info` callouts when inline
- **Best practices** → rendered as `tip` callouts
- **HTML serializer** — renders callouts with distinct styling classes
- **Markdown serializer** — renders as `> [!NOTE]` / `> [!WARNING]` GitHub-style admonitions

### Measurement

- Warning facts never render as plain text
- Callouts have distinct CSS classes for each variant

---

## 4. Tables & Comparison Layouts

### Problem

Comparison facts currently render as prose paragraphs. Structured comparisons should be visual.

### Deliverables

- **Smart table generation** — When 3+ facts share a comparison structure, generate a comparison table instead of prose.
- **Feature matrix detection** — Detect "X has A, Y has B" patterns and produce a feature table.
- **Table styling** — Zebra striping, compact vs spacious modes, responsive overflow.
- **Comparison plugin upgrade** — Detect tabular structure in fact statements, produce `TableNode` when appropriate, fall back to prose otherwise.

### Measurement

- Packages with 3+ comparison facts produce at least one table
- Tables have headers derived from fact structure

---

## 5. Code Block Rendering

### Problem

Code blocks exist in the Document Tree but are never generated from current fact types. When they do appear, they lack language hints and formatting.

### Deliverables

- **Code detection** — Detect inline code patterns in fact statements (e.g., "`pip install`", function names, CLI commands).
- **Inline code marking** — Wrap detected code tokens in `CodeNode` inline markers.
- **Code block extraction** — Multi-line code in procedural facts should become `CodeBlockNode`.
- **Language inference** — Detect language from context (slug contains "python" → `language: "python"`).

### Measurement

- Technical topics produce inline code markers for keywords
- Procedural facts with CLI commands produce code blocks

---

## 6. Responsive Layout & Accessibility

### Problem

HTML output is semantically correct but lacks responsive design signals and accessibility attributes.

### Deliverables

- **Semantic HTML improvements** — `<section>`, `<nav>`, `<aside>`, `<main>` wrappers where appropriate.
- **ARIA landmarks** — `role` attributes on major sections.
- **Skip navigation** — Hidden link to jump to content.
- **Table of Contents generation** — New `TableOfContentsNode` that lists all H2 sections with anchor links.
- **Responsive hints** — CSS class signals for mobile/tablet/desktop layout modes (not full CSS — just semantic markers).
- **Alt text for image placeholders** — Already present, ensure quality.

### Measurement

- HTML output passes basic accessibility lint (heading order, ARIA roles)
- Table of Contents present for articles with 3+ sections

---

## 7. Navigation & Table of Contents

### Problem

Long articles lack navigation. Users can't scan structure at a glance.

### Deliverables

- **New Document Tree node: `TableOfContentsNode`**
  ```typescript
  interface TableOfContentsNode {
    type: "table-of-contents";
    entries: { text: string; anchor: string; level: number }[];
  }
  ```
- **Auto-generated** from heading nodes in the Document Tree.
- **Inserted after the lead paragraph** for Long Article format.
- **HTML serializer** — renders as `<nav class="toc">` with anchor links.
- **Markdown serializer** — renders as a bullet list of links.

### Measurement

- Articles with 3+ sections include a ToC
- ToC entries match section headings exactly

---

## 8. Related Knowledge Section

### Problem

Internal links currently render as a simple "See Also" list. They lack context about why topics are related.

### Deliverables

- **Contextual relationship descriptions** — Use the `explanation` field from Knowledge Relationships to describe why a topic is related.
- **Grouped by relationship type** — "Prerequisites", "Related Concepts", "Advanced Topics" instead of flat list.
- **Strength-based ordering** — Strong relationships first, with brief descriptions.
- **Cross-package linking** — When relationships reference other package slugs, generate inter-article links.

### Measurement

- Related section groups links by type
- Each link has a 1-sentence description when `explanation` is available

---

## 9. Summary Block

### Problem

Articles end abruptly after the last section. There's no concluding summary.

### Deliverables

- **Auto-generated summary** — Final section that restates key definition facts + measurement facts in 2-3 sentences.
- **Key takeaways list** — Bullet list of the 3-5 highest-confidence facts.
- **New Document Tree node: `SummaryNode`**
  ```typescript
  interface SummaryNode {
    type: "summary";
    keyPoints: string[];
    closingSentence: string;
  }
  ```

### Measurement

- Every article with 10+ facts includes a summary section
- Summary contains 3-5 bullet points

---

## 10. Quality Score Improvements

### Problem

Current quality scoring is basic (word count, section count, coverage %). It doesn't measure reading quality.

### Deliverables

- **Sentence variety score** — Penalize repetitive sentence openings.
- **Transition presence score** — Reward articles with inter-section transitions.
- **Structure score** — Reward articles with ToC, summary, callouts.
- **Depth score** — Reward articles where sections have 3+ facts (not just headers with 1 bullet).
- **Quality threshold refinement** — Adjust thresholds based on real output analysis.

### Measurement

- Quality score reflects actual reading quality, not just coverage
- Score correlates with perceived article quality

---

## Implementation Order

1. **Typography & Reading Rhythm** — Foundation for everything else
2. **Section Transitions** — Makes articles flow naturally
3. **Callout Blocks** — New node type + plugin upgrades
4. **Table of Contents & Navigation** — New node type + serializer updates
5. **Summary Block** — New node type + auto-generation
6. **Tables & Comparison Layouts** — Plugin upgrade
7. **Code Block Rendering** — Detection + marking
8. **Related Knowledge Section** — Link renderer upgrade
9. **Responsive Layout & Accessibility** — Serializer improvements
10. **Quality Score Improvements** — Scoring refinements

---

## New Document Tree Nodes

| Node | Purpose |
|------|---------|
| `CalloutNode` | Warnings, tips, info, examples |
| `TableOfContentsNode` | Navigation for long articles |
| `SummaryNode` | Closing summary with key takeaways |

These extend the Document Tree without modifying existing nodes.

---

## What Phase 12 Does NOT Do

- Does not add new renderer formats (Cheat Sheet, Timeline, etc.)
- Does not implement CSS/styling (that's a frontend concern)
- Does not add AI-generated prose
- Does not implement business logic
- Does not modify Knowledge Packages
- Does not modify Discovery

---

## Success Criteria

After Phase 12, a rendered article should:

1. Read naturally — no robotic repetition, good rhythm
2. Flow between sections — transitions connect topics
3. Be scannable — ToC, callouts, summary provide quick navigation
4. Handle structured data visually — comparisons as tables, code as code blocks
5. End with purpose — summary restates key points
6. Score higher on quality — improved scoring reflects improved output
7. Remain deterministic — same input = same output
8. Remain pure — no side effects, no mutations
9. Remain backward compatible — all prior tests pass

---

## Rollback Strategy

Phase 12 modifies existing renderer services but adds no new database tables.

### Rollback = revert renderer service files

- `services/renderer/types.ts` — revert new node types
- `services/renderer/templates.ts` — revert expanded variants
- `services/renderer/plugins/*` — revert plugin upgrades
- `services/renderer/renderers/longArticle.ts` — revert layout changes
- `services/renderer/serializers/*` — revert new node serialization
- `services/renderer/qualityScorer.ts` — revert scoring changes

All database tables, Knowledge Packages, and APIs remain unchanged.
