# Phase 20.1: Quality Scorer Audit

**Date:** 2026-07-03  
**File:** `services/renderer/qualityScorer.ts`  
**Related:** `services/renderer/readingFlowValidator.ts`

---

## Complete Scoring Algorithm

### Overall Score Formula

```
Overall Score = (factCoverage × 0.20) +
               (citationCoverage × 0.15) +
               (sectionCompleteness × 0.15) +
               (readabilityEstimate × 0.15) +
               (readingFlowScore × 0.15) +
               (cappedWordCount × 0.10) +
               (substantialContentBonus) -
               (missingKnowledgePenalty)

Where:
- cappedWordCount = Math.min(100, wordCount / 5)
- substantialContentBonus = 10 if wordCount >= 100, else 0
- missingKnowledgePenalty = missingKnowledgeCount × 5
- Final score = Math.max(0, Math.min(100, Math.round(score)))
```

---

## Metrics and Weights

### Primary Metrics (in Overall Score)

| Metric | Weight | Calculation | Range |
|--------|--------|-------------|-------|
| **Fact Coverage** | 20% | `Math.min(100, (wordCount / (facts.length × 12)) × 100)` | 0-100 |
| **Citation Coverage** | 15% | `(citationCount / citations.length) × 100` | 0-100 |
| **Section Completeness** | 15% | `(presentRequiredSections / totalRequiredSections) × 100` | 0-100 |
| **Readability Estimate** | 15% | Based on wordsPerSection (see below) | 0-100 |
| **Reading Flow Score** | 15% | Weighted average of 6 sub-metrics (see below) | 0-100 |
| **Word Count (capped)** | 10% | `Math.min(100, wordCount / 5)` | 0-100 |
| **Substantial Content Bonus** | +10 | `10 if wordCount >= 100 else 0` | 0 or 10 |
| **Missing Knowledge Penalty** | -5 per | `missingKnowledgeCount × 5` | Unbounded negative |

### Secondary Metrics (tracked but not in Overall Score)

| Metric | Calculation | Purpose |
|--------|-------------|---------|
| **Word Count** | Sum of words in all text nodes | Content length, used in multiple calculations |
| **Section Count** | Count of H2 headings | Structure complexity |
| **Citation Count** | Entries in citation block | Source coverage |
| **Internal Link Count** | Count of internal-link nodes | Knowledge graph connectivity |
| **Missing Knowledge Severity** | Count by severity (critical/recommended/optional) | Gap analysis |

---

## Detailed Metric Calculations

### 1. Fact Coverage (20% weight)

**Formula:** `Math.min(100, Math.round((wordCount / Math.max(1, facts.length × 12)) × 100))`

**Assumption:** Each fact needs ~12 words to be properly represented.

**Problem:** This metric heavily favors longer content. If you add more facts but keep word count the same, coverage decreases.

**Example:**
- 10 facts, 200 words: (200 / 120) × 100 = 166 → capped at 100
- 20 facts, 200 words: (200 / 240) × 100 = 83
- Adding facts without increasing word count reduces this score.

### 2. Citation Coverage (15% weight)

**Formula:** `Math.round((citationCount / citations.length) × 100)`

**Measures:** Percentage of available citations actually referenced in the output.

### 3. Section Completeness (15% weight)

**Formula:** `(requiredSectionsPresent / totalRequiredSections) × 100`

**Required Sections:** Definition is always required (from rules engine).

**Problem:** The current implementation appears buggy - it checks if ANY H2 exists, not if specific required sections are present.

### 4. Readability Estimate (15% weight)

**Formula:** Based on wordsPerSection ratio.

**Scoring:**
- 90 points: 50-250 words per section (optimal)
- 80 points: 30-350 words per section
- 70 points: ≥20 words per section
- 50 points: <20 words per section

**Problem:** This favors moderate density, penalizing both too sparse and too dense content.

### 5. Reading Flow Score (15% weight)

**Formula:** Weighted average of 6 sub-metrics.

| Sub-Metric | Weight | Calculation |
|------------|--------|-------------|
| Repeated Openings | 15% | `100 - (repeats × 20)` |
| Paragraph Length Balance | 20% | Based on stdDev of paragraph lengths |
| Heading Density | 15% | Based on heading-to-block ratio |
| Bullet List Ratio | 15% | Based on list-to-block ratio |
| Transition Quality | 15% | Based on transition signal detection |
| Sentence Variety | 20% | Based on stdDev of sentence lengths |

**Detailed Sub-Metrics:**

