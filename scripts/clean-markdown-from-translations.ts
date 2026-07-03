/**
 * Clean markdown directly from topic_translations content
 */

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://diwwvkbztvhwouttajha.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TOPICS_TO_CLEAN = [
  "sql-fundamentals",
  "nutrition-fundamentals",
  "docker-containers",
  "css-fundamentals",
  "cybersecurity-fundamentals",
  "machine-learning-basics",
  "retirement-planning-fundamentals"
];

function cleanMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")  // Remove **bold**
    .replace(/\*([^*]+)\*/g, "$1");     // Remove *italic*
}

async function main() {
  console.log("Cleaning markdown from topic_translations");
  console.log("==========================================\n");

  for (const slug of TOPICS_TO_CLEAN) {
    console.log(`Processing: ${slug}`);

    // Get topic
    const { data: topic } = await supabase
      .from("topics")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (!topic) {
      console.log(`  ❌ Topic not found\n`);
      continue;
    }

    // Get translation
    const { data: translation } = await supabase
      .from("topic_translations")
      .select("content")
      .eq("topic_id", topic.id)
      .eq("language_code", "en")
      .maybeSingle();

    if (!translation) {
      console.log(`  ❌ No translation found\n`);
      continue;
    }

    const cleanedContent = cleanMarkdown(translation.content);
    const { error } = await supabase
      .from("topic_translations")
      .update({ content: cleanedContent })
      .eq("topic_id", topic.id)
      .eq("language_code", "en");

    if (error) {
      console.log(`  ❌ Error: ${error.message}\n`);
    } else {
      console.log(`  ✅ Cleaned successfully\n`);
    }
  }

  console.log("==========================================");
  console.log("Cleaning complete");
}

main().catch(console.error);
