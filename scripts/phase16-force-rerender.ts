/**
 * Phase 16 Iteration 2: Force re-render validation topics with new renderer
 */

process.env.ALLOW_RENDER = "true";
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://diwwvkbztvhwouttajha.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY";

import { createClient } from "@supabase/supabase-js";
import { render } from "../services/renderer/orchestrator";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const validationTopics = [
  "cybersecurity-fundamentals",
  "machine-learning-basics",
  "css-fundamentals",
  "docker-containers",
  "nutrition-fundamentals",
  "retirement-planning-fundamentals"
];

async function main() {
  console.log("Phase 16 Iteration 2: Force Re-rendering Validation Topics");
  console.log("=========================================================\n");

  for (const slug of validationTopics) {
    console.log(`Processing: ${slug}`);

    // Get topic
    const { data: topic } = await supabase
      .from("topics")
      .select("id")
      .eq("slug", slug)
      .single();

    if (!topic) {
      console.log("  ❌ Topic not found\n");
      continue;
    }

    // Get knowledge package
    const { data: pkg } = await supabase
      .from("knowledge_packages")
      .select("id")
      .eq("topic_id", topic.id)
      .single();

    if (!pkg) {
      console.log("  ❌ No knowledge package\n");
      continue;
    }

    // Trigger force re-render
    try {
      const result = await render({
        packageId: pkg.id,
        format: "html",
        rendererId: "long-article-v2",
        style: ["intermediate"],
        forceRerender: true,
      });

      console.log(`  ✅ Force re-rendered successfully`);
      console.log(`     Quality Score: ${result.qualityScore.overall}/100`);
      console.log(`     Status: ${result.status}\n`);
    } catch (error) {
      console.log(`  ❌ Re-render failed: ${error}\n`);
    }
  }

  console.log("==========================");
  console.log("Force re-rendering complete");
}

main().catch(console.error);
