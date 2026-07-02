/**
 * Audit how topics are currently placed vs which categories/subcategories exist.
 * Shows which subcategories in non-technology categories need topics seeded.
 */
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  "https://diwwvkbztvhwouttajha.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY"
);

async function main() {
  const { data: cats }   = await sb.from("categories").select("id, slug, category_translations(name)").eq("category_translations.language_code","en").order("sort_order");
  const { data: subs }   = await sb.from("subcategories").select("id, slug, category_id, subcategory_translations(name)").eq("subcategory_translations.language_code","en").order("sort_order");
  const { data: topics } = await sb.from("topics").select("id, slug, status, subcategory_id, topic_translations(title)").eq("topic_translations.language_code","en");
  const { data: pkgs }   = await sb.from("knowledge_packages").select("id, slug, topic_id, status");

  const catList   = (cats   || []) as any[];
  const subList   = (subs   || []) as any[];
  const topicList = (topics || []) as any[];
  const pkgList   = (pkgs   || []) as any[];

  const pkgByTopic = new Map(pkgList.map((p) => [p.topic_id, p]));

  console.log("══ TOPIC PLACEMENT BY CATEGORY ══\n");
  for (const cat of catList) {
    const catSubs = subList.filter((s) => s.category_id === cat.id);
    const catTopics = topicList.filter((t) => catSubs.some((s) => s.id === t.subcategory_id));
    const pubTopics = catTopics.filter((t) => t.status === "published");
    const catName = cat.category_translations?.[0]?.name ?? cat.slug;
    console.log(`\n📂 ${catName} (${cat.slug}) — ${pubTopics.length} published topics across ${catSubs.length} subcategories`);
    for (const sub of catSubs) {
      const subTopics = topicList.filter((t) => t.subcategory_id === sub.id && t.status === "published");
      const subName = sub.subcategory_translations?.[0]?.name ?? sub.slug;
      const marker = subTopics.length > 0 ? "✅" : "❌";
      console.log(`  ${marker} ${subName} (${sub.slug}) — ${subTopics.length} topics`);
      for (const t of subTopics) {
        const hasPkg = pkgByTopic.has(t.id);
        console.log(`       • ${t.topic_translations?.[0]?.title ?? t.slug} ${hasPkg ? "📦" : "⚠️  no package"}`);
      }
    }
  }

  console.log("\n\n══ KNOWLEDGE PACKAGES WITHOUT A TOPIC LINK ══");
  const linkedTopicIds = new Set(topicList.map((t) => t.id));
  const orphanPkgs = pkgList.filter((p) => !p.topic_id || !linkedTopicIds.has(p.topic_id));
  console.log(`  ${orphanPkgs.length} orphan packages`);
  orphanPkgs.forEach((p) => console.log(`  - ${p.slug}`));
}

main().catch(console.error);
