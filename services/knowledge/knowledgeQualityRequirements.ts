/**
 * Knowledge Quality Requirements
 * 
 * Knowledge Packages must include:
 * - Definitions
 * - Core concepts
 * - Decision frameworks
 * - Best practices
 * - Common mistakes
 * - FAQs
 * - Practical examples
 * - Comparisons
 * - Checklists
 * - References
 * 
 * Do not inflate fact count. Increase knowledge quality instead.
 */

export interface KnowledgeQualityMetrics {
  totalFacts: number;
  definitions: number;
  coreConcepts: number;
  decisionFrameworks: number;
  bestPractices: number;
  commonMistakes: number;
  faqs: number;
  practicalExamples: number;
  comparisons: number;
  checklists: number;
  references: number;
  qualityScore: number;
  meetsRequirements: boolean;
  missingComponents: string[];
}

export interface FactTypeRequirement {
  type: string;
  minRequired: number;
  recommended: number;
  actual: number;
  met: boolean;
}

/**
 * Required fact types and their minimum counts
 */
const FACT_TYPE_REQUIREMENTS: Record<string, { min: number; recommended: number }> = {
  definition: { min: 1, recommended: 3 },
  core_concept: { min: 2, recommended: 5 },
  decision_framework: { min: 1, recommended: 2 },
  best_practice: { min: 2, recommended: 5 },
  common_mistake: { min: 1, recommended: 3 },
  faq: { min: 1, recommended: 3 },
  practical_example: { min: 1, recommended: 3 },
  comparison: { min: 1, recommended: 2 },
  checklist: { min: 0, recommended: 1 },
  reference: { min: 1, recommended: 3 },
};

/**
 * Fact type patterns for classification
 */
const FACT_TYPE_PATTERNS: Record<string, RegExp[]> = {
  definition: [
    /^is defined as/i,
    /^refers to/i,
    /^means/i,
    /^can be defined as/i,
  ],
  core_concept: [
    /^fundamental/i,
    /^key concept/i,
    /^core principle/i,
    /^essential/i,
  ],
  decision_framework: [
    /^framework for/i,
    /^decision process/i,
    /^approach to/i,
    /^methodology for/i,
  ],
  best_practice: [
    /^best practice/i,
    /^recommended/i,
    /^should/i,
    /^optimal/i,
  ],
  common_mistake: [
    /^common mistake/i,
    /^avoid/i,
    /^pitfall/i,
    /^error/i,
  ],
  faq: [
    /^what is/i,
    /^how do/i,
    /^why/i,
    /^when should/i,
  ],
  practical_example: [
    /^example/i,
    /^for instance/i,
    /^such as/i,
    /^consider/i,
  ],
  comparison: [
    /^compared to/i,
    /^versus/i,
    /^vs\.?/i,
    /^difference between/i,
  ],
  checklist: [
    /^checklist/i,
    /^steps to/i,
    /^requirements for/i,
    /^ensure/i,
  ],
};

/**
 * Analyze knowledge package quality
 */
export function analyzeKnowledgeQuality(facts: any[]): KnowledgeQualityMetrics {
  const factTypes = classifyFactTypes(facts);
  
  const metrics: KnowledgeQualityMetrics = {
    totalFacts: facts.length,
    definitions: factTypes.definition || 0,
    coreConcepts: factTypes.core_concept || 0,
    decisionFrameworks: factTypes.decision_framework || 0,
    bestPractices: factTypes.best_practice || 0,
    commonMistakes: factTypes.common_mistake || 0,
    faqs: factTypes.faq || 0,
    practicalExamples: factTypes.practical_example || 0,
    comparisons: factTypes.comparison || 0,
    checklists: factTypes.checklist || 0,
    references: factTypes.reference || 0,
    qualityScore: 0,
    meetsRequirements: false,
    missingComponents: [],
  };

  // Check requirements
  const requirements: FactTypeRequirement[] = [];
  const missingComponents: string[] = [];

  for (const [type, req] of Object.entries(FACT_TYPE_REQUIREMENTS)) {
    const actual = getFactTypeCount(factTypes, type);
    const met = actual >= req.min;
    
    requirements.push({
      type,
      minRequired: req.min,
      recommended: req.recommended,
      actual,
      met,
    });

    if (!met) {
      missingComponents.push(type);
    }
  }

  metrics.meetsRequirements = missingComponents.length === 0;
  metrics.missingComponents = missingComponents;

  // Calculate quality score
  metrics.qualityScore = calculateQualityScore(requirements);

  return metrics;
}

/**
 * Classify facts by type
 */
function classifyFactTypes(facts: any[]): Record<string, number> {
  const types: Record<string, number> = {};

  for (const fact of facts) {
    const statement = fact.statement || fact.description || '';
    const classifiedType = classifyFactType(statement);
    
    types[classifiedType] = (types[classifiedType] || 0) + 1;
  }

  return types;
}

/**
 * Classify a single fact by type
 */
function classifyFactType(statement: string): string {
  const lowerStatement = statement.toLowerCase().trim();

  for (const [type, patterns] of Object.entries(FACT_TYPE_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(lowerStatement)) {
        return type;
      }
    }
  }

  // Default to general fact if no pattern matches
  return 'general';
}

/**
 * Get count for a specific fact type
 */
function getFactTypeCount(types: Record<string, number>, type: string): number {
  return types[type] || 0;
}

