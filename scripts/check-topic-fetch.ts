import { createClient } from "@supabase/supabase-js";

const sb = createClient("https://diwwvkbztvhwouttajha.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY");

async function main() {
  const { data: topic } = await sb
    .from("topics")
    .select("id, status, category_id, subcategory_id")
    .eq("slug", "machine-learning-basics")
    .single();

  if (!topic) {
    console.log("Topic not found");
    return;
  }

  console.log("Topic:");
  console.log(`  ID: ${topic.id}`);
  console.log(`  Status: ${topic.status}`);
  console.log(`  Category ID: ${topic.category_id}`);
  console.log(`  Subcategory ID: ${topic.subcategory_id}`);

  const { data: translation } = await sb
    .from("topic_translations")
    .select("content, title, subtitle")
    .eq("topic_id", topic.id)
    .eq("language_code", "en")
    .single();

  if (!translation) {
    console.log("Translation not found");
    return;
  }

  console.log("\nTranslation:");
  console.log(`  Title: ${translation.title}`);
  console.log(`  Subtitle: ${translation.subtitle}`);
  console.log(`  Content length: ${translation.content?.length || 0} chars`);
  console.log(`  Content exists: ${!!translation.content}`);
  console.log(`  Content preview: ${translation.content?.substring(0, 200)}...`);
}

main();
