/**
 * Brain output quality gate — block thin, robotic, and filler publish.
 */

import { countWords } from "@/services/knowledge/contentQualityGate";

export const MIN_BRAIN_WORD_COUNT = 750;
export const MIN_BRAIN_SECTION_WORDS = 90;
export const MIN_BRAIN_H2_SECTIONS = 4;
export const MIN_BRAIN_DISTINCT_IDEAS = 8;
export const MIN_FUEL_SOURCES = 3;

const ROBOTIC_PATTERNS: { pattern: RegExp; max: number; label: string }[] = [
  { pattern: /\bIn practice,/gi, max: 1, label: "repetitive opener 'In practice'" },
  { pattern: /\bPut simply,/gi, max: 1, label: "repetitive opener 'Put simply'" },
  { pattern: /\bFor learners,/gi, max: 1, label: "repetitive opener 'For learners'" },
  { pattern: /\bAt a high level,/gi, max: 1, label: "repetitive opener 'At a high level'" },
  { pattern: /\bbest understood as\b/gi, max: 2, label: "overused 'best understood as'" },
  { pattern: /\bKey idea:/gi, max: 1, label: "repetitive 'Key idea'" },
];

const FILLER_PATTERNS: RegExp[] = [
  /core topic within our catalog/i,
  /This guide explains the concept in clear, practical terms for learners who want reliable knowledge without noise/i,
  /Core concepts are still being enriched for this topic/i,
  /helps you make better decisions in .+ and connect ideas across related subjects/i,
];

export interface BrainQualityResult {
  pass: boolean;
  wordCount: number;
  sectionCount: number;
  distinctIdeas: number;
  reasons: string[];
}

function extractH2Sections(markdown: string): string[] {
  const parts = markdown.split(/^## /m).slice(1);
  return parts.map((p) => p.replace(/^[^\n]+\n?/, "").trim()).filter(Boolean);
}

function countDistinctIdeas(markdown: string): number {
  const lines = markdown
    .split("\n")
    .map((l) => l.replace(/^#+\s*/, "").replace(/^[-*]\s*/, "").trim())
    .filter((l) => l.length > 40);

  const keys = new Set<string>();
  for (const line of lines) {
    const key = line
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .slice(0, 8)
      .join(" ");
    if (key.length > 20) keys.add(key);
  }
  return keys.size;
}

/** Reject thin, robotic, or filler brain output before publish. */
export function evaluateBrainQuality(markdown: string): BrainQualityResult {
  const reasons: string[] = [];
  const wordCount = countWords(markdown);
  const sections = extractH2Sections(markdown);
  const distinctIdeas = countDistinctIdeas(markdown);

  if (wordCount < MIN_BRAIN_WORD_COUNT) {
    reasons.push(`Too thin: ${wordCount} words (min ${MIN_BRAIN_WORD_COUNT})`);
  }

  if (sections.length < MIN_BRAIN_H2_SECTIONS) {
    reasons.push(`Too few sections: ${sections.length} (min ${MIN_BRAIN_H2_SECTIONS})`);
  }

  const thinSections = sections.filter((s) => countWords(s) < MIN_BRAIN_SECTION_WORDS);
  if (thinSections.length > 1) {
    reasons.push(`${thinSections.length} sections under ${MIN_BRAIN_SECTION_WORDS} words`);
  }

  if (distinctIdeas < MIN_BRAIN_DISTINCT_IDEAS) {
    reasons.push(`Not enough distinct ideas: ${distinctIdeas} (min ${MIN_BRAIN_DISTINCT_IDEAS})`);
  }

  for (const { pattern, max, label } of ROBOTIC_PATTERNS) {
    const matches = markdown.match(pattern);
    if (matches && matches.length > max) {
      reasons.push(`Robotic phrasing: ${label} (${matches.length}x)`);
    }
  }

  for (const pattern of FILLER_PATTERNS) {
    if (pattern.test(markdown)) {
      reasons.push(`Generic filler detected (${pattern.source})`);
    }
  }

  return {
    pass: reasons.length === 0,
    wordCount,
    sectionCount: sections.length,
    distinctIdeas,
    reasons,
  };
}
