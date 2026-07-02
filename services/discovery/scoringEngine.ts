/**
 * Discovery Scoring Engine
 *
 * Deterministic scoring for discovery candidates.
 * Scores are based on:
 *   - relevanceScore: how well the candidate matches the slot
 *   - confidenceScore: how certain the adapter is about the match
 *   - Combined score = weighted average
 *
 * Thresholds determine accept/reject.
 */

import type { RawCandidate, SourceAttribution } from "./adapters";

export interface ScoreComponent {
  factor: string;
  points: number;
  reason: string;
}

export interface ScoreExplanation {
  combinedScore: number;
  components: ScoreComponent[];
  summary: string;
}

export interface ScoringConfig {
  relevanceWeight: number;   // 0-1, default 0.6
  confidenceWeight: number;  // 0-1, default 0.4
  acceptThreshold: number;   // minimum combined score to accept, default 60
  rejectThreshold: number;   // below this = auto-reject, default 30
}

export interface ScoredCandidate extends RawCandidate {
  combinedScore: number;
  decision: "accepted" | "rejected" | "pending";
  rejectionReason: string | null;
  explanation: ScoreExplanation;
}

const DEFAULT_CONFIG: ScoringConfig = {
  relevanceWeight: 0.6,
  confidenceWeight: 0.4,
  acceptThreshold: 60,
  rejectThreshold: 30,
};

export function scoreCandidate(
  candidate: RawCandidate,
  config: ScoringConfig = DEFAULT_CONFIG
): ScoredCandidate {
  const components: ScoreComponent[] = [];

  // Relevance component
  const relevancePoints = Math.round(candidate.relevanceScore * config.relevanceWeight);
  components.push({
    factor: "Relevance",
    points: relevancePoints,
    reason: `Relevance ${candidate.relevanceScore} × weight ${config.relevanceWeight}`,
  });

  // Confidence component
  const confidencePoints = Math.round(candidate.confidenceScore * config.confidenceWeight);
  components.push({
    factor: "Confidence",
    points: confidencePoints,
    reason: `Confidence ${candidate.confidenceScore} × weight ${config.confidenceWeight}`,
  });

  // Source attribution bonus
  let sourceBonus = 0;
  if (candidate.attribution) {
    if (candidate.attribution.extractionMethod === "toc_heading") {
      sourceBonus = 10;
      components.push({ factor: "Structured Source", points: 10, reason: "Extracted from TOC/heading structure" });
    } else if (candidate.attribution.extractionMethod === "doc_navigation") {
      sourceBonus = 12;
      components.push({ factor: "Official Documentation", points: 12, reason: "From official documentation navigation" });
    } else if (candidate.attribution.extractionMethod === "see_also") {
      sourceBonus = 5;
      components.push({ factor: "Related Link", points: 5, reason: "From 'See also' or related section" });
    }
  }

  const combined = Math.min(100, relevancePoints + confidencePoints + sourceBonus);

  let decision: ScoredCandidate["decision"];
  let rejectionReason: string | null = null;

  if (combined >= config.acceptThreshold) {
    decision = "accepted";
  } else if (combined < config.rejectThreshold) {
    decision = "rejected";
    rejectionReason = `Combined score ${combined} below reject threshold ${config.rejectThreshold}`;
  } else {
    decision = "pending";
  }

  // Title quality checks
  if (candidate.title.length < 5) {
    decision = "rejected";
    rejectionReason = "Title too short";
    components.push({ factor: "Quality Check", points: -100, reason: "Title too short (<5 chars)" });
  }
  if (candidate.title.length > 200) {
    decision = "rejected";
    rejectionReason = "Title too long";
    components.push({ factor: "Quality Check", points: -100, reason: "Title too long (>200 chars)" });
  }

  const explanation: ScoreExplanation = {
    combinedScore: combined,
    components,
    summary: components.filter(c => c.points > 0).map(c => `+${c.points} ${c.factor}`).join(", "),
  };

  return {
    ...candidate,
    combinedScore: combined,
    decision,
    rejectionReason,
    explanation,
  };
}

export function scoreCandidates(
  candidates: RawCandidate[],
  config: ScoringConfig = DEFAULT_CONFIG
): ScoredCandidate[] {
  return candidates
    .map((c) => scoreCandidate(c, config))
    .sort((a, b) => b.combinedScore - a.combinedScore);
}
