import "dotenv/config";
import { createAdminClient } from "../lib/supabase/admin";

const supabase = createAdminClient();

async function debugArticles() {
  console.log("Checking database for articles...\n");

  // Check categories
  const { data: categories } = await supabase
    .from("categories")
    .select("id, slug")
    .limit(20);

  console.log("Categories:");
  categories?.forEach(c => console.log(`  - ${c.slug} (${c.id})`));

  // Check published articles
  const { data: articles } = await supabase
    .from("articles")
    .select("id, slug, status, topic_id")
    .eq("status", "published")
    .limit(10);

  console.log("\nPublished articles:");
  articles?.forEach(a => console.log(`  - ${a.slug} (topic: ${a.topic_id})`));

  // Check topics
  const { data: topics } = await supabase
    .from("topics")
    .select("id, slug, category_id, status")
    .eq("status", "published")
    .limit(10);

  console.log("\nPublished topics:");
  topics?.forEach(t => console.log(`  - ${t.slug} (category: ${t.category_id})`));

  // Check knowledge packages
  const { data: packages } = await supabase
    .from("knowledge_packages")
    .select("id, topic_id")
    .limit(10);

  console.log("\nKnowledge packages:");
  packages?.forEach(p => console.log(`  - ${p.id} (topic: ${p.topic_id})`));
}

debugArticles().catch(console.error);
