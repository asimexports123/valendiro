/**
 * Relevance gate — keep fuel from any source (RSS, wiki, docs) only when
 * it actually relates to the catalog topic. Does not block sources by type.
 */

import { scoreNewsSignals } from "@/services/admission/admissionRules";
import type { CandidateInput } from "./types";

const STOP_WORDS = new Set([
  "the", "and", "for", "with", "from", "about", "what", "how", "your", "that", "this",
  "are", "was", "will", "have", "has", "into", "when", "where", "which", "their",
]);

function topicKeywords(slug: string, title?: string): string[] {
  const words = new Set<string>();
  for (const w of slug.split("-")) {
    if (w.length > 2) words.add(w.toLowerCase());
  }
  if (title) {
    for (const w of title.toLowerCase().split(/\W+/)) {
      if (w.length > 3 && !STOP_WORDS.has(w)) words.add(w);
    }
  }
  return [...words];
}

function wordOverlap(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  if (keywords.length === 0) return 0;
  let hits = 0;
  for (const kw of keywords) {
    if (lower.includes(kw)) hits++;
  }
  return hits / keywords.length;
}

const HIGH_AUTHORITY = new Set(["official", "encyclopedic"]);

export interface RelevanceResult {
  score: number;
  pass: boolean;
  reason: string;
}

export function scoreCandidateRelevance(
  candidate: CandidateInput,
  topicSlug: string,
  topicTitle?: string
): RelevanceResult {
  const keywords = topicKeywords(topicSlug, topicTitle);
  const combined = `${candidate.title} ${candidate.description ?? ""}`.slice(0, 4000);
  const overlap = wordOverlap(combined, keywords);
  const newsScore = scoreNewsSignals(candidate.title);

  // Open-web crawler already scored pages against site taxonomy before fetch
  if (
    candidate.adapterName === "open-web-crawler" ||
    candidate.adapterName === "taxonomy-web-discovery" ||
    candidate.adapterName === "brain-writer" ||
    candidate.adapterName === "brain-transform" ||
    candidate.metadata?.brain_pipeline === true ||
    candidate.metadata?.brain_writer === true
  ) {
    if (overlap >= 0.08 || keywords.some((k) => combined.toLowerCase().includes(k))) {
      return { score: Math.max(overlap, 0.55), pass: true, reason: "open-web taxonomy match" };
    }
  }

  // High authority (Wikipedia, MDN, docs) — allow with lower overlap
  if (HIGH_AUTHORITY.has(candidate.sourceAuthority ?? "")) {
    if (overlap >= 0.15 || keywords.some((k) => combined.toLowerCase().includes(k))) {
      return { score: Math.max(overlap, 0.5), pass: true, reason: "authoritative source + topic overlap" };
    }
    // Wikipedia search was gap-driven — trust adapter names
    if (candidate.adapterName === "wikipedia-api" || candidate.adapterName === "authority-map") {
      return { score: 0.6, pass: true, reason: "gap-driven authority acquisition" };
    }
  }

  // Breaking news headline — reject as primary fuel regardless of source
  if (newsScore >= 0.5) {
    return { score: overlap, pass: false, reason: "transient news headline" };
  }

  // RSS / community — require strong topic overlap
  if (overlap >= 0.4) {
    return { score: overlap, pass: true, reason: "strong topic keyword match" };
  }

  if (overlap >= 0.25 && newsScore < 0.3) {
    return { score: overlap, pass: true, reason: "moderate topic match, not news" };
  }

  return {
    score: overlap,
    pass: false,
    reason: `weak match (${Math.round(overlap * 100)}% keywords) — likely wrong topic`,
  };
}

/** Filter candidates; keep all that pass relevance gate. */
export function filterRelevantCandidates(
  candidates: CandidateInput[],
  topicSlug: string,
  topicTitle?: string
): { kept: CandidateInput[]; dropped: { title: string; reason: string }[] } {
  const kept: CandidateInput[] = [];
  const dropped: { title: string; reason: string }[] = [];

  for (const c of candidates) {
    const result = scoreCandidateRelevance(c, topicSlug, topicTitle);
    if (result.pass) kept.push(c);
    else dropped.push({ title: c.title.slice(0, 80), reason: result.reason });
  }

  return { kept, dropped };
}
