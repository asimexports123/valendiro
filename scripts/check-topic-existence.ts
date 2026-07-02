/**
 * Check if topics exist in topics table
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://diwwvkbztvhwouttajha.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY";

const sb = createClient(SUPABASE_URL, SERVICE_KEY);

const topics = [
  "machine-learning-basics",
  "docker-containers",
  "css-fundamentals",
];

async function main() {
  console.log("Checking topic existence...\n");

  for (const topicSlug of topics) {
    console.log(topicSlug);
    
    // Check topics table
    const { data: topic } = await sb
      .from("topics")
      .select("id, status")
      .eq("slug", topicSlug)
      .maybeSingle();

    if (!topic) {
      console.log("  ✗ Topic NOT in topics table");
      continue;
    }

    console.log(`  ✓ Topic exists (status: ${topic.status})`);

    // Check topic_translations
    const { data: translation } = await sb
      .from("topic_translations")
      .select("content")
      .eq("topic_id", topic.id)
      .eq("language_code", "en")
      .maybeSingle();

    if (!translation) {
      console.log("  ✗ No translation");
      continue;
    }

    const wordCount = translation.content?.split(/\s+/).length || 0;
    console.log(`  ✓ Translation exists (${wordCount} words)`);
  }
}

main().catch(console.error);
