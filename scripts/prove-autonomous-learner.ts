/**
 * Prove gap-driven autonomous learning on authority-mapped weak topics.
 */
import * as dotenv from "dotenv";
import { resolve } from "path";
import { writeFileSync, mkdirSync } from "fs";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });
process.env.ALLOW_RENDER = "true";

import { seekKnowledgeForGaps } from "../services/learning/webKnowledgeSeeker";
import { analyzePackageGaps } from "../services/learning/packageGapAnalyzer";
import { runAutonomousLearner } from "../services/learning/autonomousLearner";
import { createAdminClient } from "../lib/supabase/admin";

const PROOF_SLUGS = [
  "rust-ownership",
  "java-lambdas",
  "index-funds",
  "budgeting",
  "git-version-control",
];

async function main() {
  mkdirSync("temp", { recursive: true });
  const sb = createAdminClient();

  console.log("=== Evidence check ===");
  for (const slug of PROOF_SLUGS) {
    const { data: t } = await sb.from("topics").select("id").eq("slug", slug).maybeSingle();
    if (!t) {
      console.log(`${slug}: missing`);
      continue;
    }
    const gaps = await analyzePackageGaps(t.id);
    const evidence = await seekKnowledgeForGaps(gaps);
    console.log(
      `${slug}: weakness=${gaps.weaknessScore} evidence=${evidence.length} words=[${evidence.map((e) => e.description?.split(/\s+/).length ?? 0).join(",")}]`
    );
  }

  console.log("\n=== Learning cycle ===");
  const result = await runAutonomousLearner({
    topicLimit: 5,
    onlySlugs: PROOF_SLUGS,
  });

  writeFileSync("temp/autonomous-learner-proof.json", JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
