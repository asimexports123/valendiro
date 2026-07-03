/**
 * Check full topic_translations content for machine-learning-basics
 */

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://diwwvkbztvhwouttajha.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  // Get topic
  const { data: topic } = await supabase
    .from("topics")
    .select("id")
    .eq("slug", "machine-learning-basics")
    .single();

  if (!topic) {
    console.log("Topic not found");
    return;
  }

  // Get topic translation
  const { data: translation } = await supabase
    .from("topic_translations")
    .select("content")
    .eq("topic_id", topic.id)
    .eq("language_code", "en")
    .single();

  if (!translation) {
    console.log("No translation found");
    return;
  }

  console.log("Full Topic Translation Content:");
  console.log("================================");
  console.log(translation.content);
}

main().catch(console.error);
