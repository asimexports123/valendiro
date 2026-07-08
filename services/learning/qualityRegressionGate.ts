/**
 * Quality Regression Gate — republish ONLY if knowledge improved.
 */

import type { KnowledgePackageQualityMetrics } from "@/services/knowledge/knowledgePackageMetrics";

export interface QualitySnapshot {
  packageId: string;
  wordCount: number;
  metrics: KnowledgePackageQualityMetrics;
}

export interface RegressionDecision {
  improved: boolean;
  reason: string;
  delta: {
    richness: number;
    completeness: number;
    facts: number;
    citations: number;
    words: number;
  };
}

export function evaluateQualityImprovement(
  before: QualitySnapshot | null,
  after: QualitySnapshot
): RegressionDecision {
  // First-time package from acquired evidence always improves an empty baseline
  if (!before) {
    return {
      improved: after.metrics.factCount >= 2,
      reason:
        after.metrics.factCount >= 2
          ? `First knowledge package created with ${after.metrics.factCount} facts`
          : "Acquired evidence produced too few facts",
      delta: {
        richness: after.metrics.knowledgeRichness,
        completeness: after.metrics.completenessScore,
        facts: after.metrics.factCount,
        citations: after.metrics.citationCount,
        words: after.wordCount,
      },
    };
  }

  const delta = {
    richness: after.metrics.knowledgeRichness - before.metrics.knowledgeRichness,
    completeness: after.metrics.completenessScore - before.metrics.completenessScore,
    facts: after.metrics.factCount - before.metrics.factCount,
    citations: after.metrics.citationCount - before.metrics.citationCount,
    words: after.wordCount - before.wordCount,
  };

  // Hard reject: destroying a stronger package
  if (delta.facts < 0 && delta.richness < 0) {
    return {
      improved: false,
      reason: "Fact count and knowledge richness both decreased",
      delta,
    };
  }

  if (delta.richness < -10 && before.wordCount > 800 && delta.words < -200) {
    return {
      improved: false,
      reason: "Severe regression on a strong topic",
      delta,
    };
  }

  const improved =
    delta.richness > 0 ||
    delta.completeness > 0 ||
    delta.facts > 0 ||
    delta.citations > 0 ||
    (delta.words > 50 && delta.richness >= -2);

  return {
    improved,
    reason: improved
      ? `Improved: richness ${delta.richness >= 0 ? "+" : ""}${delta.richness}, facts ${delta.facts >= 0 ? "+" : ""}${delta.facts}, citations ${delta.citations >= 0 ? "+" : ""}${delta.citations}`
      : "No meaningful improvement detected",
    delta,
  };
}