/**
 * Calculate quality score based on requirements
 */
function calculateQualityScore(requirements: FactTypeRequirement[]): number {
  let score = 0;
  let totalWeight = 0;

  for (const req of requirements) {
    const weight = req.minRequired > 0 ? 2 : 1; // Higher weight for required types
    totalWeight += weight;

    if (req.met) {
      score += weight;
      
      // Bonus for exceeding recommended
      if (req.actual >= req.recommended) {
        score += weight * 0.5;
      }
    } else {
      // Partial credit for approaching requirement
      const progress = req.actual / req.minRequired;
      score += weight * progress * 0.5;
    }
  }

  return totalWeight > 0 ? Math.round((score / totalWeight) * 100) : 0;
}

/**
 * Generate improvement recommendations
 */
export function generateImprovementRecommendations(
  metrics: KnowledgeQualityMetrics
): string[] {
  const recommendations: string[] = [];

  if (metrics.definitions < FACT_TYPE_REQUIREMENTS.definition.min) {
    recommendations.push(`Add ${FACT_TYPE_REQUIREMENTS.definition.min - metrics.definitions} more definition(s)`);
  }

  if (metrics.coreConcepts < FACT_TYPE_REQUIREMENTS.core_concept.min) {
    recommendations.push(`Add ${FACT_TYPE_REQUIREMENTS.core_concept.min - metrics.coreConcepts} more core concept(s)`);
  }

  if (metrics.decisionFrameworks < FACT_TYPE_REQUIREMENTS.decision_framework.min) {
    recommendations.push(`Add ${FACT_TYPE_REQUIREMENTS.decision_framework.min - metrics.decisionFrameworks} decision framework(s)`);
  }

  if (metrics.bestPractices < FACT_TYPE_REQUIREMENTS.best_practice.min) {
    recommendations.push(`Add ${FACT_TYPE_REQUIREMENTS.best_practice.min - metrics.bestPractices} more best practice(s)`);
  }

  if (metrics.commonMistakes < FACT_TYPE_REQUIREMENTS.common_mistake.min) {
    recommendations.push(`Add ${FACT_TYPE_REQUIREMENTS.common_mistake.min - metrics.commonMistakes} common mistake(s)`);
  }

  if (metrics.faqs < FACT_TYPE_REQUIREMENTS.faq.min) {
    recommendations.push(`Add ${FACT_TYPE_REQUIREMENTS.faq.min - metrics.faqs} more FAQ(s)`);
  }

  if (metrics.practicalExamples < FACT_TYPE_REQUIREMENTS.practical_example.min) {
    recommendations.push(`Add ${FACT_TYPE_REQUIREMENTS.practical_example.min - metrics.practicalExamples} practical example(s)`);
  }

  if (metrics.comparisons < FACT_TYPE_REQUIREMENTS.comparison.min) {
    recommendations.push(`Add ${FACT_TYPE_REQUIREMENTS.comparison.min - metrics.comparisons} comparison(s)`);
  }

  if (metrics.references < FACT_TYPE_REQUIREMENTS.reference.min) {
    recommendations.push(`Add ${FACT_TYPE_REQUIREMENTS.reference.min - metrics.references} more reference(s)`);
  }

  return recommendations;
}

/**
 * Validate knowledge package quality
 */
export function validateKnowledgeQuality(metrics: KnowledgeQualityMetrics): {
  valid: boolean;
  score: number;
  canImprove: boolean;
  criticalGaps: string[];
} {
  const criticalGaps: string[] = [];

  if (metrics.definitions === 0) criticalGaps.push('No definitions');
  if (metrics.coreConcepts === 0) criticalGaps.push('No core concepts');
  if (metrics.references === 0) criticalGaps.push('No references');

  const valid = metrics.meetsRequirements && criticalGaps.length === 0;
  const canImprove = metrics.qualityScore < 90;

  return {
    valid,
    score: metrics.qualityScore,
    canImprove,
    criticalGaps,
  };
}

/**
 * Optimize fact quality without inflating count
 */
export function optimizeFactQuality(facts: any[]): {
  optimizedFacts: any[];
  removedDuplicates: number;
  mergedSimilar: number;
  enhancedQuality: number;
} {
  const optimized: any[] = [];
  const seen = new Set<string>();
  let removedDuplicates = 0;
  let mergedSimilar = 0;

  for (const fact of facts) {
    const normalized = normalizeFactStatement(fact.statement);
    
    if (seen.has(normalized)) {
      removedDuplicates++;
      continue;
    }

    seen.add(normalized);
    optimized.push(fact);
  }

  // In production, this would also merge similar facts
  const enhancedQuality = calculateQualityEnhancement(facts, optimized);

  return {
    optimizedFacts: optimized,
    removedDuplicates,
    mergedSimilar,
    enhancedQuality,
  };
}

/**
 * Normalize fact statement for deduplication
 */
function normalizeFactStatement(statement: string): string {
  return statement
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '');
}

/**
 * Calculate quality enhancement
 */
function calculateQualityEnhancement(original: any[], optimized: any[]): number {
  if (original.length === 0) return 0;
  
  const originalQuality = analyzeKnowledgeQuality(original).qualityScore;
  const optimizedQuality = analyzeKnowledgeQuality(optimized).qualityScore;
  
  return optimizedQuality - originalQuality;
}
