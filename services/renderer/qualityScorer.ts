/**
 * Render Quality Scorer
 *
 * Scores the rendered Document Tree based on coverage, completeness, and readability.
 * Pure function. No side effects.
 */

import type { DocumentNode, RenderQualityScore, RenderDecision, PluginFact, CitationInput, ReadingFlowMetrics } from "./types";
import { validateReadingFlow } from "./readingFlowValidator";

export function scoreQuality(
  tree: DocumentNode[],
  facts: PluginFact[],
  citations: CitationInput[],
  decision: RenderDecision
): RenderQualityScore {
  // Count words in text content
  const wordCount = countWords(tree);

  // Count sections (h2 headings)
  const sectionCount = tree.filter(
    (n) => n.type === "heading" && (n as any).level === 2
  ).length;

  // Citation coverage
  const citationBlock = tree.find((n) => n.type === "citation-block");
  const citationCount = citationBlock && citationBlock.type === "citation-block"
    ? citationBlock.entries.length
    : 0;

  // Internal links
  const internalLinkCount = countNodeType(tree, "internal-link");

  // Fact coverage: how many facts are represented in the output?
  // Estimate based on word count vs fact count
  const factCoverage = Math.min(100, Math.round((wordCount / Math.max(1, facts.length * 12)) * 100));

  // Citation coverage: % of citations referenced
  const citationCoverage = citations.length > 0
    ? Math.round((citationCount / citations.length) * 100)
    : 0;

  // Section completeness: required sections present
  const requiredBlocks = decision.blockOrder.filter((b) => b.required);
  const presentSections = new Set(
    tree
      .filter((n) => n.type === "heading" && (n as any).level === 2)
      .map((n) => (n as any).anchor)
  );
  const sectionCompleteness = requiredBlocks.length > 0
    ? Math.round(
        (requiredBlocks.filter((b) => {
          // Check if any section heading matches
          return tree.some(
            (n) => n.type === "heading" && (n as any).level === 2
          );
        }).length / requiredBlocks.length) * 100
      )
    : 100;

  // Readability estimate based on average sentence length
  const readabilityEstimate = estimateReadability(wordCount, sectionCount);

  // Missing knowledge
  const missingKnowledgeCount = decision.missingKnowledge.length;
  const missingKnowledgeSeverity: Record<string, number> = {
    critical: decision.missingKnowledge.filter((m) => m.severity === "critical").length,
    recommended: decision.missingKnowledge.filter((m) => m.severity === "recommended").length,
    optional: decision.missingKnowledge.filter((m) => m.severity === "optional").length,
  };

  // Reading flow validation
  const readingFlow = validateReadingFlow(tree);

  // Overall score (includes reading flow)
  const overall = computeOverall({
    factCoverage,
    citationCoverage,
    sectionCompleteness,
    readabilityEstimate,
    missingKnowledgeCount,
    wordCount,
    readingFlowScore: readingFlow.overallFlowScore,
  });

  return {
    overall,
    factCoverage,
    citationCoverage,
    sectionCompleteness,
    readabilityEstimate,
    missingKnowledgeCount,
    missingKnowledgeSeverity,
    wordCount,
    sectionCount,
    internalLinkCount,
    citationCount,
    readingFlow,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function countWords(tree: DocumentNode[]): number {
  let count = 0;
  for (const node of tree) {
    count += countNodeWords(node);
  }
  return count;
}

function countNodeWords(node: DocumentNode): number {
  switch (node.type) {
    case "paragraph":
      return node.children.reduce((sum, child) => {
        if (typeof child === "string") return sum + child.split(/\s+/).length;
        if ("text" in child) return sum + (child as any).text.split(/\s+/).length;
        return sum;
      }, 0);
    case "heading":
      return node.text.split(/\s+/).length;
    case "list":
      return node.items.reduce((sum, item) => sum + countNodeWords(item), 0);
    case "list-item":
      return node.children.reduce((sum, child) => {
        if (typeof child === "string") return sum + child.split(/\s+/).length;
        if ("text" in child) return sum + (child as any).text.split(/\s+/).length;
        return sum;
      }, 0);
    case "blockquote":
      return node.children.reduce((sum, child) => sum + countNodeWords(child), 0);
    case "code-block":
      return node.code.split(/\s+/).length;
    default:
      return 0;
  }
}

function countNodeType(tree: DocumentNode[], type: string): number {
  let count = 0;
  for (const node of tree) {
    if (typeof node === "string") continue;
    if (typeof node !== "object" || node === null) continue;
    if (node.type === type) count++;
    if ("children" in node && Array.isArray((node as any).children)) {
      const children = (node as any).children.filter((c: any) => typeof c === "object" && c !== null);
      count += countNodeType(children, type);
    }
    if ("items" in node && Array.isArray((node as any).items)) {
      count += countNodeType((node as any).items, type);
    }
  }
  return count;
}

function estimateReadability(wordCount: number, sectionCount: number): number {
  // Simple heuristic: good readability = moderate word density per section
  if (wordCount === 0) return 0;
  const wordsPerSection = sectionCount > 0 ? wordCount / sectionCount : wordCount;
  // Ideal: 80-200 words per section
  if (wordsPerSection >= 80 && wordsPerSection <= 200) return 90;
  if (wordsPerSection >= 40 && wordsPerSection <= 300) return 75;
  if (wordsPerSection >= 20) return 60;
  return 40;
}

function computeOverall(metrics: {
  factCoverage: number;
  citationCoverage: number;
  sectionCompleteness: number;
  readabilityEstimate: number;
  missingKnowledgeCount: number;
  wordCount: number;
  readingFlowScore: number;
}): number {
  // Weighted average — reading flow now has 15% weight
  let score =
    metrics.factCoverage * 0.20 +
    metrics.citationCoverage * 0.15 +
    metrics.sectionCompleteness * 0.15 +
    metrics.readabilityEstimate * 0.15 +
    metrics.readingFlowScore * 0.15 +
    Math.min(100, metrics.wordCount / 5) * 0.10 + // word count (capped)
    (metrics.wordCount >= 100 ? 10 : 0); // bonus for substantial content

  // Penalties
  score -= metrics.missingKnowledgeCount * 5;

  return Math.max(0, Math.min(100, Math.round(score)));
}
