/**
 * Growth Engine — Revenue-Aware Publishing Strategy
 *
 * Controls the entire content strategy based on current growth phase.
 * The system adapts its behavior automatically:
 *
 * Phase 1: "AdSense Sprint"
 *   - Focus on HIGH quality, 1500+ word articles
 *   - Prioritize "What is X" (informational) topics — easiest to rank
 *   - Target: 30-50 articles → Apply for AdSense
 *   - No bulk generation, quality over quantity
 *
 * Phase 2: "Traffic Growth"
 *   - AdSense approved, now scale
 *   - Prioritize high-volume search topics
 *   - Mix of formats: guides, how-tos, comparisons
 *   - Target: 500+ articles, 10-15/day drip
 *
 * Phase 3: "Revenue Optimization"
 *   - Analyze which categories earn most
 *   - Double down on high-RPM categories
 *   - Expand winning subcategories
 *   - Target: 2000+ articles
 *
 * Phase 4: "Scale & SaaS"
 *   - Full autopilot, maximum coverage
 *   - Prepare for SaaS features
 *   - Multi-language expansion
 */

import { createAdminClient } from "@/lib/supabase/admin";

// ─── Types ───────────────────────────────────────────────────────────────────

export type GrowthPhase = "adsense_sprint" | "traffic_growth" | "revenue_optimization" | "scale";

export interface GrowthConfig {
  phase: GrowthPhase;
  maxArticlesPerDay: number;
  minWordCount: number;
  targetWordCount: number;
  topicPriority: ("informational" | "how_to" | "comparison" | "listicle" | "guide")[];
  qualityThreshold: number; // 0-100
  focusCategories: string[]; // empty = all
  enableBulkGeneration: boolean;
  enableDripPublish: boolean;
}

export interface GrowthStatus {
  currentPhase: GrowthPhase;
  totalPublished: number;
  publishedLast7Days: number;
  publishedLast30Days: number;
  topCategories: { slug: string; count: number; estimatedRPM: number }[];
  readyForNextPhase: boolean;
  nextPhaseRequirements: string[];
}

// ─── Phase Configurations ────────────────────────────────────────────────────

const PHASE_CONFIGS: Record<GrowthPhase, GrowthConfig> = {
  adsense_sprint: {
    phase: "adsense_sprint",
    maxArticlesPerDay: 5,
    minWordCount: 1500,
    targetWordCount: 2200,
    topicPriority: ["informational", "guide", "how_to"],
    qualityThreshold: 80,
    focusCategories: [],
    enableBulkGeneration: false,
    enableDripPublish: true,
  },
  traffic_growth: {
    phase: "traffic_growth",
    maxArticlesPerDay: 15,
    minWordCount: 1000,
    targetWordCount: 1800,
    topicPriority: ["how_to", "comparison", "informational", "listicle"],
    qualityThreshold: 70,
    focusCategories: [],
    enableBulkGeneration: true,
    enableDripPublish: true,
  },
  revenue_optimization: {
    phase: "revenue_optimization",
    maxArticlesPerDay: 20,
    minWordCount: 800,
    targetWordCount: 1500,
    topicPriority: ["comparison", "how_to", "listicle", "guide"],
    qualityThreshold: 70,
    focusCategories: [], // Will be filled by revenue analysis
    enableBulkGeneration: true,
    enableDripPublish: true,
  },
  scale: {
    phase: "scale",
    maxArticlesPerDay: 30,
    minWordCount: 600,
    targetWordCount: 1500,
    topicPriority: ["informational", "how_to", "comparison", "listicle", "guide"],
    qualityThreshold: 65,
    focusCategories: [],
    enableBulkGeneration: true,
    enableDripPublish: true,
  },
};

// ─── Phase Detection ─────────────────────────────────────────────────────────

/**
 * Automatically detect the current growth phase based on published content count.
 */
export async function detectGrowthPhase(): Promise<GrowthPhase> {
  const supabase = createAdminClient();

  const { count: totalPublished } = await supabase
    .from("articles")
    .select("id", { count: "exact", head: true })
    .eq("status", "published");

  const total = totalPublished ?? 0;

  // Phase transitions based on published article count
  if (total < 50) return "adsense_sprint";
  if (total < 500) return "traffic_growth";
  if (total < 2000) return "revenue_optimization";
  return "scale";
}

