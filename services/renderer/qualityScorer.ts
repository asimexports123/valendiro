/**
 * Educational Quality Scorer
 *
 * Scores the rendered Document Tree based on educational depth, learning progression,
 * and reader value - NOT verbosity.
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
  const textContent = extractTextContent(tree);
  const wordCount = countWords(tree);
  const sectionCount = tree.filter(
    (n) => n.type === "heading" && (n as any).level === 2
  ).length;

  const citationBlock = tree.find((n) => n.type === "citation-block");
  const citationCount = citationBlock && citationBlock.type === "citation-block"
    ? citationBlock.entries.length
    : 0;

  const internalLinkCount = countNodeType(tree, "internal-link");

  const missingKnowledgeCount = decision.missingKnowledge.length;
  const missingKnowledgeSeverity: Record<string, number> = {
    critical: decision.missingKnowledge.filter((m) => m.severity === "critical").length,
    recommended: decision.missingKnowledge.filter((m) => m.severity === "recommended").length,
    optional: decision.missingKnowledge.filter((m) => m.severity === "optional").length,
  };

  const readingFlow = validateReadingFlow(tree);

  // NEW: Educational Depth Score (30%)
  const educationalDepth = computeEducationalDepth(textContent, tree);

  // NEW: Learning Progression Score (20%)
  const learningProgression = computeLearningProgression(textContent, tree);

  // NEW: Knowledge Graph Score (15%)
  const knowledgeGraph = computeKnowledgeGraph(tree, internalLinkCount, wordCount);

  // NEW: Reader Journey Score (15%)
  const readerJourney = computeReaderJourney(textContent, tree, readingFlow);

  // NEW: Content Density Score (10%)
  const contentDensity = computeContentDensity(wordCount, facts.length, textContent);

  // NEW: Retention Factors Score (10%)
  const retentionFactors = computeRetentionFactors(textContent);

  // Citation coverage (5%)
  const citationCoverage = citations.length > 0
    ? Math.round((citationCount / citations.length) * 100)
    : 0;

  const overall = computeOverall({
    educationalDepth,
    learningProgression,
    knowledgeGraph,
    readerJourney,
    contentDensity,
    retentionFactors,
    citationCoverage,
    missingKnowledgeCount,
  });

  return {
    overall,
    educationalDepth,
    learningProgression,
    knowledgeGraph,
    readerJourney,
    contentDensity,
    retentionFactors,
    citationCoverage,
    missingKnowledgeCount,
    missingKnowledgeSeverity,
    wordCount,
    sectionCount,
    internalLinkCount,
    citationCount,
    readingFlow,
  };
}

// ─── NEW Educational Quality Detectors ───────────────────────────────────────

function extractTextContent(tree: DocumentNode[]): string {
  let text = "";
  for (const node of tree) {
    text += extractNodeText(node);
  }
  return text.toLowerCase();
}

function extractNodeText(node: DocumentNode): string {
  switch (node.type) {
    case "paragraph":
      return node.children.map((c) => typeof c === "string" ? c : (c as any).text || "").join(" ");
    case "heading":
      return node.text || "";
    case "list":
      return node.items.map(extractNodeText).join(" ");
    case "list-item":
      return node.children.map((c) => typeof c === "string" ? c : (c as any).text || "").join(" ");
    case "blockquote":
      return node.children.map(extractNodeText).join(" ");
    case "code-block":
      return node.code || "";
    default:
      return "";
  }
}

function countPatternMatches(text: string, patterns: string[]): number {
  let count = 0;
  for (const pattern of patterns) {
    if (text.includes(pattern)) count++;
  }
  return count;
}

function computeEducationalDepth(text: string, tree: DocumentNode[]): number {
  // Mental Models (8%): "think of X as Y", "model X as", "imagine X as", "X acts like"
  const mentalModelPatterns = ["think of", "model as", "mental model", "imagine", "framework"];
  const mentalModelScore = Math.min(100, 70 + countPatternMatches(text, mentalModelPatterns) * 15);

  // Analogies (7%): "like a", "similar to", "compared to", "analogous", "just as"
  const analogyPatterns = ["like a", "similar to", "compared to", "analogous", "just as"];
  const analogyScore = Math.min(100, 70 + countPatternMatches(text, analogyPatterns) * 15);

  // Practical Examples (7%): "for example", "in practice", "specifically", "use cases"
  const examplePatterns = ["for example", "in practice", "specifically", "use case", "applied"];
  const exampleScore = Math.min(100, 70 + countPatternMatches(text, examplePatterns) * 12);

  // Concept Clarity (8%): Sentence complexity, jargon ratio, definition presence
  const sentences = text.split(/[.!?]/).filter(s => s.trim().length > 0);
  const avgSentenceLength = sentences.length > 0 ? text.split(/\s+/).length / sentences.length : 0;
  const clarityScore = avgSentenceLength < 30 ? 90 : avgSentenceLength < 40 ? 85 : 75;

  return Math.round(
    mentalModelScore * 0.08 +
    analogyScore * 0.07 +
    exampleScore * 0.07 +
    clarityScore * 0.08
  ) / 0.30;
}

function computeLearningProgression(text: string, tree: DocumentNode[]): number {
  // Scaffolding (7%): "now that", "building on", "with these fundamentals", "understanding X"
  const scaffoldingPatterns = ["now that", "building on", "with these fundamentals", "understanding", "once you know"];
  const scaffoldingScore = Math.min(100, 70 + countPatternMatches(text, scaffoldingPatterns) * 15);

  // Decision Frameworks (7%): "when to", "how to choose", "consider", "evaluate"
  const decisionPatterns = ["when to", "how to choose", "consider", "evaluate", "decide between"];
  const decisionScore = Math.min(100, 70 + countPatternMatches(text, decisionPatterns) * 15);

  // Common Misconceptions (6%): "common mistake", "not to be confused", "avoid", "misconception"
  const misconceptionPatterns = ["common mistake", "not to be confused", "avoid", "misconception", "many people think"];
  const misconceptionScore = Math.min(100, 70 + countPatternMatches(text, misconceptionPatterns) * 15);

  return Math.round(
    scaffoldingScore * 0.07 +
    decisionScore * 0.07 +
    misconceptionScore * 0.06
  ) / 0.20;
}

function computeKnowledgeGraph(tree: DocumentNode[], internalLinkCount: number, wordCount: number): number {
  // Internal Link Count (8%): Reward linking to related topics
  const linkScore = Math.min(100, 70 + internalLinkCount * 8);

  // Cross-Reference Quality (7%): Estimate based on link density
  const linkDensity = wordCount > 0 ? (internalLinkCount / wordCount) * 1000 : 0;
  const crossReferenceScore = Math.min(100, 70 + linkDensity * 12);

  return Math.round(
    linkScore * 0.08 +
    crossReferenceScore * 0.07
  ) / 0.15;
}

function computeReaderJourney(text: string, tree: DocumentNode[], readingFlow: ReadingFlowMetrics): number {
  // Hook Quality (5%): Opening paragraph engagement
  const firstParagraph = text.split("\n\n")[0] || "";
  const hookPatterns = ["?", "!", "imagine", "consider", "did you know", "what if"];
  const hookScore = countPatternMatches(firstParagraph, hookPatterns) > 0 ? 90 : 75;

  // Conclusion Effectiveness (5%): Closing reinforcement
  const lastParagraph = text.split("\n\n").slice(-1)[0] || "";
  const conclusionPatterns = ["summary", "conclusion", "in summary", "to summarize", "key takeaway"];
  const conclusionScore = countPatternMatches(lastParagraph, conclusionPatterns) > 0 ? 90 : 75;

  // Transition Quality (5%): From reading flow validator
  const transitionScore = Math.min(100, (readingFlow.transitionQuality || 75) + 10);

  return Math.round(
    hookScore * 0.05 +
    conclusionScore * 0.05 +
    transitionScore * 0.05
  ) / 0.15;
}

function computeContentDensity(wordCount: number, factCount: number, text: string): number {
  // Information Density (5%): Facts per word - reward concise, information-rich content
  const density = factCount > 0 ? (factCount / wordCount) * 1000 : 0;
  const densityScore = Math.min(100, 70 + density * 8);

  // Redundancy Penalty (5%): Detect repeated phrases
  const words = text.split(/\s+/);
  const uniqueWords = new Set(words);
  const redundancyRatio = words.length > 0 ? uniqueWords.size / words.length : 1;
  const redundancyScore = Math.round(70 + redundancyRatio * 25);

  return Math.round(
    densityScore * 0.05 +
    redundancyScore * 0.05
  ) / 0.10;
}

function computeRetentionFactors(text: string): number {
  // Memorability (5%): Detect mnemonic devices, patterns
  const mnemonicPatterns = ["acronym", "mnemonic", "remember as", "think of it as", "stand for"];
  const memorabilityScore = Math.min(100, 70 + countPatternMatches(text, mnemonicPatterns) * 15);

  // Application Scenarios (5%): "you can use", "apply this", "in situations where"
  const applicationPatterns = ["you can use", "apply this", "in situations where", "use this to", "practical"];
  const applicationScore = Math.min(100, 70 + countPatternMatches(text, applicationPatterns) * 12);

  return Math.round(
    memorabilityScore * 0.05 +
    applicationScore * 0.05
  ) / 0.10;
}

// ─── Existing Helpers (Preserved) ─────────────────────────────────────────────

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

function computeOverall(metrics: {
  educationalDepth: number;
  learningProgression: number;
  knowledgeGraph: number;
  readerJourney: number;
  contentDensity: number;
  retentionFactors: number;
  citationCoverage: number;
  missingKnowledgeCount: number;
}): number {
  // Educational Quality Model - Learning-First Weights
  let score =
    metrics.educationalDepth * 0.30 +      // 30%: Mental models, analogies, examples, clarity
    metrics.learningProgression * 0.20 +   // 20%: Scaffolding, decisions, misconceptions
    metrics.knowledgeGraph * 0.15 +        // 15%: Internal links, cross-references
    metrics.readerJourney * 0.15 +         // 15%: Hook, conclusion, transitions
    metrics.contentDensity * 0.10 +        // 10%: Information density, low redundancy
    metrics.retentionFactors * 0.10 +      // 10%: Memorability, application scenarios
    metrics.citationCoverage * 0.05;       // 5%: Source coverage

  // Penalties
  score -= metrics.missingKnowledgeCount * 5;

  return Math.max(0, Math.min(100, Math.round(score)));
}
