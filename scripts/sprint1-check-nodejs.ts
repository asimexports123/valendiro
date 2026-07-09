import * as dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(process.cwd(), ".env.local") });
import { createAdminClient } from "../lib/supabase/admin";

async function main() {
  const sb = createAdminClient();
  const { data: topic } = await sb.from("topics").select("id").eq("slug", "nodejs-cluster").single();
  if (!topic) return;
  const { data: pkgs } = await sb
    .from("knowledge_packages")
    .select("id, fact_count, version, created_at")
    .eq("topic_id", topic.id)
    .order("created_at", { ascending: false })
    .limit(5);
  const { data: trans } = await sb
    .from("topic_translations")
    .select("content")
    .eq("topic_id", topic.id)
    .eq("language_code", "en")
    .single();
  const { count: factCount } = await sb
    .from("knowledge_facts")
    .select("*", { count: "exact", head: true })
    .eq("package_id", pkgs?.[0]?.id ?? "");
  console.log(JSON.stringify({ pkgs, factCount, words: (trans?.content || "").split(/\s+/).length }, null, 2));
}

main();
