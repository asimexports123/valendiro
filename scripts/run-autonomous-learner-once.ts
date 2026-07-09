import * as dotenv from "dotenv";
import { resolve } from "path";
import { writeFileSync, mkdirSync } from "fs";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });
process.env.ALLOW_RENDER = "true";

import { runAutonomousLearner } from "../services/learning/autonomousLearner";
import { prioritizeWeakestTopics } from "../services/learning/topicPriorityService";

async function main() {
  mkdirSync("temp", { recursive: true });

  console.log("=== Weakest topics ===");
  const weakest = await prioritizeWeakestTopics(15);
  for (const t of weakest.slice(0, 10)) {
    console.log(
      `  ${t.slug} (weakness=${t.weaknessScore}) gaps: ${t.gapReport.gaps.slice(0, 2).map((g) => g.detail).join(", ")}`
    );
  }

  console.log("\n=== Running autonomous learner (limit 5) ===");
  const result = await runAutonomousLearner({ topicLimit: 5 });

  writeFileSync("temp/autonomous-learner-run.json", JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
