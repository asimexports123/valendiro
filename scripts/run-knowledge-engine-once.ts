import * as dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(process.cwd(), ".env.local") });
process.env.ALLOW_RENDER = "true";

import { createDiscoveryScheduler } from "../jobs/schedulers/discoveryScheduler";
import { enrichThinCatalog } from "../services/discovery/catalogEnrichment";

async function main() {
  const scheduler = await createDiscoveryScheduler();
  console.log("Ingesting from educational sources...");
  const discovery = await scheduler.runScheduledDiscoveries();
  const saved = discovery.reduce((s, r) => s + r.articlesSaved, 0);
  console.log(`Saved ${saved} new articles from ${discovery.length} sources`);

  console.log("Processing pipeline...");
  const pipeline = await scheduler.processDiscoveredArticles(15);
  console.log("Pipeline:", pipeline);

  console.log("Enriching thin catalog...");
  const enrichment = await enrichThinCatalog(10);
  console.log("Enrichment:", {
    enriched: enrichment.enriched,
    wins: enrichment.results.filter((r) => r.status === "enriched"),
  });
}

main();
