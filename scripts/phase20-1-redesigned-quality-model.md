# Phase 20.1: Redesigned Quality Model

**Date:** 2026-07-03  
**Objective:** Prioritize learning quality over article length  
**Current Issue:** Quality scorer rewards verbosity (25-30% weight on word count) and penalizes concise educational content.

---

## Current Model Problems

### 1. Word Count Bias (25-30% total weight)
- Direct word count: 10% weight (capped at 500 words)
- Substantial content bonus: +10 points for ≥100 words
- Fact coverage formula: `wordCount / (facts.length × 12)` - penalizes adding facts without increasing word count

**Impact:** Adding 5 enrichment facts without increasing word count reduces quality score.

### 2. No Educational Depth Metrics
Current model measures:
- Length (word count, section count)
- Structure (section completeness, heading density)
- Flow (reading flow, paragraph balance)
- Coverage (fact coverage, citation coverage)

Missing:
- Concept clarity
- Mental models presence
- Analogies effectiveness
- Practical examples
- Decision frameworks
- Knowledge graph connectivity
- Learning progression
- Retention factors

---

## Redesigned Quality Model

### Core Principle
**Reward understanding, not verbosity.**

### New Metrics

#### 1. Educational Depth Score (30% weight)

**Components:**
- **Mental Models Presence (8%)**: Detect cognitive frameworks in content
  - Patterns: "Think of X as Y", "X is like Y", "Model X as"
  - Score: 0-100 based on count and variety

- **Analogies Effectiveness (7%)**: Detect relatable comparisons
  - Patterns: "like a", "similar to", "compared to", "analogous to"
  - Score: 0-100 based on count, variety, and relevance

- **Practical Examples (7%)**: Detect real-world applications
  - Patterns: "for example", "in practice", "specifically", "use cases include"
  - Score: 0-100 based on count and specificity

- **Concept Clarity (8%)**: Measure explanation quality
  - Sentence complexity (lower = clearer for beginners)
  - Jargon ratio (lower = clearer)
  - Definition presence
  - Score: 0-100 composite

**Calculation:** Weighted average of components

#### 2. Learning Progression Score (20% weight)

**Components:**
- **Foundational → Advanced Flow (7%)**: Detect scaffolding
  - Patterns: "now that", "building on", "with these fundamentals", "understanding X"
  - Score: 0-100 based on presence and sequence

- **Decision Frameworks (7%)**: Detect actionable guidance
  - Patterns: "when to", "how to choose", "consider", "evaluate"
  - Score: 0-100 based on count and specificity

- **Common Misconceptions (6%)**: Detect error prevention
  - Patterns: "common mistake", "not to be confused", "avoid", "misconception"
  - Score: 0-100 based on count and clarity

**Calculation:** Weighted average of components

#### 3. Knowledge Graph Connectivity (15% weight)

**Components:**
- **Internal Link Count (8%)**: Links to related topics
  - Score: `min(100, internalLinkCount × 10)`

- **Cross-Reference Quality (7%)**: Relevance of linked content
  - Check if links are to semantically related topics
  - Score: 0-100 based on semantic similarity

**Calculation:** Weighted average

#### 4. Reader Journey Score (15% weight)

**Components:**
- **Hook Quality (5%)**: Opening paragraph engagement
  - Detect questions, surprising facts, relatable scenarios
  - Score: 0-100

- **Conclusion Effectiveness (5%)**: Closing reinforcement
  - Detect summaries, next steps, actionable takeaways
  - Score: 0-100

- **Transition Quality (5%)**: Flow between sections
  - Existing reading flow transition metric
  - Score: 0-100

**Calculation:** Weighted average

#### 5. Content Density Score (10% weight)

**Components:**
- **Information Density (5%)**: Facts per word
  - Formula: `min(100, (facts.length / wordCount) × 1000)`
  - Reward concise, information-rich content

- **Redundancy Penalty (5%)**: Penalize repetition
  - Detect repeated phrases, redundant explanations
  - Score: 0-100 (lower = more redundant)

**Calculation:** Weighted average

#### 6. Retention Factors (10% weight)

**Components:**
- **Memorability (5%)**: Detect mnemonic devices, patterns
  - Patterns: acronyms, rhymes, chunking, analogies
  - Score: 0-100

- **Application Scenarios (5%)**: Detect real-world use
  - Patterns: "you can use", "apply this", "in situations where"
  - Score: 0-100

**Calculation:** Weighted average

---

## Proposed Weight Distribution

