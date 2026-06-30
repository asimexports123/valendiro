/**
 * Knowledge Pack Builder — Phase 2A
 *
 * Assembles a complete KnowledgePack from the Research Engine output.
 * Persists it to the database so the writer can fetch it by ID.
 *
 * The KnowledgePack is the single source of truth for the LLM Writer.
 * The writer MUST NOT receive a raw keyword — only a KnowledgePack.
 *
 * Schema: knowledge_packs table (created by migration below)
 *
 * CREATE TABLE IF NOT EXISTS knowledge_packs (
 *   id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   keyword         TEXT NOT NULL,
 *   category_slug   TEXT NOT NULL,
 *   topic_id        UUID REFERENCES topics(id),
 *   article_queue_id UUID REFERENCES content_generation_queue(id),
 *   pack_data       JSONB NOT NULL,
 *   status          TEXT NOT NULL DEFAULT 'ready',   -- ready | used | archived
 *   created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
 *   updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
 * );
 */

import { createAdminClient } from "@/lib/supabase/admin";
import type { ResearchPackRaw } from "./researchEngine";
import type { ArticleOutline } from "./outlinePlanner";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface KnowledgePack {
  id: string;
  keyword: string;
  categorySlug: string;
  categoryLabel: string;
  searchIntent: string;

  // Research content
  definition: string;
  domain: string;
  coreConceptsSummary: string;
  entities: {
    name: string;
    type: string;
    relevance: string;
    description: string;
  }[];
  relationships: {
    relatedTerm: string;
    relationshipType: string;
    explanation: string;
  }[];
  faqs: {
    question: string;
    answer: string;
    searchIntent: string;
  }[];
  examples: {
    title: string;
    scenario: string;
    outcome: string;
    domain: string;
  }[];
  tableOpportunities: {
    title: string;
    columns: string[];
    purpose: string;
  }[];
  internalLinkSignals: {
    suggestedTitle: string;
    suggestedSlug: string;
    linkType: string;
    hierarchyLevel: string;
  }[];
  imageSuggestions: {
    type: string;
    description: string;
    altText: string;
    searchQuery: string;
  }[];
  statistics: string[];
  commonMistakes: string[];

  // Outline (set after outline planner runs)
  outline: ArticleOutline | null;

  // Metadata
  topicId: string | null;
  articleQueueId: string | null;
  status: "ready" | "used" | "archived";
  createdAt: string;
}

export interface KnowledgePackBuildResult {
  pack: KnowledgePack;
  persisted: boolean;
  packId: string;
  error: string | null;
}

// ─── Core Concepts Summary Generator ─────────────────────────────────────────

function buildCoreConceptsSummary(research: ResearchPackRaw): string {
  const entityNames = research.entities
    .filter((e) => e.relevance === "primary")
    .map((e) => e.name)
    .slice(0, 3)
    .join(", ");

  const relatedTerms = research.relationships
    .slice(0, 2)
    .map((r) => r.relatedTerm)
    .join(" and ");

  const parts: string[] = [];

  parts.push(research.concept.definition);

  if (entityNames) {
    parts.push(`Key components include ${entityNames}.`);
  }

  if (relatedTerms) {
    parts.push(`This topic connects closely to ${relatedTerms}.`);
  }

  if (research.commonMistakes.length > 0) {
    parts.push(`Common pitfalls include: ${research.commonMistakes[0]}`);
  }

  return parts.join(" ");
}

// ─── Assemble Pack ────────────────────────────────────────────────────────────

export function assembleKnowledgePack(
  research: ResearchPackRaw,
  topicId: string | null = null,
  articleQueueId: string | null = null
): Omit<KnowledgePack, "id" | "createdAt"> {
  return {
    keyword: research.keyword,
    categorySlug: research.categorySlug,
    categoryLabel: research.categoryLabel,
    searchIntent: research.searchIntent,
    definition: research.concept.definition,
    domain: research.concept.domain,
    coreConceptsSummary: buildCoreConceptsSummary(research),
    entities: research.entities,
    relationships: research.relationships,
    faqs: research.faqs,
    examples: research.examples,
    tableOpportunities: research.tableOpportunities,
    internalLinkSignals: research.internalLinkSignals,
    imageSuggestions: research.imageSuggestions,
    statistics: research.statistics,
    commonMistakes: research.commonMistakes,
    outline: null,
    topicId,
    articleQueueId,
    status: "ready",
  };
}

// ─── Persist to DB ────────────────────────────────────────────────────────────

export async function persistKnowledgePack(
  pack: Omit<KnowledgePack, "id" | "createdAt">
): Promise<{ packId: string; error: string | null }> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("knowledge_packs")
    .insert({
      keyword: pack.keyword,
      category_slug: pack.categorySlug,
      topic_id: pack.topicId ?? null,
      article_queue_id: pack.articleQueueId ?? null,
      pack_data: pack,
      status: "ready",
    })
    .select("id")
    .single();

  if (error || !data) {
    return { packId: "", error: error?.message ?? "Failed to persist knowledge pack" };
  }

  return { packId: data.id, error: null };
}

// ─── Fetch Pack ───────────────────────────────────────────────────────────────

export async function fetchKnowledgePack(packId: string): Promise<KnowledgePack | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("knowledge_packs")
    .select("id, pack_data, created_at")
    .eq("id", packId)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    ...(data.pack_data as Omit<KnowledgePack, "id" | "createdAt">),
    createdAt: data.created_at,
  };
}

export async function fetchKnowledgePackForQueue(articleQueueId: string): Promise<KnowledgePack | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("knowledge_packs")
    .select("id, pack_data, created_at")
    .eq("article_queue_id", articleQueueId)
    .eq("status", "ready")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    ...(data.pack_data as Omit<KnowledgePack, "id" | "createdAt">),
    createdAt: data.created_at,
  };
}

export async function markPackAsUsed(packId: string): Promise<void> {
  const supabase = createAdminClient();
  await supabase.from("knowledge_packs").update({ status: "used" }).eq("id", packId);
}

// ─── Main: Build + Persist ────────────────────────────────────────────────────

export async function buildAndPersistKnowledgePack(
  research: ResearchPackRaw,
  topicId: string | null = null,
  articleQueueId: string | null = null
): Promise<KnowledgePackBuildResult> {
  const assembled = assembleKnowledgePack(research, topicId, articleQueueId);
  const { packId, error } = await persistKnowledgePack(assembled);

  if (error) {
    // Return in-memory pack even if DB persist fails — pipeline can continue
    return {
      pack: { ...assembled, id: "in-memory", createdAt: new Date().toISOString() },
      persisted: false,
      packId: "in-memory",
      error,
    };
  }

  return {
    pack: { ...assembled, id: packId, createdAt: new Date().toISOString() },
    persisted: true,
    packId,
    error: null,
  };
}
