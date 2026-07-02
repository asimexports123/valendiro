/**
 * Render 10 articles using v2 Composition Engine
 */

import { createClient } from "@supabase/supabase-js";
import { render } from "@/services/renderer/orchestrator";

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
  console.log("=== Rendering 10 Articles with v2 Composition Engine ===\n");

  const sb = createClient(
    "https://diwwvkbztvhwouttajha.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTg1MzY0MCwiZXhwIjoyMDUxNDI5NjQwfQ.6yZJjLh8X7XqW7XqW7XqW7XqW7XqW7XqW7XqW7XqW7Xq"
  );

  const results: Array<{ topic: string; packageId: string | null; success: boolean; error?: string }> = [];

  for (const topic of topics) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`Topic: ${topic}`);
    console.log(`${"=".repeat(60)}`);

    try {
      // Get package ID for the topic
      const { data: pkg } = await sb
        .from("knowledge_packages")
        .select("id, slug, status")
        .eq("slug", topic)
        .eq("status", "ready")
        .maybeSingle();

      if (!pkg) {
        console.log(`  ✗ No ready package found for topic: ${topic}`);
        results.push({ topic, packageId: null, success: false, error: "No ready package found" });
        continue;
      }

      console.log(`  ✓ Package found: ${pkg.id}`);

      // Render with v2
      const renderResult = await render({
        packageId: pkg.id,
        rendererId: "long-article-v2",
        format: "html",
        forceRerender: true,
      });

      console.log(`  ✓ Rendered successfully`);
      console.log(`    Output ID: ${renderResult.outputId}`);
      console.log(`    Status: ${renderResult.status}`);
      console.log(`    Cached: ${renderResult.cached}`);
      console.log(`    Quality Score: ${JSON.stringify(renderResult.qualityScore)}`);
      console.log(`    Word Count: ${renderResult.content.split(/\s+/).length}`);

      results.push({ topic, packageId: pkg.id, success: true });
    } catch (error) {
      console.log(`  ✗ Render failed: ${(error as Error).message}`);
      results.push({ topic, packageId: null, success: false, error: (error as Error).message });
    }
  }

  // Summary
  console.log(`\n${"=".repeat(60)}`);
  console.log("SUMMARY");
  console.log(`${"=".repeat(60)}`);
  console.log(`Total Topics: ${results.length}`);
  console.log(`Successful: ${results.filter(r => r.success).length}`);
  console.log(`Failed: ${results.filter(r => !r.success).length}`);

  if (results.filter(r => !r.success).length > 0) {
    console.log("\nFailed Topics:");
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.topic}: ${r.error}`);
    });
  }
}

main().catch(console.error);
