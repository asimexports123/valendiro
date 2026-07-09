import * as dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(process.cwd(), ".env.local") });
process.env.ALLOW_RENDER = "true";

import { analyzePackageGaps } from "../services/learning/packageGapAnalyzer";
import { seekKnowledgeForGaps } from "../services/learning/webKnowledgeSeeker";

const FLAGSHIPS = ["index-funds", "budgeting", "javascript-fundamentals", "health-insurance", "git-version-control"];

async function main() {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const sb = createAdminClient();

  for (const slug of FLAGSHIPS) {
    const { data: topic } = await sb.from("topics").select("id").eq("slug", slug).maybeSingle();
    if (!topic) {
      console.log(`${slug}: NOT FOUND`);
      continue;
    }
    const gaps = await analyzePackageGaps(topic.id);
    const evidence = await seekKnowledgeForGaps(gaps);
    console.log(JSON.stringify({
      slug,
      weakness: gaps.weaknessScore,
      excellent: gaps.isExcellent,
      gaps: gaps.gaps.slice(0, 3).map((g) => g.detail),
      evidenceFound: evidence.length,
      sources: evidence.map((e) => ({ title: e.title?.slice(0, 50), url: e.sourceUrl, words: e.description?.split(/\s+/).length })),
    }, null, 2));
  }
}

main();
