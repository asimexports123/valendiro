/**
 * List all topics with their knowledge packages
 */

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://diwwvkbztvhwouttajha.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  console.log("All Topics with Knowledge Packages");
  console.log("===================================\n");

  const { data: topics } = await supabase
    .from("topics")
    .select("id, slug, status, difficulty")
    .order("slug");

  if (!topics || topics.length === 0) {
    console.log("No topics found");
    return;
  }

  console.log(`Found ${topics.length} topics\n`);

  for (const topic of topics) {
    console.log(`📚 ${topic.slug}`);
    console.log(`   Status: ${topic.status}`);
    console.log(`   Difficulty: ${topic.difficulty}`);

    // Get knowledge package
    const { data: pkg } = await supabase
      .from("knowledge_packages")
      .select("id")
      .eq("topic_id", topic.id)
      .maybeSingle();

    if (pkg) {
      // Get facts count
      const { count: factCount } = await supabase
        .from("knowledge_facts")
        .select("*", { count: "exact", head: true })
        .eq("package_id", pkg.id);

      console.log(`   Knowledge Package: ✅ (${factCount || 0} facts)`);
    } else {
      console.log(`   Knowledge Package: ❌ None`);
    }

    // Get translation
    const { data: translation } = await supabase
      .from("topic_translations")
      .select("title, content")
      .eq("topic_id", topic.id)
      .eq("language_code", "en")
      .maybeSingle();

    if (translation) {
      const hasContent = translation.content && translation.content.length > 0;
      console.log(`   Translation: ✅ "${translation.title}" (${hasContent ? 'has content' : 'no content'})`);
    } else {
      console.log(`   Translation: ❌ None`);
    }

    console.log("");
  }
}

main().catch(console.error);
