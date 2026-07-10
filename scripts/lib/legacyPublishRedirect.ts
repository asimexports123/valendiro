/**
 * Shared deprecation message for legacy publish scripts.
 */
export const LEGACY_PUBLISH_SCRIPT_MESSAGE =
  "This script is retired. Use the canonical Brain pipeline:\n" +
  "  npx tsx scripts/run-phase1-seed-brain.ts --limit=5\n" +
  "  npx tsx scripts/run-brain-pipeline.ts\n" +
  "Production cron: /api/cron/discovery-pipeline";

export function exitLegacyPublishScript(exitCode = 1): never {
  console.error("\n[DEPRECATED]", LEGACY_PUBLISH_SCRIPT_MESSAGE, "\n");
  process.exit(exitCode);
}
