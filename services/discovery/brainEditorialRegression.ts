/**
 * Editorial regression — protects the benchmark article from Brain composition regressions.
 */

import { countWords } from "@/services/knowledge/contentQualityGate";
import { scoreInternalContent } from "./internalContentScorer";
import { auditParagraphQuality } from "./paragraphQualityGate";
import { EDITORIAL_BENCHMARK_SLUG } from "./brainComposeVersion";

const MECHANICAL_TRANSITION_RE =
  /\b(From there|Building on that idea|That foundation leads|With that context set|The next piece of the picture|This connects directly),?\s/gi;

export interface EditorialMetrics {
  slug: string;
  wordCount: number;
  paragraphCount: number;
  mechanicalTransitions: number;
  qualityGatePass: boolean;
  qualityFailures: string[];
  internalScore: number;
  readabilityScore: number;
  understandingScore: number;
  originalityOverlap: number;
  avgWordsPerParagraph: number;
}

export interface RegressionVerdict {
  pass: boolean;
  benchmark: EditorialMetrics;
  candidate: EditorialMetrics;
  regressions: string[];
}

function paragraphs(content: string): string[] {
  return content
    .split(/\n{2,}/)
    .map((p) => p.replace(/^##\s+.+$/m, "").trim())
    .filter((p) => p.length > 40);
}

/** Extract editorial metrics from rendered markdown. */
export function measureEditorialQuality(
  content: string,
  slug: string,
  sourceTexts: string[] = []
): EditorialMetrics {
  const paras = paragraphs(content);
  const audit = auditParagraphQuality(content);
  const scored = scoreInternalContent({
    content,
    sourceTexts,
    topicTitle: slug,
    isSeed: true,
    ignoreRegression: true,
  });
  const mechanical = content.match(MECHANICAL_TRANSITION_RE)?.length ?? 0;
  const words = countWords(content);

  return {
    slug,
    wordCount: words,
    paragraphCount: paras.length,
    mechanicalTransitions: mechanical,
    qualityGatePass: audit.pass,
    qualityFailures: audit.failures,
    internalScore: scored.overallScore,
    readabilityScore: scored.categories.readability.score,
    understandingScore: scored.categories.understanding.score,
    originalityOverlap: scored.categories.originality.score
      ? 100 - scored.categories.originality.score
      : 0,
    avgWordsPerParagraph: paras.length > 0 ? Math.round(words / paras.length) : 0,
  };
}

/** Compare candidate against benchmark; reject composition regressions. */
export function compareEditorialRegression(
  benchmark: EditorialMetrics,
  candidate: EditorialMetrics
): RegressionVerdict {
  const regressions: string[] = [];

  if (!candidate.qualityGatePass && benchmark.qualityGatePass) {
    regressions.push("quality gate failed (benchmark passed)");
  }
  if (candidate.internalScore < benchmark.internalScore - 5) {
    regressions.push(
      `internal score dropped ${benchmark.internalScore} → ${candidate.internalScore}`
    );
  }
  if (candidate.readabilityScore < benchmark.readabilityScore - 8) {
    regressions.push(
      `readability dropped ${benchmark.readabilityScore} → ${candidate.readabilityScore}`
    );
  }
  if (candidate.understandingScore < benchmark.understandingScore - 5) {
    regressions.push(
      `understanding dropped ${benchmark.understandingScore} → ${candidate.understandingScore}`
    );
  }
  if (candidate.mechanicalTransitions > benchmark.mechanicalTransitions + 3) {
    regressions.push(
      `mechanical transitions increased ${benchmark.mechanicalTransitions} → ${candidate.mechanicalTransitions}`
    );
  }
  if (candidate.paragraphCount < benchmark.paragraphCount - 4) {
    regressions.push(
      `paragraph count dropped ${benchmark.paragraphCount} → ${candidate.paragraphCount}`
    );
  }

  return {
    pass: regressions.length === 0,
    benchmark,
    candidate,
    regressions,
  };
}

export function benchmarkSlug(): string {
  return EDITORIAL_BENCHMARK_SLUG;
}
