/**
 * Sync rendered outputs with new structure to topic_translations
 */

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://diwwvkbztvhwouttajha.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TOPICS_TO_SYNC = [
  "machine-learning-basics",
  "css-fundamentals",
  "docker-containers",
  "nutrition-fundamentals",
  "retirement-planning-fundamentals",
  "cybersecurity-fundamentals"
];

async function main() {
  console.log("Syncing new structure outputs to topic_translations");
  console.log("====================================================\n");

  for (const slug of TOPICS_TO_SYNC) {
    console.log(`Processing: ${slug}`);
    
    // Get topic
    const { data: topic } = await supabase
      .from("topics")
      .select("id")
      .eq("slug", slug)
      .single();

    if (!topic) {
      console.log(`  ❌ Topic not found\n`);
      continue;
    }

    // Get knowledge package
    const { data: pkg } = await supabase
      .from("knowledge_packages")
      .select("id")
      .eq("topic_id", topic.id)
      .single();

    if (!pkg) {
      console.log(`  ❌ No knowledge package found\n`);
      continue;
    }

    // Get rendered output with new structure (long-article-v2-v5.0.0)
    const { data: rendered } = await supabase
      .from("rendered_outputs")
      .select("content")
      .eq("package_id", pkg.id)
      .eq("renderer_id", "long-article-v2-v5.0.0")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!rendered) {
      console.log(`  ❌ No new structure rendered output found\n`);
      continue;
    }

    // Update topic_translations
    const { error } = await supabase
      .from("topic_translations")
      .update({ content: rendered.content })
      .eq("topic_id", topic.id)
      .eq("language_code", "en");

    if (error) {
      console.log(`  ❌ Error updating translation: ${error.message}\n`);
    } else {
      console.log(`  ✅ Synced successfully\n`);
    }
  }

  console.log("====================================================");
  console.log("Sync complete");
}

main().catch(console.error);
