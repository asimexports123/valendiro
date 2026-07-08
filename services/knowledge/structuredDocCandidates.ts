/**
 * Bridge structured documentation into the knowledge assembly pipeline.
 */

import { v4 as uuidv4 } from "uuid";
import { StructuredDocsAdapter } from "@/services/discovery/adapters/structuredDocsAdapter";
import type { CandidateInput } from "./types";

const adapter = new StructuredDocsAdapter();

export function getStructuredDocCandidate(slug: string, title: string): CandidateInput | null {
  const raw = adapter.getFullDocCandidate(slug, title);
  if (!raw?.description || raw.description.length < 200) return null;

  return {
    id: uuidv4(),
    title: raw.title,
    description: raw.description,
    sourceUrl: raw.sourceUrl,
    discoveryRunId: uuidv4(),
    adapterName: "structured-docs",
    sourceSlug: new URL(raw.sourceUrl).hostname.replace("www.", ""),
    sourceAuthority: "official",
    metadata: raw.metadata,
  };
}
