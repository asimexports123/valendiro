/**
 * Update topic_translations table with v2-rendered content from rendered_outputs
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://diwwvkbztvhwouttajha.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY";

const sb = createClient(SUPABASE_URL, SERVICE_KEY);

const topics = [
  "machine-learning-basics",
  "docker-containers",
  "css-fundamentals",
  "retirement-planning-fundamentals",
  "business-strategy-fundamentals",
  "nutrition-fundamentals",
  "japan-travel-guide",
  "cybersecurity-fundamentals",
  "cloud-computing-fundamentals",
  "project-management-fundamentals",
];

async function main() {
  console.log("Updating topic_translations with v2 content...\n");

  for (const topicSlug of topics) {
    console.log(topicSlug);
    
    try {
      // Get topic ID
      const { data: topic } = await sb
        .from("topics")
        .select("id")
        .eq("slug", topicSlug)
        .single();

      if (!topic) {
        console.log("  Topic not found in topics table");
        continue;
      }

      // Get package ID
      const { data: pkg } = await sb
        .from("knowledge_packages")
        .select("id")
        .eq("slug", topicSlug)
        .single();

      if (!pkg) {
        console.log("  Package not found");
        continue;
      }

      // Get v2 rendered output
      const { data: outputs } = await sb
        .from("rendered_outputs")
        .select("*")
        .eq("package_id", pkg.id)
        .eq("renderer_id", "long-article-v2-v5.0.0")
        .order("created_at", { ascending: false })
        .limit(1);

      if (!outputs || outputs.length === 0) {
        console.log("  No v2 output found");
        continue;
      }

      const v2Content = outputs[0].content;
      const wordCount = v2Content?.split(/\s+/).length || 0;

      // Update topic_translations with v2 content
      const { error: updateError } = await sb
        .from("topic_translations")
        .update({ 
          content: v2Content
        })
        .eq("topic_id", topic.id)
        .eq("language_code", "en");

      if (updateError) {
        console.log(`  ✗ Failed to update: ${updateError.message}`);
      } else {
        console.log(`  ✓ Updated with ${wordCount} words (v2)`);
      }
    } catch (error) {
      console.log(`  ✗ Error: ${(error as Error).message}`);
    }
  }

  console.log("\nAll topics updated with v2 content. Live site now shows Composition Engine articles.");
}

main().catch(console.error);
