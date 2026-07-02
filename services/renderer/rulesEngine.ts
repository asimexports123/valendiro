/**
 * Render Rules Engine
 *
 * Evaluates package eligibility, selects policy, computes block order,
 * and detects missing knowledge before rendering begins.
 *
 * Pure function. No side effects. No database access.
 */

import type {
  RenderDecision,
  RenderingPolicy,
  BlockPriority,
  MissingKnowledgeFlag,
  PluginFact,
  CitationInput,
} from "./types";
import { SECTION_TEMPLATES } from "./templates";

// ─── Default Block Priorities ────────────────────────────────────────────────

const DEFAULT_BLOCK_ORDER: BlockPriority[] = [
  { sectionType: "definition", priority: 1, required: true, minFacts: 1, maxFacts: null },
  { sectionType: "property", priority: 2, required: false, minFacts: 2, maxFacts: null },
  { sectionType: "historical", priority: 3, required: false, minFacts: 1, maxFacts: null },
  { sectionType: "procedural", priority: 4, required: false, minFacts: 1, maxFacts: null },
  { sectionType: "comparison", priority: 5, required: false, minFacts: 2, maxFacts: null },
  { sectionType: "measurement", priority: 6, required: false, minFacts: 1, maxFacts: null },
  { sectionType: "warning", priority: 7, required: false, minFacts: 1, maxFacts: null },
  { sectionType: "causal", priority: 8, required: false, minFacts: 1, maxFacts: null },
  { sectionType: "rule", priority: 9, required: false, minFacts: 1, maxFacts: null },
];

// ─── Default Policy ──────────────────────────────────────────────────────────

const DEFAULT_POLICY: RenderingPolicy = {
  id: "default",
  name: "default",
  categoryMatch: [],
  requiredFactTypes: ["definition"],
  preferredFormat: "long-article",
  preferredStyle: ["intermediate"],
  minFactCount: 5,
  minCitationCount: 1,
  sectionOverrides: [],
  commercialPlaceholders: false,
};

// ─── Evaluate ────────────────────────────────────────────────────────────────

export function evaluate(
  facts: PluginFact[],
  citations: CitationInput[],
  policy?: RenderingPolicy | null
): RenderDecision {
  const activePolicy = policy ?? DEFAULT_POLICY;
  const warnings: string[] = [];

  // Compute fact type distribution
  const factsByType: Record<string, number> = {};
  for (const fact of facts) {
    factsByType[fact.factType] = (factsByType[fact.factType] || 0) + 1;
  }

  // Check eligibility
  let eligible = true;
  let reason: string | null = null;

  if (facts.length < activePolicy.minFactCount) {
    eligible = false;
    reason = `Insufficient facts: ${facts.length} < ${activePolicy.minFactCount} required`;
  }

  if (citations.length < activePolicy.minCitationCount) {
    eligible = false;
    reason = `Insufficient citations: ${citations.length} < ${activePolicy.minCitationCount} required`;
  }

  // Check required fact types
  for (const required of activePolicy.requiredFactTypes) {
    if (!factsByType[required]) {
      eligible = false;
      reason = `Missing required fact type: ${required}`;
      break;
    }
  }

  // Compute block order (merge policy overrides with defaults)
  const blockOrder = computeBlockOrder(activePolicy);

  // Detect missing knowledge
  const missingKnowledge = detectMissingKnowledge(factsByType, blockOrder);

  // Warnings
  if (facts.length < 10) {
    warnings.push("Low fact count may produce thin content");
  }
  if (citations.length === 1) {
    warnings.push("Single source — consider additional discovery");
  }

  return {
    eligible,
    reason,
    policy: activePolicy,
    blockOrder,
    missingKnowledge,
    warnings,
  };
}

// ─── Block Order Computation ─────────────────────────────────────────────────

function computeBlockOrder(policy: RenderingPolicy): BlockPriority[] {
  if (policy.sectionOverrides.length > 0) {
    // Merge: overrides take priority, defaults fill gaps
    const overrideMap = new Map(policy.sectionOverrides.map((o) => [o.sectionType, o]));
    return DEFAULT_BLOCK_ORDER.map((bp) => overrideMap.get(bp.sectionType) ?? bp);
  }
  return [...DEFAULT_BLOCK_ORDER];
}

// ─── Missing Knowledge Detection ─────────────────────────────────────────────

function detectMissingKnowledge(
  factsByType: Record<string, number>,
  blockOrder: BlockPriority[]
): MissingKnowledgeFlag[] {
  const missing: MissingKnowledgeFlag[] = [];

  for (const block of blockOrder) {
    const count = factsByType[block.sectionType] || 0;
    if (count < block.minFacts) {
      const section = SECTION_TEMPLATES.find((s) => s.factType === block.sectionType);
      const sectionName = section?.headingVariants[0] ?? block.sectionType;

      if (block.required) {
        missing.push({
          factType: block.sectionType,
          sectionName,
          severity: "critical",
          suggestion: `Add at least ${block.minFacts} ${block.sectionType} fact(s) for this package`,
        });
      } else if (count === 0 && block.priority <= 4) {
        missing.push({
          factType: block.sectionType,
          sectionName,
          severity: "recommended",
          suggestion: `Consider adding ${block.sectionType} facts to improve coverage`,
        });
      }
    }
  }

  return missing;
}

export { DEFAULT_POLICY, DEFAULT_BLOCK_ORDER };
