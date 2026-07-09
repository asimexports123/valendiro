/**
 * Phase 2 production trace — IDs at every pipeline stage.
 */
import * as dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const { count: kaCount } = await sb
    .from("knowledge_assets")
    .select("*", { count: "exact", head: true });
  const { count: viewCount } = await sb
    .from("discovered_articles")
    .select("*", { count: "exact", head: true });

  const { data: statuses } = await sb.from("knowledge_assets").select("status");
  const breakdown: Record<string, number> = {};
  for (const r of statuses ?? []) breakdown[r.status] = (breakdown[r.status] ?? 0) + 1;

  const { data: all } = await sb
    .from("knowledge_assets")
    .select("id,schema_version,asset_kind,provenance,payload,labels");
  let fieldOk = 0;
  for (const r of all ?? []) {
    if (r.schema_version && r.asset_kind && r.provenance && r.payload && r.labels) fieldOk++;
  }

  const { data: recentAccepted } = await sb
    .from("knowledge_assets")
    .select("id,title,url,status,updated_at,provenance")
    .eq("status", "accepted")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let trace: Record<string, unknown> = {
    counts: { knowledge_assets: kaCount, discovered_articles_view: viewCount, parity: kaCount === viewCount },
    status_breakdown: breakdown,
    field_completeness: { total: all?.length, complete: fieldOk },
    write_target: "knowledge_assets only (runtime services/jobs/app use KNOWLEDGE_ASSET_TABLE)",
  };

  if (recentAccepted) {
    const assetId = recentAccepted.id;
    const { data: dat } = await sb
      .from("discovered_article_topics")
      .select("topic_id,confidence,mapping_method")
      .eq("discovered_article_id", assetId);
    const topicId = dat?.[0]?.topic_id;
    const { data: topic } = topicId
      ? await sb.from("topics").select("id,slug,status,knowledge_package_id").eq("id", topicId).single()
      : { data: null };

    let pkg = null;
    let graph: unknown[] = [];
    let rendered: unknown = null;
    let translation: unknown = null;

    if (topic?.knowledge_package_id) {
      const { data: p } = await sb
        .from("knowledge_packages")
        .select("id,slug,status,version,created_at")
        .eq("id", topic.knowledge_package_id)
        .single();
      pkg = p;
      const { data: g } = await sb
        .from("knowledge_graph_nodes")
        .select("id,node_type,name,source_asset_id,package_id")
        .eq("package_id", topic.knowledge_package_id)
        .limit(5);
      graph = g ?? [];
      const { data: ro } = await sb
        .from("rendered_outputs")
        .select("id,status,render_duration_ms,created_at")
        .eq("package_id", topic.knowledge_package_id)
        .order("created_at", { ascending: false })
        .limit(1);
      rendered = ro?.[0] ?? null;
    }
    if (topicId) {
      const { data: tt } = await sb
        .from("topic_translations")
        .select("id,canonical_url,status,language")
        .eq("topic_id", topicId)
        .limit(1);
      translation = tt?.[0] ?? null;
    }

    trace.canonical_pipeline = {
      rss_source: { id: "90d74491-7235-4ab6-83a7-cf2efeca4974", name: "TechCrunch Test", type: "rss" },
      knowledge_asset: { id: assetId, status: recentAccepted.status, url: recentAccepted.url, title: recentAccepted.title },
      verification: { status: recentAccepted.status },
      topic_link: dat,
      topic: topic ? { id: topic.id, slug: topic.slug, status: topic.status } : null,
      knowledge_package: pkg,
      knowledge_graph_nodes: graph,
      rendered_output: rendered,
      topic_translation: translation,
      live_topic_url: topic?.slug ? `https://valendiro.com/en/topics/${topic.slug}` : null,
    };
  }

  const { data: newestIngested } = await sb
    .from("knowledge_assets")
    .select("id,title,provenance,schema_version,asset_kind,created_at")
    .not("provenance->>connector_type", "eq", "legacy")
    .order("created_at", { ascending: false })
    .limit(3);

  trace.newest_rss_ingested = newestIngested;

  console.log(JSON.stringify(trace, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
