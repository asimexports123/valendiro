import * as dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(process.cwd(), ".env.local") });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  const slugs = [
    "nodejs-cluster",
    "vendor-management",
    "family-vacations",
    "index-funds",
    "heart-disease",
    "terraform-basics",
    "go-channels",
    "java-concurrency",
  ];
  const { data: topics } = await sb.from("topics").select("id,slug,status").in("slug", slugs);
  console.log("topics:", JSON.stringify(topics, null, 2));
  for (const t of topics ?? []) {
    const { data: pkgs } = await sb
      .from("knowledge_packages")
      .select("id,fact_count,status,slug")
      .eq("topic_id", t.id)
      .eq("status", "ready");
    for (const pkg of pkgs ?? []) {
      const { count } = await sb
        .from("knowledge_facts")
        .select("id", { count: "exact", head: true })
        .eq("package_id", pkg.id);
      console.log({ topic: t.slug, packageId: pkg.id, pkgSlug: pkg.slug, facts: count });
    }
  }
}
main();
