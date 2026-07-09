import * as dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(process.cwd(), ".env.local") });
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  const { data: packages } = await sb
    .from("knowledge_packages")
    .select("id,slug,fact_count,status,topic_id")
    .eq("status", "ready")
    .gte("fact_count", 8);

  const results = [];
  for (const p of packages ?? []) {
    const { count } = await sb
      .from("knowledge_facts")
      .select("id", { count: "exact", head: true })
      .eq("package_id", p.id);
    if ((count ?? 0) >= 8) {
      const { data: topic } = await sb.from("topics").select("slug,title").eq("id", p.topic_id).maybeSingle();
      const { data: out } = await sb
        .from("rendered_outputs")
        .select("id, renderer_id")
        .eq("package_id", p.id)
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      results.push({
        id: p.id,
        slug: p.slug,
        facts: count,
        topicSlug: topic?.slug,
        title: topic?.title,
        oldOutputId: out?.id,
        renderer: out?.renderer_id,
        url: topic?.slug ? `https://valendiro.com/en/topics/${topic.slug}` : null,
      });
    }
  }
  console.log("Total with actual facts>=8:", results.length);
  console.log(JSON.stringify(results, null, 2));
}
main();
