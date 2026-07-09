import * as dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(process.cwd(), ".env.local") });
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const slugs = [
    "java-concurrency",
    "investing-basics",
    "personal-finance",
    "stock-market",
    "travel-planning",
    "health-insurance",
    "business-process-automation",
    "nodejs-cluster",
    "terraform-basics",
    "budgeting",
    "retirement-planning",
    "credit-cards",
  ];
  const { data: pkgs } = await sb
    .from("knowledge_packages")
    .select("id,slug,fact_count,status,topic_id")
    .in("slug", slugs);
  console.log("By slug:", JSON.stringify(pkgs, null, 2));

  const { data: javaTopics } = await sb
    .from("topics")
    .select("id,slug,title,category_slug")
    .ilike("slug", "%java%")
    .limit(5);
  console.log("Java topics:", JSON.stringify(javaTopics, null, 2));

  const { data: financeTopics } = await sb
    .from("topics")
    .select("id,slug,title,category_slug")
    .eq("category_slug", "personal-finance")
    .limit(15);
  console.log("Finance topics:", JSON.stringify(financeTopics, null, 2));

  const { data: techTopics } = await sb
    .from("topics")
    .select("id,slug,title,category_slug")
    .eq("category_slug", "technology")
    .limit(15);
  console.log("Tech topics:", JSON.stringify(techTopics, null, 2));

  for (const p of pkgs ?? []) {
    const { data: outs } = await sb
      .from("rendered_outputs")
      .select("id,renderer_id,status,created_at,quality_score")
      .eq("package_id", p.id)
      .order("created_at", { ascending: false })
      .limit(1);
    console.log(`Output for ${p.slug}:`, JSON.stringify(outs?.[0] ?? null));
  }
}

main().catch(console.error);
