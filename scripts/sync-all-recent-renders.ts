/**
 * Sync all recent rendered outputs to topic_translations
 */

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://diwwvkbztvhwouttajha.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  console.log("Syncing all recent rendered outputs to topic_translations");
  console.log("========================================================\n");

  // Get all published topics
  const { data: topics } = await supabase
    .from("topics")
    .select("id, slug")
    .eq("status", "published");

  if (!topics) {
    console.log("No topics found");
    return;
  }

  for (const topic of topics) {
    console.log(`Processing: ${topic.slug}`);

    // Get knowledge package
    const { data: pkg } = await supabase
      .from("knowledge_packages")
      .select("id")
      .eq("topic_id", topic.id)
      .maybeSingle();

    if (!pkg) {
      console.log(`  ❌ No knowledge package found\n`);
      continue;
    }

    // Get latest rendered output
    const { data: rendered } = await supabase
      .from("rendered_outputs")
      .select("content")
      .eq("package_id", pkg.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!rendered) {
      console.log(`  ❌ No rendered output found\n`);
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

  console.log("========================================================");
  console.log("Sync complete");
}

main().catch(console.error);
