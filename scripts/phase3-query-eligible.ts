/**
 * Query eligible packages for Phase 3 operational validation.
 */
import * as dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

import { createClient } from "@supabase/supabase-js";

async function main() {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: packages, error } = await sb
    .from("knowledge_packages")
    .select("id, slug, fact_count, status, topic_id")
    .gte("fact_count", 8)
    .eq("status", "ready")
    .order("fact_count", { ascending: false });

  if (error) throw error;
  console.log("Total eligible:", packages?.length ?? 0);

  const topicIds = [...new Set((packages ?? []).map((p) => p.topic_id).filter(Boolean))];
  let topics: Record<string, { slug: string; title: string; domain?: string }> = {};
  if (topicIds.length > 0) {
    const { data: topicRows } = await sb
      .from("topics")
      .select("id, slug, title, domain")
      .in("id", topicIds);
    for (const t of topicRows ?? []) {
      topics[t.id] = { slug: t.slug, title: t.title, domain: t.domain };
    }
  }

  const enriched = (packages ?? []).map((p) => ({
    ...p,
    topic: p.topic_id ? topics[p.topic_id] : null,
    url: p.topic_id && topics[p.topic_id]
      ? `https://valendiro.com/en/topics/${topics[p.topic_id].slug}`
      : `https://valendiro.com/en/topics/${p.slug}`,
  }));

  // Group by domain hints
  const domains = ["technology", "finance", "travel", "health", "business"];
  const selected: typeof enriched = [];
  const used = new Set<string>();

  for (const domain of domains) {
    const match = enriched.find(
      (p) =>
        !used.has(p.id) &&
        (p.slug?.toLowerCase().includes(domain) ||
          p.topic?.domain?.toLowerCase().includes(domain) ||
          p.topic?.slug?.toLowerCase().includes(domain) ||
          p.topic?.title?.toLowerCase().includes(domain))
    );
    if (match) {
      selected.push(match);
      used.add(match.id);
    }
  }

  // Fill remaining from top fact_count if domain match failed
  for (const p of enriched) {
    if (selected.length >= 5) break;
    if (!used.has(p.id)) {
      selected.push(p);
      used.add(p.id);
    }
  }

  // Get current rendered outputs
  for (const p of selected) {
    const { data: outputs } = await sb
      .from("rendered_outputs")
      .select("id, renderer_id, projection_version, composition_score, quality_score, status, created_at")
      .eq("package_id", p.id)
      .neq("status", "stale")
      .order("created_at", { ascending: false })
      .limit(1);
    (p as Record<string, unknown>).currentOutput = outputs?.[0] ?? null;
  }

  console.log(JSON.stringify({ selected, allCount: enriched.length, sample: enriched.slice(0, 10) }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
