import { createClient } from "@supabase/supabase-js";

const sb = createClient("https://diwwvkbztvhwouttajha.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY");

async function main() {
  const { data: topic } = await sb
    .from("topics")
    .select("id")
    .eq("slug", "machine-learning-basics")
    .single();

  if (!topic) {
    console.log("Topic not found");
    return;
  }

  const { data: translation } = await sb
    .from("topic_translations")
    .select("content")
    .eq("topic_id", topic.id)
    .eq("language_code", "en")
    .single();

  if (!translation) {
    console.log("Translation not found");
    return;
  }

  const content = translation.content || "";
  const hasArticleContent = content.includes("<article class=\"knowledge-article\">");
  const hasH1 = content.includes("<h1");
  const hasH2 = content.includes("<h2");
  const hasP = content.includes("<p");

  console.log("Database content analysis:");
  console.log(`  Total length: ${content.length} chars`);
  console.log(`  Has <article> tag: ${hasArticleContent}`);
  console.log(`  Has <h1> tag: ${hasH1}`);
  console.log(`  Has <h2> tag: ${hasH2}`);
  console.log(`  Has <p> tag: ${hasP}`);
  console.log(`  First 500 chars: ${content.substring(0, 500)}`);
}

main();
