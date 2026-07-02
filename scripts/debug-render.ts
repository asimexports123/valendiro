/**
 * Debug render failures by testing with v1 renderer
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://diwwvkbztvhwouttajha.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY";
process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE_URL;
process.env.SUPABASE_SERVICE_ROLE_KEY = SERVICE_KEY;
process.env.ALLOW_RENDER = "true";

const sb = createClient(SUPABASE_URL, SERVICE_KEY);

const failingTopics = [
  "machine-learning-basics",
  "japan-travel-guide",
  "cybersecurity-fundamentals",
  "cloud-computing-fundamentals",
];

async function main() {
  console.log("=== Debugging Render Failures ===\n");

  const { render } = await import("@/services/renderer/orchestrator");

  for (const topic of failingTopics) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`Topic: ${topic}`);
    console.log(`${"=".repeat(60)}`);

    try {
      const { data: pkg } = await sb
        .from("knowledge_packages")
        .select("*")
        .eq("slug", topic)
        .single();

      if (!pkg) {
        console.log("  ✗ Package not found");
        continue;
      }

      console.log(`  Package ID: ${pkg.id}`);
      console.log(`  Status: ${pkg.status}`);

      // Get facts
      const { data: facts } = await sb
        .from("knowledge_facts")
        .select("*")
        .eq("package_id", pkg.id);

      console.log(`  Facts: ${facts?.length || 0}`);

      // Try rendering with v1 (long-article)
      console.log(`\n  Testing v1 renderer...`);
      try {
        const v1Result = await render({
          packageId: pkg.id,
          rendererId: "long-article",
          format: "html",
          forceRerender: true,
        });
        console.log(`  ✓ v1 Success: ${v1Result.content.split(/\s+/).length} words, Status: ${v1Result.status}`);
      } catch (v1Error) {
        console.log(`  ✗ v1 Failed: ${(v1Error as Error).message}`);
      }

      // Try rendering with v2 (long-article-v2)
      console.log(`\n  Testing v2 renderer...`);
      try {
        const v2Result = await render({
          packageId: pkg.id,
          rendererId: "long-article-v2",
          format: "html",
          forceRerender: true,
        });
        console.log(`  ✓ v2 Success: ${v2Result.content.split(/\s+/).length} words, Status: ${v2Result.status}`);
        console.log(`    Quality Score: ${v2Result.qualityScore?.overall || 0}/100`);
        if (v2Result.diagnostics) {
          console.log(`    Diagnostics: ${JSON.stringify(v2Result.diagnostics).substring(0, 200)}`);
        }
      } catch (v2Error) {
        console.log(`  ✗ v2 Failed: ${(v2Error as Error).message}`);
      }

    } catch (error) {
      console.log(`  ✗ Error: ${(error as Error).message}`);
    }
  }
}

main().catch(console.error);
