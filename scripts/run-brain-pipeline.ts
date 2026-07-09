/**
 * Run catalog brain pipeline locally (fuel gather + publish batch).
 *   npx tsx scripts/run-brain-pipeline.ts
 *   npx tsx scripts/run-brain-pipeline.ts --limit 10
 */
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

import { createDiscoveryScheduler } from "../jobs/schedulers/discoveryScheduler";
import { gatherCatalogFuelForWeakTopics } from "../services/discovery/catalogFuelGatherer";
import { publishOriginalCatalogBatch } from "../services/discovery/catalogOriginalPublish";
import { clearTopicIndexCache } from "../services/discovery/topicResolver";

const limitArg = process.argv.find((a) => a.startsWith("--limit="));
const publishLimit = limitArg ? Number(limitArg.split("=")[1]) : 8;
const fuelLimit = Math.max(publishLimit, 8);
const skipRss = process.argv.includes("--skip-rss");

async function main() {
  process.env.ALLOW_RENDER = "true";
  const start = Date.now();

  if (!skipRss) {
    console.log("[0/3] RSS ingest...");
    const scheduler = await createDiscoveryScheduler();
    const discoveryResults = await scheduler.runScheduledDiscoveries();
    const articlesSaved = discoveryResults.reduce((sum, r) => sum + r.articlesSaved, 0);
    console.log(`  sources=${discoveryResults.length} fuelSaved=${articlesSaved}`);
    await scheduler.processDiscoveredArticles(25);
  }

  console.log(`[1/3] Gap-driven fuel gather (topicLimit=${fuelLimit})...`);
  const fuel = await gatherCatalogFuelForWeakTopics({ topicLimit: fuelLimit });
  console.log(
    `  topics=${fuel.topicsProcessed} fuel=${fuel.fuelGathered} skipped=${fuel.skipped} dup=${fuel.duplicates}`
  );

  clearTopicIndexCache();
  console.log(`[2/3] Catalog brain publish (limit=${publishLimit})...`);
  const pub = await publishOriginalCatalogBatch(publishLimit);
  console.log(`  published=${pub.published} skipped=${pub.skipped} failed=${pub.failed}`);

  for (const r of pub.results) {
    const tag = r.status === "published" ? "✓" : r.status === "failed" ? "✗" : "–";
    console.log(`  ${tag} ${r.topicSlug}: ${r.reason ?? r.wordCount + " words" ?? r.status}`);
  }

  console.log(`Done in ${((Date.now() - start) / 1000).toFixed(1)}s`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
