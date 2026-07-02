/**
 * Knowledge Assembler — Step 2: EXTRACT
 *
 * Responsibilities:
 * - Decompose candidate descriptions into atomic facts
 * - Classify each fact by type
 * - Create Citation records for each source
 * - Create Evidence linking fact → citation
 * - Attach provenance (candidateId, adapterId, runId)
 *
 * Deterministic: same candidate text = same extracted facts.
 * No LLM. No AI. Pure pattern-based extraction.
 */

import type { FactType, FactScope } from "@/lib/types";
import type { CandidateInput, ExtractedFact, CitationRecord } from "./types";
import { normalizeText } from "./normalizer";
import type { NormalizationRecord } from "./types";

// ─── Fact Type Classification ────────────────────────────────────────────────

const TYPE_PATTERNS: { pattern: RegExp; type: FactType }[] = [
  { pattern: /^.+\s+(is|are|refers to|means|defined as)\s+/i, type: "definition" },
  { pattern: /^.+\s+(was|were|founded|created|invented|discovered|established)\s+/i, type: "historical" },
  { pattern: /^.+\s+(causes?|leads?\s+to|results?\s+in)\s+/i, type: "causal" },
  { pattern: /^(to|how to|step|first|then|next|finally)\s+/i, type: "procedural" },
  { pattern: /^(warning|caution|avoid|never|do not|don't)\s+/i, type: "warning" },
  { pattern: /^.+\s+(vs\.?|versus|compared to|unlike|whereas)\s+/i, type: "comparison" },
  { pattern: /\d[\d,]*(\.\d+)?\s*(%| percent| million| billion| thousand| packages| users| downloads)/i, type: "measurement" },
  { pattern: /^.+\s+(has|have|contains?|includes?|supports?|provides?|features?)\s+/i, type: "property" },
  { pattern: /^.+\s+(must|should|always|never|require[sd]?)\s+/i, type: "rule" },
];

export function classifyFactType(statement: string): FactType {
  for (const { pattern, type } of TYPE_PATTERNS) {
    if (pattern.test(statement)) return type;
  }
  return "property"; // default fallback
}

// ─── Scope Detection ─────────────────────────────────────────────────────────

export function detectScope(statement: string): FactScope {
  const lower = statement.toLowerCase();
  // Narrow: version-specific, platform-specific, implementation-specific
  if (/\b(version \d|v\d|\d+\.\d+|windows|linux|macos|ios|android)\b/.test(lower)) {
    return "narrow";
  }
  // Universal: general principles, definitions, always-true statements
  if (/\b(always|every|all|fundamental|universal|basic|general)\b/.test(lower)) {
    return "universal";
  }
  return "contextual";
}

// ─── Sentence Splitter ───────────────────────────────────────────────────────

export function splitIntoSentences(text: string): string[] {
  // Split on sentence boundaries while preserving abbreviations
  const sentences = text
    .replace(/([.!?])\s+(?=[A-Z])/g, "$1|SPLIT|")
    .split("|SPLIT|")
    .map(s => s.trim())
    .filter(s => s.length > 10); // discard fragments

  return sentences;
}

// ─── Atomic Decomposition ────────────────────────────────────────────────────

export function decomposeIntoAtomicClaims(sentence: string): string[] {
  // Split compound claims joined by "and", "or", commas with conjunctions
  // Only split if both halves can stand alone as claims

  // Pattern: "X supports A, B, and C" → separate claims
  const listMatch = sentence.match(/^(.+?)\s+(supports?|includes?|contains?|has|have|provides?|features?)\s+(.+)$/i);
  if (listMatch) {
    const subject = listMatch[1];
    const verb = listMatch[2];
    const items = listMatch[3]
      .split(/,\s*(?:and\s+)?|,?\s+and\s+/)
      .map(s => s.trim().replace(/\.$/, ""))
      .filter(s => s.length > 0);

    if (items.length > 1) {
      return items.map(item => `${subject} ${verb} ${item}`);
    }
  }

  // Pattern: "X was created by Y in Z" → two facts if we can detect date
  const createdMatch = sentence.match(/^(.+?)\s+(was created|was founded|was invented|was developed)\s+by\s+(.+?)\s+in\s+(\d{4})\b(.*)$/i);
  if (createdMatch) {
    const subject = createdMatch[1];
    const verb = createdMatch[2];
    const creator = createdMatch[3];
    const year = createdMatch[4];
    return [
      `${subject} ${verb} by ${creator}`,
      `${subject} ${verb} in ${year}`,
    ];
  }

  // No decomposition needed — already atomic
  return [sentence];
}

// ─── Tag Extraction ──────────────────────────────────────────────────────────

export function extractTags(statement: string, domain: string | null): string[] {
  const tags: string[] = [];

  // Extract domain as tag
  if (domain) {
    tags.push(domain.toLowerCase().replace(/\s+/g, "-"));
  }

  // Extract capitalized proper nouns (likely entities)
  const properNouns = statement.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g) || [];
  for (const noun of properNouns.slice(0, 3)) {
    const tag = noun.toLowerCase().replace(/\s+/g, "-");
    if (tag.length > 2 && !tags.includes(tag)) {
      tags.push(tag);
    }
  }

  return tags.slice(0, 5); // max 5 tags
}

// ─── Main Extract Function ───────────────────────────────────────────────────

export interface ExtractionResult {
  facts: ExtractedFact[];
  citations: CitationRecord[];
  normalizations: NormalizationRecord[];
}

export async function extractFacts(candidates: CandidateInput[]): Promise<ExtractionResult> {
  const facts: ExtractedFact[] = [];
  const citations: CitationRecord[] = [];
  const allNormalizations: NormalizationRecord[] = [];

  for (const candidate of candidates) {
    // Create citation for this candidate
    const citation: CitationRecord = {
      candidateId: candidate.id,
      sourceName: candidate.title,
      sourceUrl: candidate.sourceUrl,
      adapterName: candidate.adapterName,
      extractionMethod: "candidate_decomposition",
      sourceAuthority: candidate.sourceAuthority,
    };
    citations.push(citation);

    // Extract text to decompose
    const rawText = [candidate.title, candidate.description]
      .filter(Boolean)
      .join(". ");

    if (!rawText || rawText.length < 10) continue;

    // Step 1: Normalize
    const { text: normalizedText, normalizations } = await normalizeText(rawText);
    allNormalizations.push(...normalizations);

    // Step 2: Split into sentences
    const sentences = splitIntoSentences(normalizedText);

    // Step 3: Decompose each sentence into atomic claims
    for (const sentence of sentences) {
      const claims = decomposeIntoAtomicClaims(sentence);

      for (const claim of claims) {
        // Skip too-short claims
        if (claim.length < 15) continue;

        const factType = classifyFactType(claim);
        const scope = detectScope(claim);
        const domain = candidate.metadata?.domain as string | null ?? null;
        const tags = extractTags(claim, domain);

        facts.push({
          statement: claim,
          factType,
          domain,
          scope,
          tags,
          evidence: {
            excerpt: sentence, // original sentence as evidence
            citationRef: candidate.id,
          },
          provenance: {
            candidateId: candidate.id,
            discoveryRunId: candidate.discoveryRunId,
            adapterName: candidate.adapterName,
            sourceSlug: candidate.sourceSlug,
          },
        });
      }
    }
  }

  return { facts, citations, normalizations: allNormalizations };
}
