// ─── Intent-Aware Knowledge Quality Engine ─────────────────────────────────────
// Phase 20.3: Dynamic Scoring Based on Intent Profiles

import { DocumentNode } from "./types";
import { PluginFact, CitationInput, RenderDecision, ReadingFlowMetrics } from "./types";
import { classifyIntent, KnowledgeIntent, KnowledgeCategory } from "./intentClassifier";
import { getIntentProfile, QualityMetric } from "./intentProfiles";
import { validateReadingFlow } from "./readingFlowValidator";

/**
 * Intent-Aware Quality Score
 */
export interface IntentAwareQualityScore {
  overall: number;
  intent: KnowledgeIntent;
  category: KnowledgeCategory;
  metrics: Record<QualityMetric, number>;
  universalMetrics: {
    accuracy: number;
    trustworthiness: number;
    readability: number;
    knowledgeGraph: number;
    structure: number;
    noRepetition: number;
    navigation: number;
  };
  readingFlow: ReadingFlowMetrics;
  wordCount: number;
  sectionCount: number;
  citationCount: number;
  missingKnowledgeCount: number;
  missingKnowledgeSeverity: Record<string, number>;
  internalLinkCount: number;
}

/**
 * Score quality based on intent-aware profiles
 */
export function scoreIntentAwareQuality(
  tree: DocumentNode[],
  facts: PluginFact[],
  citations: CitationInput[],
  decision: RenderDecision,
  slug: string,
  subcategorySlug: string | null | undefined
): IntentAwareQualityScore {
  // Step 1: Classify intent
  const classification = classifyIntent(slug, subcategorySlug);
  
  // Step 2: Get intent profile
  const profile = getIntentProfile(classification.primaryIntent, classification.category);
  
  // Step 3: Extract text content
  const text = extractTextContent(tree);
  const wordCount = countWords(tree);
  const sectionCount = countSections(tree);
  const citationCount = citations.length;
  
  // Step 4: Calculate universal metrics
  const universalMetrics = calculateUniversalMetrics(tree, facts, citations, text, wordCount);
  
  // Step 5: Calculate category-specific metrics
  const categoryMetrics = calculateCategoryMetrics(tree, text, wordCount, classification.category);
  
  // Step 6: Get reading flow
  const readingFlow = validateReadingFlow(tree);
  
  // Step 7: Combine all metrics
  const allMetrics: Record<QualityMetric, number> = {
    ...categoryMetrics as Record<QualityMetric, number>,
    ...universalMetrics,
  };
  
  // Step 8: Calculate overall score using profile weights
  const overall = calculateOverallScore(allMetrics, profile.metrics);
  
  return {
    overall,
    intent: classification.primaryIntent,
    category: classification.category,
    metrics: allMetrics,
    universalMetrics,
    readingFlow,
    wordCount,
    sectionCount,
    citationCount,
    missingKnowledgeCount: 0,
    missingKnowledgeSeverity: {},
    internalLinkCount: 0,
  };
}

/**
 * Calculate universal metrics (apply to all categories)
 */
function calculateUniversalMetrics(
  tree: DocumentNode[],
  facts: PluginFact[],
  citations: CitationInput[],
  text: string,
  wordCount: number
): IntentAwareQualityScore["universalMetrics"] {
  return {
    accuracy: calculateAccuracy(facts, citations),
    trustworthiness: calculateTrustworthiness(citations),
    readability: calculateReadability(text, wordCount),
    knowledgeGraph: calculateKnowledgeGraph(tree),
    structure: calculateStructure(tree),
    noRepetition: calculateNoRepetition(text),
    navigation: calculateNavigation(tree),
  };
}

/**
 * Calculate category-specific metrics
 */
