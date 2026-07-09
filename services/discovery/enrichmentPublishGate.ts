/**
 * Publish gates for catalog enrichment — fuel must accumulate before live pages update.
 */

import type { AssemblyReport } from "@/services/knowledge/types";
import type { CandidateInput } from "@/services/knowledge/types";

export const ENRICHMENT_MIN_UNIQUE_SOURCES = 3;
export const ENRICHMENT_MIN_FACTS = 15;
export const ENRICHMENT_MIN_CITATIONS = 3;

export function countUniqueSourceUrls(candidates: CandidateInput[]): number {
  const urls = new Set<string>();
  for (const c of candidates) {
    const url = c.sourceUrl?.trim();
    if (url) urls.add(url);
  }
  return urls.size;
}

export function evaluateEnrichmentPublishGate(
  candidates: CandidateInput[],
  report: AssemblyReport
): { allowed: boolean; reason?: string } {
  const uniqueSources = countUniqueSourceUrls(candidates);

  if (uniqueSources < ENRICHMENT_MIN_UNIQUE_SOURCES) {
    return {
      allowed: false,
      reason: `need ${ENRICHMENT_MIN_UNIQUE_SOURCES} unique sources, have ${uniqueSources}`,
    };
  }

  if (report.factsCreated < ENRICHMENT_MIN_FACTS) {
    return {
      allowed: false,
      reason: `need ${ENRICHMENT_MIN_FACTS} facts, have ${report.factsCreated}`,
    };
  }

  if (report.citationsCreated < ENRICHMENT_MIN_CITATIONS) {
    return {
      allowed: false,
      reason: `need ${ENRICHMENT_MIN_CITATIONS} citations, have ${report.citationsCreated}`,
    };
  }

  return { allowed: true };
}
