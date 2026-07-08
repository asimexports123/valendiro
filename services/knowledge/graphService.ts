/**
 * @architecture-frozen — Canonical Knowledge Graph Writer. See docs/ARCHITECTURE_FROZEN.md
 * The ONLY module allowed to INSERT/UPDATE knowledge_graph_nodes in production.
 * Edge writes to knowledge_graph_edges also go through this module.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { EntityKnowledgeService } from "@/services/discovery/entityKnowledgeService";

export function toGraphSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export interface GraphNodeRef {
  id: string;
  name: string;
  slug: string;
}

export async function upsertGraphNode(
  name: string,
  nodeType: string,
  options?: { description?: string; metadata?: Record<string, unknown> }
): Promise<GraphNodeRef> {
  const sb = createAdminClient();
  const slug = toGraphSlug(name);

  const { data: existing } = await sb
    .from("knowledge_graph_nodes")
    .select("id, name, slug, article_count")
    .eq("slug", slug)
    .maybeSingle();

  if (existing) {
    await sb
      .from("knowledge_graph_nodes")
      .update({
        article_count: (existing.article_count ?? 0) + 1,
        last_updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    return { id: existing.id, name: existing.name, slug: existing.slug };
  }

  const { data, error } = await sb
    .from("knowledge_graph_nodes")
    .insert({
      node_type: nodeType,
      name,
      slug,
      description: options?.description ?? `${name} — knowledge entity`,
      article_count: 1,
      last_updated_at: new Date().toISOString(),
      metadata: options?.metadata ?? {
        entity_knowledge: {
          overview: `${name} is referenced in published knowledge on Valendiro.`,
          facts: [],
          relationships: [],
          knowledge_version: 1,
          last_knowledge_update: new Date().toISOString(),
        },
      },
    })
    .select("id, name, slug")
    .single();

  if (error || !data) {
    throw new Error(`Failed to create graph node: ${error?.message}`);
  }

  return data;
}

export async function upsertGraphNodeWithId(row: {
  id: string;
  name: string;
  slug: string;
  node_type: string;
  description?: string;
  confidence_score?: number;
}): Promise<GraphNodeRef> {
  const sb = createAdminClient();
  const { data: existing } = await sb
    .from("knowledge_graph_nodes")
    .select("id, name, slug, article_count")
    .eq("slug", row.slug)
    .maybeSingle();

  if (existing) {
    await sb
      .from("knowledge_graph_nodes")
      .update({
        article_count: (existing.article_count ?? 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
    return { id: existing.id, name: existing.name, slug: existing.slug };
  }

  const { data, error } = await sb
    .from("knowledge_graph_nodes")
    .insert({
      id: row.id,
      node_type: row.node_type,
      name: row.name,
      slug: row.slug,
      description: row.description ?? "",
      confidence_score: row.confidence_score,
      article_count: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select("id, name, slug")
    .single();

  if (error || !data) {
    throw new Error(`Failed to create graph node: ${error?.message}`);
  }

  return data;
}

export async function updateGraphNodeMetadata(
  entityId: string,
  metadata: Record<string, unknown>
): Promise<void> {
  const sb = createAdminClient();
  const { error } = await sb
    .from("knowledge_graph_nodes")
    .update({ metadata, updated_at: new Date().toISOString() })
    .eq("id", entityId);
  if (error) throw new Error(`Failed to update graph node metadata: ${error.message}`);
}

export async function upsertGraphEdge(
  sourceId: string,
  targetId: string,
  edgeType: string,
  sourceDiscoveryId: string | null,
  weight = 0.8
): Promise<void> {
  const sb = createAdminClient();

  // FK references discovered_content — knowledge_assets IDs are not valid here
  let validDiscoveryId: string | null = null;
  if (sourceDiscoveryId) {
    const { data: dc } = await sb
      .from("discovered_content")
      .select("id")
      .eq("id", sourceDiscoveryId)
      .maybeSingle();
    validDiscoveryId = dc?.id ?? null;
  }

  const { data: existing } = await sb
    .from("knowledge_graph_edges")
    .select("id, weight")
    .eq("source_id", sourceId)
    .eq("target_id", targetId)
    .eq("edge_type", edgeType)
    .maybeSingle();

  if (existing) {
    await sb
      .from("knowledge_graph_edges")
      .update({
        weight: (existing.weight + weight) / 2,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
    return;
  }

  const { error } = await sb.from("knowledge_graph_edges").insert({
    source_id: sourceId,
    target_id: targetId,
    edge_type: edgeType,
    weight,
    source_discovery_id: validDiscoveryId,
  });

  if (error) throw new Error(`Failed to create graph edge: ${error.message}`);
}

function extractEntityNames(facts: { statement: string; tags: string[] | null }[]): string[] {
  const names = new Set<string>();
  const stopSlugs = new Set(["what", "how", "why", "when", "where", "here", "they", "need", "protocol"]);

  for (const fact of facts) {
    for (const tag of fact.tags ?? []) {
      if (tag.length > 2 && tag.length < 60 && !stopSlugs.has(tag)) {
        names.add(tag.replace(/-/g, " "));
      }
    }
  }

  return [...names].slice(0, 12);
}

export async function projectPackageToGraph(
  packageId: string,
  topicId: string,
  articleContent: string
): Promise<{ nodes: number; edges: number }> {
  const sb = createAdminClient();
  const entityService = new EntityKnowledgeService();

  const { data: facts } = await sb
    .from("knowledge_facts")
    .select("id, statement, tags")
    .eq("package_id", packageId);

  if (!facts || facts.length === 0) {
    return { nodes: 0, edges: 0 };
  }

  const entityNames = extractEntityNames(facts);
  const nodeMap = new Map<string, GraphNodeRef>();

  for (const name of entityNames) {
    const node = await upsertGraphNode(name, "entity");
    nodeMap.set(name.toLowerCase(), node);
  }

  const { data: pkg } = await sb
    .from("knowledge_packages")
    .select("slug, topic_id")
    .eq("id", packageId)
    .single();

  if (pkg?.slug) {
    const topicNode = await upsertGraphNode(pkg.slug.replace(/-/g, " "), "topic");
    nodeMap.set(pkg.slug.toLowerCase(), topicNode);

    for (const [, entityNode] of nodeMap) {
      if (entityNode.id !== topicNode.id) {
        await upsertGraphEdge(topicNode.id, entityNode.id, "related", topicId);
      }
    }
  }

  const entities = [...nodeMap.values()].map((n) => ({
    id: n.id,
    name: n.name,
    slug: n.slug,
  }));

  if (entities.length > 0) {
    // Use package facts for entity knowledge, not raw HTML article content
    const factStatements = facts.map((f) => f.statement).filter(Boolean).join("\n");
    await entityService.processEntitiesFromArticle(topicId, entities, factStatements || articleContent);
  }

  return { nodes: nodeMap.size, edges: Math.max(0, nodeMap.size - 1) };
}

/** @deprecated Legacy discovered_content path — delegates to canonical writer */
export async function upsertLegacyGraphNode(name: string, type: string): Promise<string> {
  const node = await upsertGraphNode(name, type);
  return node.id;
}
