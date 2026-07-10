/** Shared exit for legacy manual publish scripts — use canonical Brain scripts instead. */
import { CANONICAL_TOPIC_PUBLISH_MESSAGE } from "../../lib/architecture/frozen";

export function exitLegacyPublishScript(scriptName: string, canonical = "scripts/run-brain-pipeline.ts"): never {
  console.error(`\nDEPRECATED: ${scriptName}`);
  console.error(CANONICAL_TOPIC_PUBLISH_MESSAGE);
  console.error(`\nUse instead:\n  npx tsx ${canonical}\n  npx tsx scripts/run-phase1-seed-brain.ts --limit=5\n`);
  process.exit(1);
}
