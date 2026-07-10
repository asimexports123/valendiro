/**
 * PROOF: One topic via canonical Brain pipeline.
 * Run: npx tsx scripts/prove-one-topic.ts [slug]
 */
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });
process.env.ALLOW_RENDER = "true";

import { publishOriginalTopicBySlug } from "../services/discovery/catalogOriginalPublish";

const SLUG = process.argv[2] ?? "design-patterns";

async function main() {
  console.log(`\n=== CANONICAL BRAIN PROOF: ${SLUG} ===\n`);
  const result = await publishOriginalTopicBySlug(SLUG);
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.status === "published" ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
