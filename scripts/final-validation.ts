/**
 * Final validation of all 10 topics for Phase 14 production
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
  console.log("=== Phase 14 Production Validation ===\n");

  const results: Array<{
    topic: string;
    packageId: string;
    facts: number;
    citations: number;
    wordCount: number;
    qualityScore: number;
    status: string;
    passed: boolean;
  }> = [];

  for (const topic of topics) {
    console.log(`${topic}`);

    try {
      const { data: pkg } = await sb
        .from("knowledge_packages")
        .select("id")
        .eq("slug", topic)
        .single();

      if (!pkg) {
        console.log(`  ✗ Package not found`);
        continue;
      }

      const { data: facts } = await sb
        .from("knowledge_facts")
        .select("*")
        .eq("package_id", pkg.id);

      const { data: citations } = await sb
        .from("knowledge_citations")
        .select("*")
        .eq("package_id", pkg.id);

      const { data: outputs } = await sb
        .from("rendered_outputs")
        .select("*")
        .eq("package_id", pkg.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (!outputs || outputs.length === 0) {
        console.log(`  ✗ No rendered output`);
        continue;
      }

      const output = outputs[0];
      const wordCount = output.content?.split(/\s+/).length || 0;
      const qualityScore = output.quality_score?.overall || 0;
      const status = output.status;

      const passed = status === "published" && wordCount > 100 && qualityScore >= 80;

      console.log(`  ✓ ${wordCount} words, Quality: ${qualityScore}/100, Status: ${status} ${passed ? "✅ PASS" : "❌ FAIL"}`);

      results.push({
        topic,
        packageId: pkg.id,
        facts: facts?.length || 0,
        citations: citations?.length || 0,
        wordCount,
        qualityScore,
        status,
        passed,
      });
    } catch (error) {
      console.log(`  ✗ Error: ${(error as Error).message}`);
    }
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log("SUMMARY");
  console.log(`${"=".repeat(60)}`);
  console.log(`Total Topics: ${results.length}`);
  console.log(`Passed: ${results.filter(r => r.passed).length}`);
  console.log(`Failed: ${results.filter(r => !r.passed).length}`);
  console.log(`Average Quality Score: ${results.reduce((sum, r) => sum + r.qualityScore, 0) / results.length}`);
  console.log(`Average Word Count: ${results.reduce((sum, r) => sum + r.wordCount, 0) / results.length}`);

  if (results.filter(r => !r.passed).length > 0) {
    console.log("\nFailed Topics:");
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.topic}: ${r.wordCount} words, Quality: ${r.qualityScore}/100, Status: ${r.status}`);
    });
  }
}

main().catch(console.error);
