import { createAdminClient } from "../lib/supabase/admin";
import { detectDummyContent, countWords } from "../services/knowledge/contentQualityGate";
import { FLAGSHIP_TOPIC_SLUGS } from "../config/flagshipTopics";

async function main() {
  const sb = createAdminClient();
  const archived: string[] = [];
  const kept: string[] = [];

  for (const slug of FLAGSHIP_TOPIC_SLUGS) {
    const { data: t } = await sb
      .from("topics")
      .select("id, slug, topic_translations(content)")
      .eq("slug", slug)
      .eq("topic_translations.language_code", "en")
      .maybeSingle();

    if (!t) {
      archived.push(`${slug} (missing)`);
      continue;
    }

    const content = t.topic_translations?.[0]?.content ?? "";
    const words = countWords(content);
    const dummy = detectDummyContent(content);
    const bad = !content || words < 350 || dummy;

    await sb
      .from("topics")
      .update({ status: bad ? "archived" : "published", updated_at: new Date().toISOString() })
      .eq("id", t.id);

    if (bad) archived.push(`${slug} (${words}w${dummy ? " DUMMY" : ""})`);
    else kept.push(`${slug} (${words}w)`);
  }

  const { count } = await sb.from("topics").select("*", { count: "exact", head: true }).eq("status", "published");

  console.log("\n=== ARCHIVE BROKEN FLAGSHIPS ===\n");
  console.log(`ARCHIVED (${archived.length}):`);
  for (const s of archived) console.log(`  - ${s}`);
  console.log(`\nLIVE (${kept.length}):`);
  for (const s of kept) console.log(`  + ${s}`);
  console.log(`\nTotal published: ${count}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