#### a) Repeated Openings (15% of flow score)
**Measures:** Consecutive paragraphs starting with the same word.
**Score:** `100 - (repeats × 20)`, min 0.
**Problem:** Only penalizes consecutive repeats, not overall repetition.

#### b) Paragraph Length Balance (20% of flow score)
**Measures:** Standard deviation of paragraph lengths.
**Scoring:**
- 90: stdDev 3-15 words (good variation)
- 75: stdDev 2-20 words
- 50: stdDev < 2 (too uniform/robotic)
- 60: stdDev > 20 (too much variation)

#### c) Heading Density (15% of flow score)
**Measures:** Ratio of headings to total blocks.
**Scoring:**
- 90: 0.15-0.33 ratio (1 heading per 3-6 blocks)
- 75: 0.10-0.40 ratio
- 50: >0.40 ratio (too many headings)
- 60: <0.10 ratio (too few headings)

#### d) Bullet List Ratio (15% of flow score)
**Measures:** Ratio of lists to total blocks.
**Scoring:**
- 95: ≤20% lists
- 85: ≤30% lists
- 70: ≤45% lists
- 50: >45% lists (too list-heavy)

#### e) Transition Quality (15% of flow score)
**Measures:** Percentage of paragraphs with transition signals.
**Signals:** however, additionally, furthermore, moreover, in contrast, as a result, consequently, therefore, meanwhile, nevertheless, on the other hand, in summary, building on, with the fundamentals, now that, knowing, understanding, these features, this history
**Scoring:**
- 90: 20-40% of paragraphs have transitions
- 75: ≥10% of paragraphs have transitions
- 55: <10% of paragraphs have transitions

**Problem:** Limited set of transition signals, may miss educational transitions.

#### f) Sentence Variety (20% of flow score)
**Measures:** Standard deviation of sentence lengths.
**Scoring:**
- 95: stdDev ≥7 words
- 85: stdDev ≥5 words
- 70: stdDev ≥3 words
- 50: stdDev <3 words (too monotonous)

### 6. Word Count (capped) (10% weight)

**Formula:** `Math.min(100, wordCount / 5)`

**Examples:**
- 100 words: 20 points
- 300 words: 60 points
- 500 words: 100 points (capped)
- 1000 words: 100 points (capped)

**Problem:** Strong bias toward longer content. After 500 words, no additional benefit, but shorter content is heavily penalized.

### 7. Substantial Content Bonus (+10 points)

**Formula:** `10 if wordCount >= 100 else 0`

**Threshold:** Very low - only 100 words needed.

### 8. Missing Knowledge Penalty (-5 per missing)

**Formula:** `missingKnowledgeCount × 5`

**Severities:** critical, recommended, optional (all penalized equally).

---

## Critical Issues Identified

### 1. Word Count Bias (25% total weight)

**Word count appears in 3 places:**
- Direct 10% weight (capped)
- +10 bonus for ≥100 words
- Indirectly in fact coverage calculation

**Total impact:** ~25-30% of score depends on word count.

**Problem:** Longer content is rewarded even if it's verbose, repetitive, or low quality.

### 2. Fact Coverage Formula Flaw

**Formula:** `wordCount / (facts.length × 12)`

**Problem:** Adding facts without increasing word count reduces coverage. This discourages efficient, concise content.

**Example:**
- Before: 10 facts, 500 words → coverage = 100
- After: 20 facts, 500 words → coverage = 83

Even though you added educational value, the score drops.

### 3. No Educational Depth Metrics

**Missing metrics that measure educational quality:**
- Concept clarity
- Mental models presence
- Analogies effectiveness
- Practical examples
- Decision frameworks
- Knowledge graph usage
- Learning progression
- Retention factors

### 4. Section Completeness Implementation Bug

The current implementation checks if ANY H2 exists, not if specific required sections are present.

### 5. Limited Transition Signals

Only 17 transition signals detected, missing many educational transitions like "for example," "specifically," "in practice," etc.

---

## Summary

**Total Weight Distribution:**
- Length-based metrics: ~25-30% (word count, fact coverage via word count)
- Structural metrics: ~15% (section completeness, heading density)
- Flow metrics: ~15% (reading flow)
- Citation metrics: ~15% (citation coverage)
- Penalties: Variable (missing knowledge)

**Key Finding:** The scoring system heavily favors longer content over educational quality. Enrichment that adds value without increasing word count is penalized.

**Recommendation:** Redesign to prioritize learning quality, conceptual clarity, and educational effectiveness over verbosity.
