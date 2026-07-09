import * as dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(process.cwd(), ".env.local") });
import { createAdminClient } from "../lib/supabase/admin";

async function main() {
  const sb = createAdminClient();
  const { data: sources } = await sb.from("discovery_system_sources").select("id, name, url, status, source_type").eq("status", "active");
  console.log(JSON.stringify(sources, null, 2));
  const { count: pending } = await sb.from("knowledge_assets").select("*", { count: "exact", head: true }).eq("status", "pending");
  const { count: deferred } = await sb.from("knowledge_assets").select("*", { count: "exact", head: true }).eq("status", "accepted");
  const { count: mappings } = await sb.from("discovered_article_topics").select("*", { count: "exact", head: true });
  console.log({ pending, deferred, mappings });
}

main();
