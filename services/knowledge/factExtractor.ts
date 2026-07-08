/**
 * Knowledge Assembler — Step 2: EXTRACT (Phase 5 enhanced)
 *
 * Responsibilities:
 * - Decompose candidate descriptions into atomic facts
 * - Classify each fact by type
 * - Create Citation records for each source
 * - Create Evidence linking fact → citation
 * - Attach provenance (candidateId, adapterId, runId)
 * - Extract entities for tagging
 *
 * Deterministic: same candidate text = same extracted facts.
 * No LLM. No AI. Pure pattern-based extraction.
 */

import type { FactType, FactScope } from "@/lib/types";
import type { CandidateInput, ExtractedFact, CitationRecord } from "./types";
import { normalizeText } from "./normalizer";
import type { NormalizationRecord } from "./types";
import {
  entitySlugsAsTags,
  extractEntitiesFromStatement,
  extractEntitiesFromText,
} from "./entityExtractor";

// ─── Fact Type Classification ────────────────────────────────────────────────

const TYPE_PATTERNS: { pattern: RegExp; type: FactType }[] = [
  { pattern: /^(example|for example):/i, type: "property" },
  { pattern: /^(never|do not|don't|avoid)\s+/i, type: "warning" },
  { pattern: /^to\s+\w+/i, type: "procedural" },
  { pattern: /^.+\s+(is|are|refers to|means|defined as)\s+/i, type: "definition" },
  { pattern: /^.+\s+(was|were|founded|created|invented|discovered|established|introduced|released|launched)\s+/i, type: "historical" },
  { pattern: /^.+\s+(causes?|leads?\s+to|results?\s+in|triggers?)\s+/i, type: "causal" },
  { pattern: /^(to|how to|step|first|then|next|finally|install|configure|choose|select)\s+/i, type: "procedural" },
  { pattern: /^(warning|caution|avoid|never|do not|don't|pitfall|mistake)\s+/i, type: "warning" },
  { pattern: /^.+\s+(vs\.?|versus|compared to|unlike|whereas|differs from)\s+/i, type: "comparison" },
  { pattern: /\d[\d,]*(\.\d+)?\s*(%| percent| million| billion| thousand| packages| users| downloads|ratio|basis points)/i, type: "measurement" },
  { pattern: /^.+\s+(has|have|contains?|includes?|supports?|provides?|features?|uses?|implements?)\s+/i, type: "property" },
  { pattern: /^.+\s+(must|should|always|never|require[sd]?|need[s]? to|prefer)\s+/i, type: "rule" },
  { pattern: /^.+\s+(depends on|relies on|built on|based on)\s+/i, type: "property" },
  { pattern: /^.+\s+(replaces?|supersedes?|deprecated by|succeeded by)\s+/i, type: "historical" },
  { pattern: /^.+\s+(compete[s]?\s+with|alternative to|competitor[s]?)\s+/i, type: "comparison" },
];

export function classifyFactType(statement: string): FactType {
  for (const { pattern, type } of TYPE_PATTERNS) {
    if (pattern.test(statement)) return type;
  }
  return "property";
}

// ─── Scope Detection ─────────────────────────────────────────────────────────

export function detectScope(statement: string): FactScope {
  const lower = statement.toLowerCase();
  if (/\b(version \d|v\d|\d+\.\d+|windows|linux|macos|ios|android|production|development)\b/.test(lower)) {
    return "narrow";
  }
  if (/\b(always|every|all|fundamental|universal|basic|general|typically|generally)\b/.test(lower)) {
    return "universal";
  }
  return "contextual";
}

// ─── Sentence Splitter ───────────────────────────────────────────────────────

export function splitIntoSentences(text: string): string[] {
  const normalized = text
    .replace(/\r\n/g, "\n")
    .replace(/\n{2,}/g, ". ")
    .replace(/\n[-•*]\s+/g, ". ")
    .replace(/\n(\d+[.)]\s+)/g, ". $1");

  const sentences = normalized
    .replace(/([.!?])\s+(?=[A-Z0-9"'])/g, "$1|SPLIT|")
    .replace(/;\s+(?=[A-Z])/g, "|SPLIT|")
    .split("|SPLIT|")
    .map((s) => s.trim())
    .filter((s) => s.length > 10);

  return sentences;
}

/** Extract bullet and numbered list items as standalone claim seeds. */
export function extractListItems(text: string): string[] {
  const items: string[] = [];
  const lines = text.split(/\n/);
  for (const line of lines) {
    const bullet = line.match(/^[-•*]\s+(.+)/);
    const numbered = line.match(/^\d+[.)]\s+(.+)/);
    const content = bullet?.[1] ?? numbered?.[1];
    if (content && content.length > 12) {
      items.push(content.trim().replace(/\.$/, ""));
    }
  }
  return items;
}

// ─── Atomic Decomposition ────────────────────────────────────────────────────

export function decomposeIntoAtomicClaims(sentence: string): string[] {
  const listMatch = sentence.match(/^(.+?)\s+(supports?|includes?|contains?|has|have|provides?|features?|uses?|implements?)\s+(.+)$/i);
  if (listMatch) {
    const subject = listMatch[1];
    const verb = listMatch[2];
    const items = listMatch[3]
      .split(/,\s*(?:and\s+)?|,?\s+and\s+/)
      .map((s) => s.trim().replace(/\.$/, ""))
      .filter((s) => s.length > 0);

    if (items.length > 1) {
      return items.map((item) => `${subject} ${verb} ${item}`);
    }
  }

  const createdMatch = sentence.match(
    /^(.+?)\s+(was created|was founded|was invented|was developed|was designed|was introduced|was released)\s+by\s+(.+?)(?:\s+in\s+(\d{4}))?\b(.*)$/i
  );
  if (createdMatch) {
    const subject = createdMatch[1];
    const verb = createdMatch[2];
    const creator = createdMatch[3];
    const year = createdMatch[4];
    const claims = [`${subject} ${verb} by ${creator}`];
    if (year) claims.push(`${subject} ${verb} in ${year}`);
    return claims;
  }

  const dependsMatch = sentence.match(/^(.+?)\s+(depends on|relies on|requires?|needs?)\s+(.+)$/i);
  if (dependsMatch) {
    return [`${dependsMatch[1]} ${dependsMatch[2]} ${dependsMatch[3].replace(/\.$/, "")}`];
  }

  const becauseMatch = sentence.match(/^(.+?)\s+because\s+(.+)$/i);
  if (becauseMatch && becauseMatch[1].length > 15 && becauseMatch[2].length > 15) {
    return [becauseMatch[1].replace(/\.$/, ""), becauseMatch[2].replace(/\.$/, "")];
  }

  return [sentence];
}

// ─── Tag Extraction ──────────────────────────────────────────────────────────

export function extractTags(statement: string, domain: string | null): string[] {
  const tags: string[] = [];

  if (domain) {
    tags.push(domain.toLowerCase().replace(/\s+/g, "-"));
  }

  const entities = extractEntitiesFromStatement(statement);
  tags.push(...entitySlugsAsTags(entities, 6));

  const properNouns = statement.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g) ?? [];
  for (const noun of properNouns.slice(0, 3)) {
    const tag = noun.toLowerCase().replace(/\s+/g, "-");
    if (tag.length > 2 && !tags.includes(tag)) {
      tags.push(tag);
    }
  }

  return tags.slice(0, 8);
}

// ─── Source Text Assembly ────────────────────────────────────────────────────

function buildSourceText(candidate: CandidateInput): string {
  const parts: string[] = [];

  if (candidate.title) parts.push(candidate.title);
  if (candidate.description) parts.push(candidate.description);

  const meta = candidate.metadata ?? {};
  const contentFields = ["content", "body", "summary", "abstract", "excerpt"] as const;
  for (const field of contentFields) {
    const val = meta[field];
    if (typeof val === "string" && val.length > 20) {
      parts.push(val);
    }
  }

  return parts.join("\n\n");
}

function normalizeClaim(raw: string, subjectHint?: string): string {
  let claim = raw.trim().replace(/\s+/g, " ");
  if (!claim) return "";

  if (subjectHint && !/^[A-Z]/.test(claim) && claim.length > 10) {
    claim = `${subjectHint} ${claim.charAt(0).toLowerCase()}${claim.slice(1)}`;
  }

  if (!/[.!?]$/.test(claim)) {
    claim = `${claim}.`;
  }

  return claim;
}

// ─── Main Extract Function ───────────────────────────────────────────────────

export interface ExtractionResult {
  facts: ExtractedFact[];
  citations: CitationRecord[];
  normalizations: NormalizationRecord[];
  entityCount: number;
  sourceWordCount: number;
}

export async function extractFacts(candidates: CandidateInput[]): Promise<ExtractionResult> {
  const facts: ExtractedFact[] = [];
  const citations: CitationRecord[] = [];
  const allNormalizations: NormalizationRecord[] = [];
  const allEntities = new Set<string>();
  let sourceWordCount = 0;

  for (const candidate of candidates) {
    const citation: CitationRecord = {
      candidateId: candidate.id,
      sourceName: candidate.title,
      sourceUrl: candidate.sourceUrl,
      adapterName: candidate.adapterName,
      extractionMethod: "candidate_decomposition_v5",
      sourceAuthority: candidate.sourceAuthority,
    };
    citations.push(citation);

    const rawText = buildSourceText(candidate);
    if (!rawText || rawText.length < 10) continue;

    sourceWordCount += rawText.split(/\s+/).filter(Boolean).length;

    for (const entity of extractEntitiesFromText(rawText)) {
      allEntities.add(entity.slug);
    }

    const { text: normalizedText, normalizations } = await normalizeText(rawText);
    allNormalizations.push(...normalizations);

    const claimSeeds = new Set<string>();
    for (const sentence of splitIntoSentences(normalizedText)) {
      claimSeeds.add(sentence);
    }
    for (const item of extractListItems(rawText)) {
      claimSeeds.add(item);
    }

    // Structured / long sources: sentence-level claims
    if (rawText.length > 800 && (candidate.sourceAuthority === "encyclopedic" || candidate.sourceAuthority === "official" || candidate.adapterName === "structured-docs")) {
      for (const part of rawText.split(/(?<=[.!?])\s+/)) {
        const p = part.trim().replace(/\s+/g, " ");
        if (p.length >= 30 && p.length <= 500) {
          claimSeeds.add(p);
        }
      }
    }

    // Long authoritative sources: paragraph-level claims for fuller articles
    if (
      rawText.length > 2500 &&
      (candidate.sourceAuthority === "encyclopedic" || candidate.sourceAuthority === "official")
    ) {
      for (const para of rawText.split(/\n\n+/)) {
        const p = para.trim().replace(/\s+/g, " ");
        if (p.length >= 50 && p.length <= 700 && !p.startsWith("=")) {
          claimSeeds.add(p);
        }
      }
    }

    const subjectHint = candidate.title?.replace(/\s+(overview|guide|basics|fundamentals|introduction)$/i, "").trim();

    for (const seed of claimSeeds) {
      const claims = decomposeIntoAtomicClaims(seed);

      for (const rawClaim of claims) {
        const claim = normalizeClaim(rawClaim, subjectHint);
        if (claim.length < 15) continue;

        const factType = classifyFactType(claim);
        const scope = detectScope(claim);
        const domain = (candidate.metadata?.domain as string | null) ?? null;
        const tags = extractTags(claim, domain);

        facts.push({
          statement: claim,
          factType,
          domain,
          scope,
          tags,
          evidence: {
            excerpt: seed.length > 500 ? `${seed.slice(0, 497)}...` : seed,
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

  return {
    facts,
    citations,
    normalizations: allNormalizations,
    entityCount: allEntities.size,
    sourceWordCount,
  };
}
