/** Save live benchmark article metrics. Run: npx tsx scripts/save-brain-benchmark.ts */
import * as dotenv from "dotenv";
import { resolve } from "path";
import { mkdirSync, writeFileSync } from "fs";
dotenv.config({ path: resolve(process.cwd(), ".env.local") });
import { createAdminClient } from "@/lib/supabase/admin";
import { measureEditorialQuality } from "../services/discovery/brainEditorialRegression";
import { COMPOSITION_ENGINE_VERSION, EDITORIAL_BENCHMARK_SLUG } from "../services/discovery/brainComposeVersion";

async function main() {
  const sb = createAdminClient();
  const { data } = await sb
    .from("topics")
    .select("slug, topic_translations(content)")
    .eq("slug", EDITORIAL_BENCHMARK_SLUG)
    .eq("topic_translations.language_code", "en")
    .maybeSingle();
  const content = data?.topic_translations?.[0]?.content ?? "";
  const metrics = measureEditorialQuality(content, EDITORIAL_BENCHMARK_SLUG);
  mkdirSync(resolve(process.cwd(), "data/brain-benchmark"), { recursive: true });
  writeFileSync(
    resolve(process.cwd(), "data/brain-benchmark/what-is-artificial-intelligence.json"),
    JSON.stringify({ version: COMPOSITION_ENGINE_VERSION, metrics }, null, 2)
  );
  console.log(JSON.stringify(metrics, null, 2));
}

main();