/**
 * Get the active growth configuration.
 * Can be overridden via GROWTH_PHASE env variable.
 */
export async function getGrowthConfig(): Promise<GrowthConfig> {
  const envPhase = process.env.GROWTH_PHASE as GrowthPhase | undefined;
  const phase = envPhase || await detectGrowthPhase();
  return { ...PHASE_CONFIGS[phase] };
}

// ─── Topic Priority Scoring ──────────────────────────────────────────────────

/**
 * Score a topic based on current growth phase priorities.
 * Higher score = publish first.
 */
export function scoreTopicForPhase(
  topic: {
    searchIntent: string;
    difficulty: string;
    estimatedArticles: number;
  },
  config: GrowthConfig
): number {
  let score = 50;

  // Intent priority bonus
  const intentIndex = config.topicPriority.indexOf(topic.searchIntent as any);
  if (intentIndex >= 0) {
    score += (config.topicPriority.length - intentIndex) * 10;
  }

  // Beginner topics rank higher in early phases
  if (config.phase === "adsense_sprint" || config.phase === "traffic_growth") {
    if (topic.difficulty === "beginner") score += 20;
    if (topic.difficulty === "intermediate") score += 10;
  }

  // In revenue phase, prefer topics with more article potential
  if (config.phase === "revenue_optimization" || config.phase === "scale") {
    score += Math.min(topic.estimatedArticles * 5, 25);
  }

  return Math.min(100, Math.max(0, score));
}

// ─── Fast-Traffic Topic Patterns ─────────────────────────────────────────────

/**
 * Topic patterns that historically get traffic fastest.
 * Used to prioritize topic generation in early phases.
 */
export const FAST_TRAFFIC_PATTERNS = {
  // "What is X" — easiest to rank, high search volume
  informational: [
    "What is {topic}",
    "{topic} Explained Simply",
    "{topic} Meaning and Definition",
    "Understanding {topic}",
  ],
  // "How to X" — high intent, actionable
  how_to: [
    "How to {action} {topic}",
    "{topic} Step by Step",
    "{topic} for Beginners",
    "Getting Started with {topic}",
  ],
  // "X vs Y" — comparison queries get lots of clicks
  comparison: [
    "{topic} vs {alternative}",
    "{topic} Pros and Cons",
    "Best {topic} Options",
    "{topic} Alternatives",
  ],
};

// ─── Growth Status ───────────────────────────────────────────────────────────

/**
 * Get current growth status for dashboard/monitoring.
 */
export async function getGrowthStatus(): Promise<GrowthStatus> {
  const supabase = createAdminClient();
  const phase = await detectGrowthPhase();

  const { count: totalPublished } = await supabase
    .from("articles")
    .select("id", { count: "exact", head: true })
    .eq("status", "published");

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { count: last7 } = await supabase
    .from("articles")
    .select("id", { count: "exact", head: true })
    .eq("status", "published")
    .gte("published_at", weekAgo);

  const { count: last30 } = await supabase
    .from("articles")
    .select("id", { count: "exact", head: true })
    .eq("status", "published")
    .gte("published_at", monthAgo);

  // Requirements for next phase
  const total = totalPublished ?? 0;
  const nextPhaseRequirements: string[] = [];
  let readyForNextPhase = false;

  switch (phase) {
    case "adsense_sprint":
      if (total >= 50) readyForNextPhase = true;
      else nextPhaseRequirements.push(`Need ${50 - total} more published articles (target: 50)`);
      nextPhaseRequirements.push("Apply for Google AdSense");
      break;
    case "traffic_growth":
      if (total >= 500) readyForNextPhase = true;
      else nextPhaseRequirements.push(`Need ${500 - total} more articles (target: 500)`);
      nextPhaseRequirements.push("Monitor AdSense revenue by category");
      break;
    case "revenue_optimization":
      if (total >= 2000) readyForNextPhase = true;
      else nextPhaseRequirements.push(`Need ${2000 - total} more articles (target: 2000)`);
      nextPhaseRequirements.push("Identify top-RPM categories and double down");
      break;
    case "scale":
      nextPhaseRequirements.push("Continue scaling, prepare SaaS features");
      break;
  }

  return {
    currentPhase: phase,
    totalPublished: total,
    publishedLast7Days: last7 ?? 0,
    publishedLast30Days: last30 ?? 0,
    topCategories: [],
    readyForNextPhase,
    nextPhaseRequirements,
  };
}
