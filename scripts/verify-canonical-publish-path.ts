/**
 * Verify canonical publish path — only catalogOriginalPublish may authorize production publish.
 *   npx tsx scripts/verify-canonical-publish-path.ts
 */
import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";

const ROOT = join(process.cwd());
const BLOCKED_CALLERS = [
  "services/learning/autonomousLearner.ts",
  "services/learning/rebuildTopicFromAuthority.ts",
  "services/demand/autonomousPublishingEngine.ts",
];

function walk(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next" || name === ".git") continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, acc);
    else if (/\.(ts|tsx)$/.test(name)) acc.push(p);
  }
  return acc;
}

function main() {
  const files = walk(ROOT);
  const publishCallers: string[] = [];
  let guardInService = false;
  let guardInPipeline = false;
  let authorizeInCatalog = false;

  for (const file of files) {
    const rel = relative(ROOT, file).replace(/\\/g, "/");
    const src = readFileSync(file, "utf8");

    if (rel === "services/publish/service.ts" && src.includes("assertCanonicalTopicPublish")) {
      guardInService = true;
    }
    if (rel === "services/publication/publicationPipeline.ts" && src.includes("assertCanonicalTopicPublish")) {
      guardInPipeline = true;
    }
    if (rel === "services/discovery/catalogOriginalPublish.ts" && src.includes("authorizeBrainTopicPublish")) {
      authorizeInCatalog = true;
    }

    if (
      src.includes("publishRenderedOutput(") &&
      !rel.includes("catalogOriginalPublish") &&
      !rel.includes("publish/service.ts") &&
      !rel.includes("publicationPipeline.ts") &&
      !rel.includes("verify-canonical-publish-path")
    ) {
      publishCallers.push(rel);
    }
  }

  console.log("=== Canonical Publish Path Verification ===\n");
  console.log(`Guard in publish/service.ts: ${guardInService ? "YES" : "NO"}`);
  console.log(`Guard in publicationPipeline.ts: ${guardInPipeline ? "YES" : "NO"}`);
  console.log(`Brain authorize in catalogOriginalPublish.ts: ${authorizeInCatalog ? "YES" : "NO"}`);

  console.log("\nFiles calling publishRenderedOutput (non-canonical writers):");
  for (const f of publishCallers.sort()) {
    const blocked = BLOCKED_CALLERS.some((b) => f.endsWith(b));
    console.log(`  ${blocked ? "BLOCKED" : "LEGACY/TEST"} ${f}`);
  }

  const ok = guardInService && guardInPipeline && authorizeInCatalog;
  console.log(`\n${ok ? "PASS" : "FAIL"}: Production publish choke point ${ok ? "enforced" : "incomplete"}`);
  process.exit(ok ? 0 : 1);
}

main();