function calculateCategoryMetrics(
  tree: DocumentNode[],
  text: string,
  wordCount: number,
  category: KnowledgeCategory
): Partial<Record<QualityMetric, number>> {
  const baseMetrics: Partial<Record<QualityMetric, number>> = {};
  
  switch (category) {
    case "technology":
      baseMetrics.conceptClarity = calculateConceptClarity(text);
      baseMetrics.accuracy = calculateTechnicalAccuracy(text);
      baseMetrics.examples = calculateExamples(text);
      baseMetrics.implementation = calculateImplementation(text);
      baseMetrics.bestPractices = calculateBestPractices(text);
      baseMetrics.comparisons = calculateComparisons(text);
      baseMetrics.stepByStep = calculateStepByStep(text);
      break;
      
    case "business":
      baseMetrics.decisionSupport = calculateDecisionSupport(text);
      baseMetrics.frameworks = calculateFrameworks(text);
      baseMetrics.caseStudies = calculateCaseStudies(text);
      baseMetrics.comparisons = calculateComparisons(text);
      baseMetrics.strategy = calculateStrategy(text);
      baseMetrics.conceptClarity = calculateConceptClarity(text);
      baseMetrics.actionability = calculateActionability(text);
      break;
      
    case "finance":
      baseMetrics.decisionSupport = calculateDecisionSupport(text);
      baseMetrics.riskAwareness = calculateRiskAwareness(text);
      baseMetrics.tradeoffs = calculateTradeoffs(text);
      baseMetrics.longTermPlanning = calculateLongTermPlanning(text);
      baseMetrics.actionability = calculateActionability(text);
      baseMetrics.budgetGuidance = calculateBudgetGuidance(text);
      break;
      
    case "travel":
      baseMetrics.inspiration = calculateInspiration(text);
      baseMetrics.planning = calculatePlanning(text);
      baseMetrics.localKnowledge = calculateLocalKnowledge(text);
      baseMetrics.practicalTips = calculatePracticalTips(text);
      baseMetrics.budgetGuidance = calculateBudgetGuidance(text);
      baseMetrics.safety = calculateSafety(text);
      baseMetrics.memorableExperiences = calculateMemorableExperiences(text);
      break;
      
    case "home":
      baseMetrics.practicalUsefulness = calculatePracticalUsefulness(text);
      baseMetrics.stepByStep = calculateStepByStep(text);
      baseMetrics.maintenance = calculateMaintenance(text);
      baseMetrics.diy = calculateDIY(text);
      baseMetrics.safety = calculateSafety(text);
      break;
      
    case "health":
      baseMetrics.accuracy = calculateHealthAccuracy(text);
      baseMetrics.conceptClarity = calculateConceptClarity(text);
      baseMetrics.safety = calculateHealthSafety(text);
      baseMetrics.prevention = calculatePrevention(text);
      baseMetrics.evidence = calculateEvidence(text);
      baseMetrics.medicalDisclaimers = calculateMedicalDisclaimers(text);
      break;
      
    case "education":
      baseMetrics.teachingQuality = calculateTeachingQuality(text);
      baseMetrics.learningProgression = calculateLearningProgression(text);
      baseMetrics.conceptClarity = calculateConceptClarity(text);
      baseMetrics.examples = calculateExamples(text);
      break;
  }
  
  return baseMetrics;
}

/**
 * Calculate overall score using profile weights
 */
function calculateOverallScore(
  metrics: Record<QualityMetric, number>,
  weights: Record<QualityMetric, number>
): number {
  let score = 0;
  let totalWeight = 0;
  
  for (const [metric, weight] of Object.entries(weights)) {
    if (weight > 0 && metrics[metric as QualityMetric] !== undefined) {
      score += metrics[metric as QualityMetric] * weight;
      totalWeight += weight;
    }
  }
  
  return Math.round(totalWeight > 0 ? score / totalWeight : 0);
}

// ─── Universal Metric Calculations ─────────────────────────────────────────────

function calculateAccuracy(facts: PluginFact[], citations: CitationInput[]): number {
  // Base accuracy from citations
  const citationScore = citations.length > 0 ? 80 : 60;
  const factScore = facts.length > 0 ? 80 : 60;
  return Math.round((citationScore + factScore) / 2);
}

function calculateTrustworthiness(citations: CitationInput[]): number {
  if (citations.length === 0) return 60;
  const authoritativeSources = citations.filter(c => {
    const authority = typeof c.sourceAuthority === 'string' 
      ? parseFloat(c.sourceAuthority) 
      : c.sourceAuthority;
    return authority && authority > 0.7;
  }).length;
  const ratio = authoritativeSources / citations.length;
  return Math.round(60 + ratio * 40);
}

function calculateReadability(text: string, wordCount: number): number {
  const sentences = text.split(/[.!?]/).filter(s => s.trim().length > 0);
  if (sentences.length === 0) return 70;
  
  const avgSentenceLength = wordCount / sentences.length;
  if (avgSentenceLength < 20) return 90;
  if (avgSentenceLength < 30) return 85;
  if (avgSentenceLength < 40) return 75;
  return 65;
}

function calculateKnowledgeGraph(tree: DocumentNode[]): number {
  let linkCount = 0;
  for (const node of tree) {
    if (node && typeof node === "object" && node.type === "internal-link") {
      linkCount++;
    }
  }
  return Math.min(100, 60 + linkCount * 5);
}

function calculateStructure(tree: DocumentNode[]): number {
  const headings = tree.filter(n => n.type === "heading");
  const sections = headings.length;
  if (sections < 3) return 60;
  if (sections < 5) return 75;
  if (sections < 8) return 85;
  return 90;
}

function calculateNoRepetition(text: string): number {
  const words = text.split(/\s+/);
  const uniqueWords = new Set(words);
  const ratio = words.length > 0 ? uniqueWords.size / words.length : 1;
  return Math.round(60 + ratio * 30);
}

