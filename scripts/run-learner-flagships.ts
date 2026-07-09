import * as dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(process.cwd(), ".env.local") });
process.env.ALLOW_RENDER = "true";

import { analyzePackageGaps } from "../services/learning/packageGapAnalyzer";
import { runAutonomousLearner } from "../services/learning/autonomousLearner";
import { createAdminClient } from "../lib/supabase/admin";

async function main() {
  const sb = createAdminClient();
  const slugs = ["javascript-fundamentals", "git-version-control", "budgeting", "health-insurance", "index-funds"];

  for (const slug of slugs) {
    const { data: t } = await sb.from("topics").select("id").eq("slug", slug).maybeSingle();
    if (t) {
      const g = await analyzePackageGaps(t.id);
      console.log(`${slug}: weakness=${g.weaknessScore} excellent=${g.isExcellent}`);
    }
  }

  console.log("\nRunning learner on top 5 weakest (includes flagships if weak)...");
  const result = await runAutonomousLearner({ topicLimit: 5 });
  console.log(JSON.stringify(result, null, 2));
}

main();