| Metric | Weight | Rationale |
|--------|--------|-----------|
| **Educational Depth** | 30% | Core learning quality - mental models, analogies, examples, clarity |
| **Learning Progression** | 20% | Scaffolding, decision frameworks, misconceptions |
| **Knowledge Graph** | 15% | Connectivity to related knowledge |
| **Reader Journey** | 15% | Engagement, flow, conclusion |
| **Content Density** | 10% | Reward concise, information-rich content |
| **Retention Factors** | 10% | Memorability, application scenarios |
| **Penalties** | Variable | Missing critical knowledge |

**Total:** 100% + penalties

---

## Comparison: Before vs After

### Current Model
- Word count: 10% direct + ~15% indirect (via fact coverage) = **25%**
- Section count: ~10% (via section completeness)
- Flow: 15%
- Citations: 15%
- Fact coverage: 20% (biased by word count)
- Missing knowledge: -5 per

**Problem:** 25-30% of score depends on length.

### Redesigned Model
- Educational depth: **30%** (mental models, analogies, examples, clarity)
- Learning progression: **20%** (scaffolding, decisions, misconceptions)
- Knowledge graph: **15%** (connectivity)
- Reader journey: **15%** (engagement, flow)
- Content density: **10%** (reward conciseness)
- Retention factors: **10%** (memorability, application)

**Advantage:** 0% depends on raw word count. Rewards educational effectiveness.

---

## Implementation Strategy

### Phase 1: Add New Detectors
1. **Mental Model Detector** - Pattern matching for cognitive frameworks
2. **Analogy Detector** - Pattern matching for comparisons
3. **Example Detector** - Pattern matching for practical applications
4. **Clarity Scorer** - Sentence complexity, jargon ratio
5. **Progression Detector** - Detect scaffolding patterns
6. **Decision Framework Detector** - Detect actionable guidance
7. **Misconception Detector** - Detect error prevention
8. **Semantic Link Scorer** - Evaluate link relevance
9. **Hook Detector** - Evaluate opening engagement
10. **Conclusion Detector** - Evaluate closing effectiveness
11. **Redundancy Detector** - Detect repeated content
12. **Memorability Detector** - Detect mnemonic devices

### Phase 2: Update Quality Scorer
1. Replace word count weight with content density
2. Add educational depth score (30%)
3. Add learning progression score (20%)
4. Add knowledge graph score (15%)
5. Add reader journey score (15%)
6. Add retention factors score (10%)
7. Keep flow metrics (integrated into reader journey)
8. Keep citation coverage (5% reduced weight)
9. Keep missing knowledge penalties

### Phase 3: Validation
1. Test on enriched topics (should see score increase)
2. Test on verbose but low-quality content (should see score decrease)
3. Compare human evaluation scores vs. model scores
4. Calibrate weights based on human feedback

---

## Expected Impact

### On Enriched Topics
- **Before:** Score decreased due to word count reduction
- **After:** Score should increase due to:
  - Mental models (+8%)
  - Analogies (+7%)
  - Practical examples (+7%)
  - Concept clarity (+8%)
  - Learning progression (+20%)
  - Retention factors (+10%)

**Net change:** +50-60 points potential increase

### On Verbose Low-Quality Content
- **Before:** High score due to length
- **After:** Lower score due to:
  - Low content density
  - Low educational depth
  - Low learning progression
  - High redundancy penalty

**Net change:** -20-40 points decrease

---

## Detection Patterns

### Mental Models
- "Think of X as Y"
- "Model X as Y"
- "X acts like Y"
- "X works like Y"
- "Imagine X as Y"

### Analogies
- "like a"
- "similar to"
- "compared to"
- "analogous to"
- "just as"

### Practical Examples
- "for example"
- "in practice"
- "specifically"
- "use cases include"
- "consider this scenario"

### Learning Progression
- "now that"
- "building on"
- "with these fundamentals"
- "understanding X"
- "once you know Y"

### Decision Frameworks
- "when to"
- "how to choose"
- "consider"
- "evaluate"
- "decide between"

### Common Misconceptions
- "common mistake"
- "not to be confused"
- "avoid"
- "misconception"
- "many people think"

---

## Next Steps

1. Implement new detectors (Phase 1)
2. Update quality scorer with new metrics (Phase 2)
3. Validate on enriched topics (Phase 3)
4. Calibrate weights based on human evaluation
5. Deploy to production after validation

---

**Status:** Design Complete  
**Next:** Implementation Phase 1 - Add New Detectors
