/**
 * Canonical entity hub data — production read path.
 * Facts/packages/sources come from knowledge_facts + graph edges, not placeholders.
 */

import { createAdminClient } from "@/lib/supabase/admin";

const JUNK_SLUGS = new Set([
  "what",
  "how",
  "why",
  "when",
  "where",
  "here",
  "they",
  "need",
  "protocol",
  "users",
  "users-don",
  "need-more-tools",
  "they-need-seamless-integrations",
]);

function slugToTitle(slug: string) {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function isQualityEntitySlug(slug: string): boolean {
  if (!slug || slug.length < 3) return false;
  if (JUNK_SLUGS.has(slug)) return false;
  if (/^\d+$/.test(slug)) return false;
  return true;
}

export interface EntityHubRelated {
  name: string;
  slug: string;
  type: string;
  relationship: string;
  direction: "outgoing" | "incoming";
}

export interface EntityHubArticle {
  id: string;
  slug: string;
  title: string;
  updatedAt: string;
}

export interface EntityHubPackage {
  id: string;
  slug: string;
  status: string;
  factCount: number;
}

export interface EntityHubSource {
  id: string;
  sourceName: string;
  sourceUrl: string | null;
  packageSlug: string;
}

export interface EntityHubData {
  entity: {
    id: string;
    name: string;
    slug: string;
    nodeType: string;
    description: string | null;
    createdAt: string;
    lastUpdatedAt: string | null;
  };
  facts: string[];
  sources: EntityHubSource[];
  relatedEntities: EntityHubRelated[];
  relatedTopics: EntityHubRelated[];
  latestArticles: EntityHubArticle[];
  knowledgePackages: EntityHubPackage[];
  statistics: {
    articleCount: number;
    relationshipCount: number;
    factCount: number;
    sourceCount: number;
    packageCount: number;
    confidenceScore: number;
    knowledgeVersion: number;
    lastKnowledgeUpdate: string | null;
  };
  overview: string | null;
  latestNewsSummary: string | null;
}

function computeConfidence(factCount: number, sourceCount: number, relationshipCount: number): number {
  if (factCount === 0 && sourceCount === 0 && relationshipCount === 0) return 0;
  let score = 20;
  score += Math.min(factCount * 4, 40);
  score += Math.min(sourceCount * 8, 24);
  score += Math.min(relationshipCount * 2, 16);
  return Math.min(100, Math.round(score));
}

export async function getEntityHubData(slug: string): Promise<EntityHubData | null> {
  const sb = createAdminClient();

  const { data: entity, error: entityError } = await sb
    .from("knowledge_graph_nodes")
    .select("id, name, slug, node_type, description, confidence_score, article_count, metadata, created_at, last_updated_at, updated_at")
    .eq("slug", slug)
    .maybeSingle();

  if (entityError || !entity) return null;

  const entityKnowledge = (entity.metadata as { entity_knowledge?: Record<string, unknown> })?.entity_knowledge ?? {};

  // Bidirectional graph edges (canonical pipeline stores topic → entity)
  const { data: outEdges } = await sb
    .from("knowledge_graph_edges")
    .select("id, source_id, target_id, edge_type")
    .eq("source_id", entity.id)
    .limit(30);

  const { data: inEdges } = await sb
    .from("knowledge_graph_edges")
    .select("id, source_id, target_id, edge_type")
    .eq("target_id", entity.id)
    .limit(30);

  const edgePairs: { nodeId: string; relationship: string; direction: "outgoing" | "incoming" }[] = [];
  for (const e of outEdges ?? []) {
    if (e.target_id) edgePairs.push({ nodeId: e.target_id, relationship: e.edge_type || "related", direction: "outgoing" });
  }
  for (const e of inEdges ?? []) {
    if (e.source_id) edgePairs.push({ nodeId: e.source_id, relationship: e.edge_type || "related", direction: "incoming" });
  }

  const neighborIds = [...new Set(edgePairs.map((p) => p.nodeId))];
  let neighborNodes: { id: string; name: string; slug: string; node_type: string }[] = [];
  if (neighborIds.length > 0) {
    const { data: nodes } = await sb
      .from("knowledge_graph_nodes")
      .select("id, name, slug, node_type")
      .in("id", neighborIds);
    neighborNodes = nodes ?? [];
  }

  const relatedEntities: EntityHubRelated[] = [];
  const relatedTopics: EntityHubRelated[] = [];

  for (const pair of edgePairs) {
    const node = neighborNodes.find((n) => n.id === pair.nodeId);
    if (!node || !isQualityEntitySlug(node.slug)) continue;
    if (node.slug === slug) continue;

    const rel: EntityHubRelated = {
      name: node.name || slugToTitle(node.slug),
      slug: node.slug,
      type: node.node_type || "entity",
      relationship: pair.relationship,
      direction: pair.direction,
    };

    if (node.node_type === "topic") {
      relatedTopics.push(rel);
    } else {
      relatedEntities.push(rel);
    }
  }

  // Canonical facts: knowledge_facts tagged with this entity slug
  const { data: factRows } = await sb
    .from("knowledge_facts")
    .select("id, statement, package_id, tags")
    .contains("tags", [slug])
    .limit(100);

  const packageIds = [...new Set((factRows ?? []).map((f) => f.package_id).filter(Boolean))] as string[];

  let knowledgePackages: EntityHubPackage[] = [];
  if (packageIds.length > 0) {
    const { data: packages } = await sb
      .from("knowledge_packages")
      .select("id, slug, status, fact_count")
      .in("id", packageIds)
      .order("fact_count", { ascending: false })
      .limit(12);

    knowledgePackages = (packages ?? []).map((p) => ({
      id: p.id,
      slug: p.slug,
      status: p.status,
      factCount: p.fact_count ?? 0,
    }));
  }

  // Sources from citations on related packages
  const sources: EntityHubSource[] = [];
  if (packageIds.length > 0) {
    const { data: citations } = await sb
      .from("knowledge_citations")
      .select("id, source_name, source_url, package_id")
      .in("package_id", packageIds)
      .limit(20);

    const pkgSlugMap = new Map(knowledgePackages.map((p) => [p.id, p.slug]));

    for (const c of citations ?? []) {
      sources.push({
        id: c.id,
        sourceName: c.source_name || "Source",
        sourceUrl: c.source_url,
        packageSlug: pkgSlugMap.get(c.package_id) ?? "unknown",
      });
    }
  }

  // Facts: prefer clean knowledge_facts statements; fallback to metadata if no DB facts
  const dbFacts = (factRows ?? [])
    .map((f) => f.statement?.trim())
    .filter((s): s is string => !!s && s.length > 10 && s.length < 500)
    .slice(0, 15);

  const metaFacts = Array.isArray(entityKnowledge.facts)
    ? (entityKnowledge.facts as string[]).filter((f) => typeof f === "string" && f.length > 10 && f.length < 500)
    : [];

  const facts = dbFacts.length > 0 ? dbFacts : metaFacts.slice(0, 15);

  // Articles: from related topic nodes + published topics mentioning entity
  const latestArticles: EntityHubArticle[] = [];
  const seenSlugs = new Set<string>();

  const topicSlugsFromGraph = relatedTopics.map((t) => t.slug);
  if (topicSlugsFromGraph.length > 0) {
    const { data: topics } = await sb
      .from("topics")
      .select("id, slug, updated_at, topic_translations(title)")
      .in("slug", topicSlugsFromGraph)
      .eq("status", "published")
      .eq("topic_translations.language_code", "en")
      .limit(10);

    for (const t of topics ?? []) {
      if (seenSlugs.has(t.slug)) continue;
      seenSlugs.add(t.slug);
      latestArticles.push({
        id: t.id,
        slug: t.slug,
        title: (t as { topic_translations?: { title: string }[] }).topic_translations?.[0]?.title ?? slugToTitle(t.slug),
        updatedAt: t.updated_at,
      });
    }
  }

  if (latestArticles.length < 10) {
    const { data: mentionTopics } = await sb
      .from("topics")
      .select("id, slug, updated_at, topic_translations(title)")
      .eq("status", "published")
      .eq("topic_translations.language_code", "en")
      .or(`slug.eq.${slug},content.ilike.%${entity.name}%`)
      .order("updated_at", { ascending: false })
      .limit(10);

    for (const t of mentionTopics ?? []) {
      if (seenSlugs.has(t.slug)) continue;
      seenSlugs.add(t.slug);
      latestArticles.push({
        id: t.id,
        slug: t.slug,
        title: (t as { topic_translations?: { title: string }[] }).topic_translations?.[0]?.title ?? slugToTitle(t.slug),
        updatedAt: t.updated_at,
      });
    }
  }

  const relationshipCount = relatedEntities.length + relatedTopics.length;
  const factCount = facts.length;
  const sourceCount = sources.length;
  const articleCount = latestArticles.length || entity.article_count || 0;
  const confidenceScore = computeConfidence(factCount, sourceCount, relationshipCount);

  const overview =
    typeof entityKnowledge.overview === "string" && entityKnowledge.overview.length > 20 && !entityKnowledge.overview.includes('com/">')
      ? entityKnowledge.overview
      : facts.length > 0
        ? facts.slice(0, 3).join(" ")
        : null;

  const latestNewsSummary =
    typeof entityKnowledge.latest_news_summary === "string" &&
    entityKnowledge.latest_news_summary.length > 20 &&
    !entityKnowledge.latest_news_summary.includes('com/">')
      ? entityKnowledge.latest_news_summary
      : null;

  return {
    entity: {
      id: entity.id,
      name: entity.name,
      slug: entity.slug,
      nodeType: entity.node_type || "entity",
      description: entity.description,
      createdAt: entity.created_at,
      lastUpdatedAt: entity.last_updated_at || entity.updated_at,
    },
    facts,
    sources,
    relatedEntities: relatedEntities.slice(0, 12),
    relatedTopics: relatedTopics.slice(0, 12),
    latestArticles: latestArticles.slice(0, 10),
    knowledgePackages,
    statistics: {
      articleCount,
      relationshipCount,
      factCount,
      sourceCount,
      packageCount: knowledgePackages.length,
      confidenceScore,
      knowledgeVersion: typeof entityKnowledge.knowledge_version === "number" ? entityKnowledge.knowledge_version : 1,
      lastKnowledgeUpdate:
        typeof entityKnowledge.last_knowledge_update === "string" ? entityKnowledge.last_knowledge_update : null,
    },
    overview,
    latestNewsSummary,
  };
}
