/**
 * Knowledge Assembler — Step 1: NORMALIZE
 *
 * Responsibilities:
 * - Normalize text (casing, whitespace, encoding)
 * - Resolve abbreviations via Domain Glossary
 * - Standardize terminology
 *
 * This step is deterministic: same input + same glossary = same output.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import type { NormalizationRecord } from "./types";

// ─── Glossary Cache ──────────────────────────────────────────────────────────

let glossaryCache: Map<string, string> | null = null;

export async function loadGlossary(): Promise<Map<string, string>> {
  if (glossaryCache) return glossaryCache;

  const sb = createAdminClient();
  const { data } = await sb
    .from("domain_glossary")
    .select("abbreviation, canonical_form");

  glossaryCache = new Map();
  if (data) {
    for (const entry of data) {
      glossaryCache.set(entry.abbreviation.toLowerCase(), entry.canonical_form);
    }
  }
  return glossaryCache;
}

export function clearGlossaryCache(): void {
  glossaryCache = null;
}

// ─── Text Normalization ──────────────────────────────────────────────────────

export function normalizeWhitespace(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\t/g, " ")
    .replace(/ {2,}/g, " ")
    .trim();
}

export function normalizeEncoding(text: string): string {
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2014/g, "—")
    .replace(/\u2013/g, "–")
    .replace(/\u2026/g, "...")
    .replace(/\u00A0/g, " ");
}

// ─── Glossary-Based Normalization ────────────────────────────────────────────

export function applyGlossary(
  text: string,
  glossary: Map<string, string>,
  normalizations: NormalizationRecord[]
): string {
  let result = text;

  // Sort by longest abbreviation first to avoid partial matches
  const entries = [...glossary.entries()].sort((a, b) => b[0].length - a[0].length);

  for (const [abbrev, canonical] of entries) {
    // Word-boundary match (case-insensitive)
    const regex = new RegExp(`\\b${escapeRegex(abbrev)}\\b`, "gi");
    const match = result.match(regex);
    if (match) {
      // Only normalize if it's not already the canonical form
      if (match[0] !== canonical) {
        result = result.replace(regex, canonical);
        normalizations.push({
          original: match[0],
          normalized: canonical,
          glossaryEntry: `${abbrev} → ${canonical}`,
        });
      }
    }
  }

  return result;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ─── Main Normalize Function ─────────────────────────────────────────────────

export interface NormalizeResult {
  text: string;
  normalizations: NormalizationRecord[];
}

export async function normalizeText(text: string): Promise<NormalizeResult> {
  const glossary = await loadGlossary();
  const normalizations: NormalizationRecord[] = [];

  let normalized = normalizeWhitespace(text);
  normalized = normalizeEncoding(normalized);
  normalized = applyGlossary(normalized, glossary, normalizations);

  return { text: normalized, normalizations };
}
