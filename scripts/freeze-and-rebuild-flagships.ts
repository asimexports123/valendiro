/**
 * Freeze dummy catalog + rebuild flagship topics from authority sources.
 *
 *   npx tsx scripts/freeze-and-rebuild-flagships.ts
 *   npx tsx scripts/freeze-and-rebuild-flagships.ts --freeze-only
 *   npx tsx scripts/freeze-and-rebuild-flagships.ts --rebuild-only --limit 5
 */

import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

import { exitLegacyPublishScript } from "./lib/legacyPublishRedirect";
exitLegacyPublishScript();

import { FLAGSHIP_TOPIC_SLUGS } from "../config/flagshipTopics";
import { freezeNonFlagshipCatalog, getCatalogVisibilityCounts } from "../services/catalog/topicCatalogService";
import { rebuildTopicFromAuthority } from "../services/learning/rebuildTopicFromAuthority";
import { createAdminClient } from "../lib/supabase/admin";

const args = process.argv.slice(2);
const freezeOnly = args.includes("--freeze-only");
const rebuildOnly = args.includes("--rebuild-only");
const limitIdx = args.indexOf("--limit");
const rebuildLimit = limitIdx >= 0 ? parseInt(args[limitIdx + 1] ?? "30", 10) : 30;

async function main() {
  console.log("\n=== FREEZE + FLAGSHIP REBUILD ===\n");

  if (!rebuildOnly) {
    console.log("Step 1: Freezing non-flagship published topics...");
    const before = await getCatalogVisibilityCounts();
    console.log("Before:", before);

    const freeze = await freezeNonFlagshipCatalog();
    console.log("\nFreeze report:");
    console.log(`  Total was published: ${freeze.totalPublished}`);
    console.log(`  Kept flagships:      ${freeze.keptFlagship}`);
    console.log(`  Frozen (archived):   ${freeze.frozen}`);
    console.log(`  Deleted junk:        ${freeze.deletedJunk}`);
    if (freeze.frozenSlugsSample.length) {
      console.log(`  Sample frozen: ${freeze.frozenSlugsSample.join(", ")}`);
    }
    if (freeze.deletedSlugsSample.length) {
      console.log(`  Sample deleted: ${freeze.deletedSlugsSample.join(", ")}`);
    }

    const after = await getCatalogVisibilityCounts();
    console.log("\nAfter freeze:", after);
  }

  if (freezeOnly) {
    console.log("\nDone (--freeze-only).");
    return;
  }

  console.log(`\nStep 2: Rebuilding up to ${rebuildLimit} flagships from authority sources...\n`);

  const sb = createAdminClient();
  const { data: existing } = await sb.from("topics").select("slug").in("slug", [...FLAGSHIP_TOPIC_SLUGS]);

  const slugsToRebuild = (existing ?? []).map((t) => t.slug).slice(0, rebuildLimit);
  console.log(`Found ${slugsToRebuild.length} flagship slugs in DB\n`);

  let ok = 0;
  let fail = 0;

  for (const slug of slugsToRebuild) {
    process.stdout.write(`  Rebuilding ${slug}... `);
    const result = await rebuildTopicFromAuthority(slug);
    if (result.success) {
      ok++;
      console.log(`OK (${result.wordsBefore} → ${result.wordsAfter} words)`);
    } else {
      fail++;
      console.log(`FAIL — ${result.error}`);
    }
  }

  console.log(`\nRebuild complete: ${ok} ok, ${fail} failed`);
  const final = await getCatalogVisibilityCounts();
  console.log("Final catalog:", final);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
