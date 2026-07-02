/**
 * Force re-render all 10 topics with v2 renderer explicitly
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://diwwvkbztvhwouttajha.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY";
process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE_URL;
process.env.SUPABASE_SERVICE_ROLE_KEY = SERVICE_KEY;
process.env.ALLOW_RENDER = "true";

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
  console.log("Force re-rendering all topics with v2 renderer...\n");

  const { render } = await import("@/services/renderer/orchestrator");

  for (const topic of topics) {
    console.log(topic);
    
    try {
      const { data: pkg } = await sb
        .from("knowledge_packages")
        .select("id")
        .eq("slug", topic)
        .single();

      if (!pkg) {
        console.log("  Package not found");
        continue;
      }

      const result = await render({
        packageId: pkg.id,
        rendererId: "long-article-v2",
        format: "html",
        forceRerender: true,
      });

      const wordCount = result.content.split(/\s+/).length;
      const qualityScore = result.qualityScore?.overall || 0;
      
      console.log(`  ✓ ${wordCount} words, Quality: ${qualityScore}/100, Status: ${result.status}`);
    } catch (error) {
      console.log(`  ✗ Failed: ${(error as Error).message}`);
    }
  }

  console.log("\nAll topics re-rendered with v2. Database now has v2 articles.");
}

main().catch(console.error);
