import * as dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(process.cwd(), ".env.local") });
import { createAdminClient } from "../lib/supabase/admin";

const SLUGS = [
  "nodejs-cluster",
  "javascript-fundamentals",
  "html-fundamentals",
  "css-fundamentals",
  "restful-apis",
  "index-funds",
  "health-insurance",
  "budgeting",
  "budgeting-fundamentals",
  "travel-planning",
  "travel-planning-fundamentals",
  "git-fundamentals",
  "git-version-control",
];

async function main() {
  const sb = createAdminClient();
  for (const slug of SLUGS) {
    const { data: topic } = await sb.from("topics").select("id, slug, status").eq("slug", slug).maybeSingle();
    if (!topic) {
      console.log(`${slug}: NOT FOUND`);
      continue;
    }
    const { data: pkg } = await sb
      .from("knowledge_packages")
      .select("id, fact_count, last_verified_at, version")
      .eq("topic_id", topic.id)
      .maybeSingle();
    const { data: trans } = await sb
      .from("topic_translations")
      .select("content")
      .eq("topic_id", topic.id)
      .eq("language_code", "en")
      .maybeSingle();
    const words = (trans?.content || "").trim().split(/\s+/).filter(Boolean).length;
    const { count: citCount } = await sb
      .from("knowledge_citations")
      .select("*", { count: "exact", head: true })
      .eq("package_id", pkg?.id ?? "00000000-0000-0000-0000-000000000000");
    console.log(
      JSON.stringify({
        slug,
        status: topic.status,
        facts: pkg?.fact_count,
        words,
        citations: citCount,
        lastVerified: pkg?.last_verified_at,
      })
    );
  }
}

main();
