/** One-shot pipeline proof + ID linkage for Phase 2 production validation. */
import * as dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "fs";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  process.env.ALLOW_RENDER = "true";
  const report: Record<string, unknown> = {};

  const assetId = "7f4beea3-db8f-422d-b51f-d9af530bb189";
  const { data: asset } = await sb
    .from("knowledge_assets")
    .select("*")
    .eq("id", assetId)
    .single();

  const { data: pkgs } = await sb
    .from("knowledge_packages")
    .select("id,slug,status,version,topic_id,discovery_run_ids,created_at")
    .contains("discovery_run_ids", [assetId]);

  let pkg = pkgs?.[0] ?? null;
  if (!pkg) {
    const { data: bySlug } = await sb
      .from("knowledge_packages")
      .select("id,slug,status,version,topic_id,discovery_run_ids,created_at")
      .eq("id", "b99a2236-82ab-4a3d-8519-556de7662d62")
      .maybeSingle();
    pkg = bySlug;
  }
  let topic = null;
  let graph: unknown[] = [];
  let rendered = null;
  let translation = null;

  if (pkg) {
    if (pkg.topic_id) {
      const { data: t } = await sb.from("topics").select("*").eq("id", pkg.topic_id).single();
      topic = t;
    }
    const { data: g } = await sb
      .from("knowledge_graph_nodes")
      .select("id,node_type,name,source_asset_id,package_id")
      .eq("package_id", pkg.id)
      .limit(10);
    graph = g ?? [];
    const { data: ro } = await sb
      .from("rendered_outputs")
      .select("id,status,render_duration_ms,created_at")
      .eq("package_id", pkg.id)
      .order("created_at", { ascending: false })
      .limit(1);
    rendered = ro?.[0] ?? null;
    if (topic) {
      const { data: tt } = await sb
        .from("topic_translations")
        .select("id,canonical_url,status,language")
        .eq("topic_id", topic.id)
        .limit(1);
      translation = tt?.[0] ?? null;
    }
  }

  report.historical_accepted_flow = {
    rss_source_id: asset?.source_id,
    knowledge_asset_id: assetId,
    knowledge_asset_status: asset?.status,
    schema_version: asset?.schema_version,
    asset_kind: asset?.asset_kind,
    knowledge_package_id: pkg?.id,
    knowledge_package_slug: pkg?.slug,
    topic_id: topic?.id ?? pkg?.topic_id,
    topic_slug: topic?.slug,
    graph_node_ids: (graph as { id: string }[]).map((n) => n.id),
    rendered_output_id: (rendered as { id: string } | null)?.id,
    topic_translation_id: (translation as { id: string } | null)?.id,
    live_topic_url: topic?.slug ? `https://valendiro.com/en/topics/${topic.slug}` : null,
  };

  const { data: pending } = await sb
    .from("knowledge_assets")
    .select("id,title")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (pending) {
    const { processDiscoveredArticle } = await import("../services/discovery/articlePipeline");
    const t0 = Date.now();
    const result = await processDiscoveredArticle(pending.id);
    const ms = Date.now() - t0;
    const { data: after } = await sb
      .from("knowledge_assets")
      .select("id,status,rejection_reason")
      .eq("id", pending.id)
      .single();

    report.fresh_pipeline_attempt = {
      knowledge_asset_id: pending.id,
      title: pending.title,
      duration_ms: ms,
      result,
      final_status: after?.status,
      rejection_reason: after?.rejection_reason,
      cookies_error: result.error?.includes("cookies") ?? false,
    };

    if (result.success) {
      const { data: dat } = await sb
        .from("discovered_article_topics")
        .select("topic_id")
        .eq("discovered_article_id", pending.id);
      const tid = dat?.[0]?.topic_id;
      const { data: t2 } = tid
        ? await sb.from("topics").select("id,slug,knowledge_package_id").eq("id", tid).single()
        : { data: null };
      report.fresh_pipeline_attempt = {
        ...report.fresh_pipeline_attempt,
        topic_id: t2?.id,
        topic_slug: t2?.slug,
        knowledge_package_id: t2?.knowledge_package_id,
        live_topic_url: t2?.slug ? `https://valendiro.com/en/topics/${t2.slug}` : null,
      };
    }
  }

  writeFileSync("phase2-pipeline-proof.json", JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
