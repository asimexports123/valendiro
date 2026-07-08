/**
 * Multi-source candidate gathering for Knowledge Assembly (Phase 5).
 *
 * Gathers all knowledge assets linked to a topic slug for richer synthesis.
 * Does NOT modify Connector, Adapter, or KnowledgeAsset schemas.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { v4 as uuidv4 } from "uuid";
import type { CandidateInput } from "./types";
import {
  KNOWLEDGE_ASSET_TABLE,
  rowToDiscoveredArticleLogical,
  type KnowledgeAssetRow,
} from "@/services/discovery/ingest/knowledgeAssetCompat";
import { isArchivedNewsAsset } from "@/services/admission/knowledgeAdmissionEngine";

export interface GatherCandidatesResult {
  candidates: CandidateInput[];
  sourceAssetIds: string[];
}

/** Gather all accepted knowledge assets mapped to a topic. */
export async function gatherCandidatesForTopic(topicId: string): Promise<GatherCandidatesResult> {
  const sb = createAdminClient();

  const { data: mappings } = await sb
    .from("discovered_article_topics")
    .select("discovered_article_id")
    .eq("topic_id", topicId);

  const assetIds = (mappings ?? []).map((m) => m.discovered_article_id);
  if (assetIds.length === 0) {
    return { candidates: [], sourceAssetIds: [] };
  }

  const { data: assets } = await sb
    .from(KNOWLEDGE_ASSET_TABLE)
    .select("*")
    .in("id", assetIds)
    .in("status", ["accepted", "pending", "processing"]);

  const candidates: CandidateInput[] = [];

  for (const row of assets ?? []) {
    const article = rowToDiscoveredArticleLogical(row as KnowledgeAssetRow);
    if (isArchivedNewsAsset(article.metadata as Record<string, unknown>)) {
      continue;
    }
    const text = article.content || article.summary || article.title;

    const { data: source } = await sb
      .from("discovery_system_sources")
      .select("name")
      .eq("id", article.source_id)
      .maybeSingle();

    candidates.push({
      id: uuidv4(),
      title: article.title,
      description: text,
      sourceUrl: article.url,
      discoveryRunId: article.id,
      adapterName: "rss-connector",
      sourceSlug: source?.name ?? "rss",
      sourceAuthority: "community",
      metadata: {
        ...(article.metadata ?? {}),
        content: article.content,
        summary: article.summary,
      },
    });
  }

  return { candidates, sourceAssetIds: assetIds };
}

/** Build synthetic multi-source candidates from existing package citations + facts (for re-extraction). */
export async function rebuildCandidatesFromPackage(packageId: string): Promise<CandidateInput[]> {
  const sb = createAdminClient();

  const { data: citations } = await sb
    .from("knowledge_citations")
    .select("id, source_name, source_url, adapter_name, source_authority")
    .eq("package_id", packageId);

  if (!citations?.length) return [];

  const candidates: CandidateInput[] = [];

  for (const cit of citations) {
    const { data: evidence } = await sb
      .from("knowledge_evidence")
      .select("excerpt")
      .eq("citation_id", cit.id);

    const excerpts = (evidence ?? []).map((e) => e.excerpt).filter(Boolean);
    const description = excerpts.length > 0 ? excerpts.join(". ") : cit.source_name;

    candidates.push({
      id: uuidv4(),
      title: cit.source_name,
      description,
      sourceUrl: cit.source_url,
      discoveryRunId: cit.id,
      adapterName: cit.adapter_name,
      sourceSlug: cit.adapter_name,
      sourceAuthority: (cit.source_authority as CandidateInput["sourceAuthority"]) ?? "community",
      metadata: { domain: null, rebuiltFromPackage: packageId },
    });
  }

  const { data: facts } = await sb
    .from("knowledge_facts")
    .select("statement, domain")
    .eq("package_id", packageId);

  if (facts?.length && candidates.length === 1 && (candidates[0].description?.length ?? 0) < 200) {
    const domain = facts.find((f) => f.domain)?.domain ?? null;
    candidates[0].metadata = { ...candidates[0].metadata, domain };
  }

  return candidates;
}

/** Merge additional asset candidates with package-rebuilt candidates (dedupe by URL). */
export function mergeCandidateSets(...sets: CandidateInput[][]): CandidateInput[] {
  const byUrl = new Map<string, CandidateInput>();

  for (const set of sets) {
    for (const c of set) {
      const key = c.sourceUrl ?? c.title;
      const existing = byUrl.get(key);
      if (!existing) {
        byUrl.set(key, c);
      } else {
        existing.description = [existing.description, c.description].filter(Boolean).join("\n\n");
      }
    }
  }

  return Array.from(byUrl.values());
}
