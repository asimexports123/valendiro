/**
 * Knowledge Engine Proof — measure autonomous pipeline health.
 */
import * as dotenv from "dotenv";
import { resolve } from "path";
import { writeFileSync, mkdirSync } from "fs";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

import { createAdminClient } from "../lib/supabase/admin";
import { resolveArticleToCatalogTopics, findThinTopics } from "../services/discovery/topicResolver";
import { enrichThinCatalog } from "../services/discovery/catalogEnrichment";
import { processArticlePipelineBatch } from "../services/discovery/articlePipeline";

async function main() {
  const sb = createAdminClient();
  mkdirSync("temp", { recursive: true });

  const { count: pendingAssets } = await sb
    .from("knowledge_assets")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  const { count: mappings } = await sb
    .from("discovered_article_topics")
    .select("*", { count: "exact", head: true });

  const thin = await findThinTopics(30);

  // Test resolver on sample RSS-like titles
  const resolverTests = [
    { title: "Understanding Index Funds for Beginners", expect: "index-funds" },
    { title: "Node.js Cluster Module Guide", expect: "nodejs-cluster" },
    { title: "Health Insurance Plans Explained", expect: "health-insurance" },
    { title: "Git Version Control Basics", expect: "git-version-control" },
  ];

  const resolverResults = [];
  for (const test of resolverTests) {
    const matches = await resolveArticleToCatalogTopics({ title: test.title });
    resolverResults.push({
      input: test.title,
      expected: test.expect,
      matched: matches[0]?.topic.slug ?? null,
      confidence: matches[0]?.confidence ?? 0,
      hit: matches.some((m) => m.topic.slug === test.expect),
    });
  }

  process.env.ALLOW_RENDER = "true";

  console.log("Running article pipeline batch...");
  const pipeline = await processArticlePipelineBatch(5);

  console.log("Running catalog enrichment...");
  const enrichment = await enrichThinCatalog(10);

  const report = {
    timestamp: new Date().toISOString(),
    pendingAssets: pendingAssets ?? 0,
    articleTopicMappings: mappings ?? 0,
    thinTopics: thin.length,
    thinnest: thin.slice(0, 5).map((t) => ({ slug: t.slug, words: t.wordCount, facts: t.factCount })),
    resolverTests: resolverResults,
    resolverHitRate: `${resolverResults.filter((r) => r.hit).length}/${resolverResults.length}`,
    pipeline,
    enrichment: {
      enriched: enrichment.enriched,
      skipped: enrichment.skipped,
      failed: enrichment.failed,
      wins: enrichment.results.filter((r) => r.status === "enriched"),
    },
  };

  writeFileSync("temp/knowledge-engine-proof.json", JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