function calculateNavigation(tree: DocumentNode[]): number {
  // Check for table of contents, navigation links
  const hasTOC = tree.some(n => 
    n && typeof n === "object" && 
    (n.type === "list" || n.type === "heading")
  );
  return hasTOC ? 80 : 70;
}

// ─── Category-Specific Metric Calculations ─────────────────────────────────────

function calculateConceptClarity(text: string): number {
  const clarityPatterns = ["simply put", "in other words", "think of", "imagine"];
  const matches = clarityPatterns.filter(p => text.includes(p)).length;
  return Math.min(100, 70 + matches * 10);
}

function calculateExamples(text: string): number {
  const examplePatterns = ["for example", "in practice", "specifically", "consider"];
  const matches = examplePatterns.filter(p => text.includes(p)).length;
  return Math.min(100, 70 + matches * 10);
}

function calculateImplementation(text: string): number {
  const implPatterns = ["implement", "deploy", "setup", "configure", "install"];
  const matches = implPatterns.filter(p => text.includes(p)).length;
  return Math.min(100, 60 + matches * 10);
}

function calculateBestPractices(text: string): number {
  const bpPatterns = ["best practice", "recommended", "should", "avoid"];
  const matches = bpPatterns.filter(p => text.includes(p)).length;
  return Math.min(100, 60 + matches * 10);
}

function calculateDecisionSupport(text: string): number {
  const decisionPatterns = ["choose", "select", "decide", "consider", "evaluate"];
  const matches = decisionPatterns.filter(p => text.includes(p)).length;
  return Math.min(100, 70 + matches * 8);
}

function calculateFrameworks(text: string): number {
  const frameworkPatterns = ["framework", "model", "approach", "methodology"];
  const matches = frameworkPatterns.filter(p => text.includes(p)).length;
  return Math.min(100, 60 + matches * 15);
}

function calculateCaseStudies(text: string): number {
  const casePatterns = ["case study", "example", "real-world", "company"];
  const matches = casePatterns.filter(p => text.includes(p)).length;
  return Math.min(100, 60 + matches * 15);
}

function calculateComparisons(text: string): number {
  const comparePatterns = ["compare", "versus", "vs", "better", "alternative"];
  const matches = comparePatterns.filter(p => text.includes(p)).length;
  return Math.min(100, 70 + matches * 10);
}

function calculateStrategy(text: string): number {
  const strategyPatterns = ["strategy", "plan", "approach", "tactic"];
  const matches = strategyPatterns.filter(p => text.includes(p)).length;
  return Math.min(100, 60 + matches * 15);
}

function calculateActionability(text: string): number {
  const actionPatterns = ["can", "should", "do", "take", "action", "step"];
  const matches = actionPatterns.filter(p => text.includes(p)).length;
  return Math.min(100, 70 + matches * 5);
}

function calculateRiskAwareness(text: string): number {
  const riskPatterns = ["risk", "caution", "warning", "careful", "consider"];
  const matches = riskPatterns.filter(p => text.includes(p)).length;
  return Math.min(100, 70 + matches * 10);
}

function calculateTradeoffs(text: string): number {
  const tradeoffPatterns = ["trade-off", "however", "but", "conversely", "alternative"];
  const matches = tradeoffPatterns.filter(p => text.includes(p)).length;
  return Math.min(100, 70 + matches * 8);
}

function calculateLongTermPlanning(text: string): number {
  const longTermPatterns = ["long-term", "future", "year", "plan", "goal"];
  const matches = longTermPatterns.filter(p => text.includes(p)).length;
  return Math.min(100, 70 + matches * 10);
}

function calculateInspiration(text: string): number {
  const inspirePatterns = ["discover", "explore", "amazing", "beautiful", "stunning"];
  const matches = inspirePatterns.filter(p => text.includes(p)).length;
  return Math.min(100, 70 + matches * 10);
}

function calculatePlanning(text: string): number {
  const planPatterns = ["plan", "itinerary", "schedule", "visit", "go"];
  const matches = planPatterns.filter(p => text.includes(p)).length;
  return Math.min(100, 70 + matches * 8);
}

function calculateLocalKnowledge(text: string): number {
  const localPatterns = ["local", "area", "neighborhood", "district", "region"];
  const matches = localPatterns.filter(p => text.includes(p)).length;
  return Math.min(100, 60 + matches * 15);
}

function calculatePracticalTips(text: string): number {
  const tipPatterns = ["tip", "advice", "recommendation", "suggest", "try"];
  const matches = tipPatterns.filter(p => text.includes(p)).length;
  return Math.min(100, 70 + matches * 8);
}

function calculateBudgetGuidance(text: string): number {
  const budgetPatterns = ["budget", "cost", "price", "cheap", "expensive", "affordable"];
  const matches = budgetPatterns.filter(p => text.includes(p)).length;
  return Math.min(100, 70 + matches * 10);
}

