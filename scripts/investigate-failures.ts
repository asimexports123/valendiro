/**
 * Investigate failed article renders
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
  console.log("=== Investigating Failed Article Renders ===\n");

  for (const topic of topics) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`Topic: ${topic}`);
    console.log(`${"=".repeat(60)}`);

    try {
      // Get package info
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
      console.log(`  Knowledge Hash: ${pkg.knowledge_hash?.length || 0} chars`);

      // Get facts
      const { data: facts } = await sb
        .from("knowledge_facts")
        .select("*")
        .eq("package_id", pkg.id);

      console.log(`  Facts: ${facts?.length || 0}`);

      // Get citations
      const { data: citations } = await sb
        .from("knowledge_citations")
        .select("*")
        .eq("package_id", pkg.id);

      console.log(`  Citations: ${citations?.length || 0}`);

      // Get rendered output
      const { data: outputs } = await sb
        .from("rendered_outputs")
        .select("*")
        .eq("package_id", pkg.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (outputs && outputs.length > 0) {
        const output = outputs[0];
        console.log(`  Render Status: ${output.status}`);
        console.log(`  Renderer ID: ${output.renderer_id}`);
        console.log(`  Output Length: ${output.content?.length || 0} chars`);
        console.log(`  Word Count: ${output.content?.split(/\s+/).length || 0} words`);
        console.log(`  Quality Score: ${output.quality_score ? JSON.stringify(output.quality_score) : 'N/A'}`);
        
        if (output.content && output.content.length < 100) {
          console.log(`  ⚠️ SHORT OUTPUT DETECTED`);
          console.log(`  Content preview: ${output.content.substring(0, 200)}`);
        }
      } else {
        console.log("  No rendered output found");
      }

      // Check schema for title column
      const { data: pkgRow } = await sb
        .from("knowledge_packages")
        .select("title")
        .eq("slug", topic)
        .maybeSingle();

      if (pkgRow && pkgRow.title) {
        console.log(`  Title column exists: ${pkgRow.title}`);
      } else {
        console.log(`  ⚠️ Title column missing or null`);
      }

    } catch (error) {
      console.log(`  ✗ Error: ${(error as Error).message}`);
    }
  }
}

main().catch(console.error);
