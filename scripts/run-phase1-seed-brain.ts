/**
 * Phase-1 seed pipeline — seed DB topics then brain publish (single pipeline).
 *
 *   npx tsx scripts/run-phase1-seed-brain.ts
 *   npx tsx scripts/run-phase1-seed-brain.ts --limit=10 --skip-seed
 */
import * as dotenv from "dotenv";
import { resolve } from "path";
import { execSync } from "child_process";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

import { getTopPhase1SeedSlugs } from "../config/phase1SeedTopics";
import { gatherCatalogFuelForWeakTopics } from "../services/discovery/catalogFuelGatherer";
import { publishOriginalCatalogBatch } from "../services/discovery/catalogOriginalPublish";
import { clearTopicIndexCache } from "../services/discovery/topicResolver";

const limitArg = process.argv.find((a) => a.startsWith("--limit="));
const publishLimit = limitArg ? Number(limitArg.split("=")[1]) : 10;
const skipSeed = process.argv.includes("--skip-seed");
const skipFuel = process.argv.includes("--skip-fuel");

async function main() {
  process.env.ALLOW_RENDER = "true";
  process.env.BRAIN_AUTO_PUBLISH = "true";
  const start = Date.now();

  const topSeeds = getTopPhase1SeedSlugs(publishLimit);
  console.log(`Top ${publishLimit} seed targets:\n  ${topSeeds.join("\n  ")}\n`);

  if (!skipSeed) {
    console.log("[1/3] Seeding missing Phase-1 topics...");
    execSync("npx tsx scripts/seed-phase1-brain-topics.ts", {
      stdio: "inherit",
      cwd: process.cwd(),
    });
  }

  if (!skipFuel) {
    console.log("\n[2/3] Gap-driven fuel gather...");
    const fuel = await gatherCatalogFuelForWeakTopics({ topicLimit: Math.max(publishLimit * 2, 15) });
    console.log(
      `  topics=${fuel.topicsProcessed} fuel=${fuel.fuelGathered} skipped=${fuel.skipped} dup=${fuel.duplicates}`
    );
    clearTopicIndexCache();
  }

  console.log(`\n[3/3] Brain publish (seedOnly, limit=${publishLimit})...`);
  const pub = await publishOriginalCatalogBatch(publishLimit, { seedOnly: true });
  console.log(`  published=${pub.published} skipped=${pub.skipped} failed=${pub.failed}`);

  for (const r of pub.results) {
    const tag =
      r.status === "published" ? "✓" : r.status === "ready" ? "◐" : r.status === "failed" ? "✗" : "–";
    const metrics =
      r.wordCount != null
        ? ` ${r.wordCount} words, internal ${r.internalScore ?? "?"}${r.qualityScore != null ? `, render ${r.qualityScore}` : ""}`
        : "";
    const reason = r.reason ? ` — ${r.reason}` : "";
    console.log(`  ${tag} ${r.topicSlug}:${metrics}${reason}`);
  }

  console.log(`\nDone in ${((Date.now() - start) / 1000).toFixed(1)}s`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