function calculateSafety(text: string): number {
  const safetyPatterns = ["safe", "safety", "danger", "warning", "caution"];
  const matches = safetyPatterns.filter(p => text.includes(p)).length;
  return Math.min(100, 70 + matches * 10);
}

function calculateMemorableExperiences(text: string): number {
  const memorablePatterns = ["experience", "memorable", "unforgettable", "remember"];
  const matches = memorablePatterns.filter(p => text.includes(p)).length;
  return Math.min(100, 60 + matches * 15);
}

function calculatePracticalUsefulness(text: string): number {
  const usefulPatterns = ["useful", "practical", "helpful", "effective", "work"];
  const matches = usefulPatterns.filter(p => text.includes(p)).length;
  return Math.min(100, 70 + matches * 8);
}

function calculateStepByStep(text: string): number {
  const stepPatterns = ["step", "first", "then", "next", "finally", "follow"];
  const matches = stepPatterns.filter(p => text.includes(p)).length;
  return Math.min(100, 70 + matches * 8);
}

function calculateMaintenance(text: string): number {
  const maintainPatterns = ["maintain", "maintenance", "care", "clean", "service"];
  const matches = maintainPatterns.filter(p => text.includes(p)).length;
  return Math.min(100, 60 + matches * 15);
}

function calculateDIY(text: string): number {
  const diyPatterns = ["diy", "yourself", "make", "build", "create"];
  const matches = diyPatterns.filter(p => text.includes(p)).length;
  return Math.min(100, 70 + matches * 10);
}

function calculateTechnicalAccuracy(text: string): number {
  // Simplified - in production would verify against technical sources
  return 75;
}

function calculateHealthAccuracy(text: string): number {
  // Simplified - in production would verify against medical sources
  return 75;
}

function calculateHealthSafety(text: string): number {
  const disclaimerPatterns = ["consult", "doctor", "medical", "professional"];
  const hasDisclaimer = disclaimerPatterns.some(p => text.includes(p));
  return hasDisclaimer ? 85 : 60;
}

function calculatePrevention(text: string): number {
  const preventPatterns = ["prevent", "avoid", "reduce", "minimize"];
  const matches = preventPatterns.filter(p => text.includes(p)).length;
  return Math.min(100, 70 + matches * 10);
}

function calculateEvidence(text: string): number {
  const evidencePatterns = ["research", "study", "evidence", "shown", "found"];
  const matches = evidencePatterns.filter(p => text.includes(p)).length;
  return Math.min(100, 70 + matches * 10);
}

function calculateMedicalDisclaimers(text: string): number {
  const disclaimerPatterns = ["consult your doctor", "medical advice", "not a substitute"];
  const hasDisclaimer = disclaimerPatterns.some(p => text.includes(p));
  return hasDisclaimer ? 90 : 50;
}

function calculateTeachingQuality(text: string): number {
  const teachingPatterns = ["learn", "understand", "grasp", "master", "teach"];
  const matches = teachingPatterns.filter(p => text.includes(p)).length;
  return Math.min(100, 70 + matches * 10);
}

function calculateLearningProgression(text: string): number {
  const progressionPatterns = ["now that", "building on", "next", "then", "first"];
  const matches = progressionPatterns.filter(p => text.includes(p)).length;
  return Math.min(100, 70 + matches * 10);
}

// ─── Helper Functions ─────────────────────────────────────────────────────────────

function extractTextContent(tree: DocumentNode[]): string {
  let text = "";
  for (const node of tree) {
    if (!node || typeof node !== "object") continue;
    
    switch (node.type) {
      case "heading":
        text += (node as any).text + " ";
        break;
      case "paragraph":
      case "list-item":
        const inlineNodes = (node as any).children || [];
        for (const inline of inlineNodes) {
          if (typeof inline === "string") {
            text += inline + " ";
          } else if (inline && typeof inline === "object" && inline.text) {
            text += inline.text + " ";
          }
        }
        break;
      case "list":
        const items = (node as any).items || [];
        text += extractTextContent(items);
        break;
      case "blockquote":
        const children = (node as any).children || [];
        text += extractTextContent(children);
        break;
      case "code-block":
        text += (node as any).code + " ";
        break;
      case "internal-link":
        text += (node as any).text + " ";
        break;
      case "table":
        const rows = (node as any).rows || [];
        for (const row of rows) {
          text += row.join(" ") + " ";
        }
        break;
    }
  }
  return text.toLowerCase();
}

function countWords(tree: DocumentNode[]): number {
  const text = extractTextContent(tree);
  return text.split(/\s+/).length;
}

function countSections(tree: DocumentNode[]): number {
  return tree.filter(n => n.type === "heading").length;
}
