/**
 * Verify what's actually on production
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://diwwvkbztvhwouttajha.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY";

const sb = createClient(SUPABASE_URL, SERVICE_KEY);

const topics = [
  "machine-learning-basics",
  "docker-containers",
  "css-fundamentals",
];

async function main() {
  console.log("Checking production content...\n");

  for (const topic of topics) {
    console.log(`\n${topic}`);
    
    const { data: pkg } = await sb
      .from("knowledge_packages")
      .select("id")
      .eq("slug", topic)
      .single();

    if (!pkg) {
      console.log("  Package not found");
      continue;
    }

    const { data: outputs } = await sb
      .from("rendered_outputs")
      .select("*")
      .eq("package_id", pkg.id)
      .order("created_at", { ascending: false })
      .limit(1);

    if (!outputs || outputs.length === 0) {
      console.log("  No rendered output");
      continue;
    }

    const output = outputs[0];
    console.log(`  Renderer: ${output.renderer_id}`);
    console.log(`  Word count: ${output.content?.split(/\s+/).length || 0}`);
    console.log(`  Status: ${output.status}`);
    console.log(`  Created: ${output.created_at}`);
    
    if (output.renderer_id.includes("v2")) {
      console.log("  ✅ V2 Composition Engine");
    } else {
      console.log("  ❌ NOT V2 - using old renderer");
    }
  }
}

main().catch(console.error);
