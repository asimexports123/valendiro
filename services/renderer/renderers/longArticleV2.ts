/**
 * Long Article Renderer v2 — Knowledge Composition Engine
 *
 * Phase 14: Reader-First Educational Composition
 *
 * This renderer transforms the current fact-listing approach into a true
 * educational composition engine. Every article is composed to teach, not just inform.
 *
 * Key improvements:
 * - Reader-first philosophy: "What does a beginner need to understand this?"
 * - Natural knowledge flow: Introduction → Concept → How → Example → Application → Implications
 * - Every fact explained: What? Why? How? When? Where? Why does it matter?
 * - Practical examples for visualization
 * - Natural transitions between sections
 * - Dynamic length based on complexity
 * - Quality validation before publishing
 */

import type {
  DocumentNode,
  PluginFact,
  RendererConfig,
  RenderDecision,
  CitationInput,
  RelationshipInput,
  RenderStrategy,
} from "../types";
import { KnowledgeComposer, type CompositionContext } from "../composition/knowledgeComposer";
import { ImprovedQualityScorer } from "../composition/improvedQualityScorer";

export const LONG_ARTICLE_V2_VERSION = "5.1.0";

export const longArticleV2Strategy: RenderStrategy = {
  name: "long-article-v2",
  version: LONG_ARTICLE_V2_VERSION,
  render: renderLongArticleV2,
};

/**
 * Main render function for v2 renderer
 */
export function renderLongArticleV2(
  rawFacts: PluginFact[],
  citations: CitationInput[],
  relationships: RelationshipInput[],
  config: RendererConfig,
  decision: RenderDecision
): DocumentNode[] {
  // Initialize the composition engine
  const composer = new KnowledgeComposer();
  const scorer = new ImprovedQualityScorer();

  // Build composition context
  const context: CompositionContext = {
    facts: rawFacts,
    config,
    subject: extractSubject(config.slug),
    intent: config.intent,
    complexity: assessComplexity(rawFacts, config.style),
    category: config.category || "general",
  };

  // Compose the article using the new engine
  const compositionResult = composer.compose(rawFacts, config);

  // Score the composition with improved metrics
  const detailedScore = scorer.score(
    compositionResult.documentTree,
    rawFacts,
    context
  );

  // Log quality metrics for debugging
  console.log(`[Composition Engine] Quality Score: ${detailedScore.overall}/100`);
  console.log(`[Composition Engine] Educational Value: ${detailedScore.educationalValue}/100`);
  console.log(`[Composition Engine] Clarity: ${detailedScore.clarity}/100`);
  console.log(`[Composition Engine] Logical Flow: ${detailedScore.logicalFlow}/100`);
  console.log(`[Composition Engine] Issues: ${compositionResult.qualityReport.issues.length}`);

  if (compositionResult.qualityReport.issues.length > 0) {
    console.log("[Composition Engine] Quality Issues:");
    for (const issue of compositionResult.qualityReport.issues) {
      console.log(`  [${issue.severity.toUpperCase()}] ${issue.message} (${issue.location})`);
    }
  }

  return compositionResult.documentTree;
}

/**
 * Extract subject from slug
 */
function extractSubject(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Assess complexity based on facts and style
 */
function assessComplexity(
  facts: PluginFact[],
  style: string[]
): "beginner" | "intermediate" | "advanced" {
  if (style.includes("expert")) return "advanced";
  if (style.includes("beginner")) return "beginner";

  // Assess based on fact content
  const technicalTerms = facts.filter(f => 
    f.statement.match(/(?:algorithm|paradigm|architecture|implementation|methodology)/i)
  ).length;

  if (technicalTerms > facts.length * 0.3) return "advanced";
  if (technicalTerms > facts.length * 0.15) return "intermediate";

  return "beginner";
}
