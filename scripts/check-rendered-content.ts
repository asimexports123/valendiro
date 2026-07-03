/**
 * Check rendered_outputs content to verify Phase 15 changes
 */

process.env.ALLOW_RENDER = "true";
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://diwwvkbztvhwouttajha.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  console.log("Checking rendered_outputs content");
  console.log("===================================\n");

  const { data: topic } = await supabase
    .from("topics")
    .select("id")
    .eq("slug", "machine-learning-basics")
    .single();

  const { data: pkg } = await supabase
    .from("knowledge_packages")
    .select("id")
    .eq("topic_id", topic.id)
    .single();

  const { data: rendered } = await supabase
    .from("rendered_outputs")
    .select("id, renderer_id, renderer_version, status, quality_score, created_at")
    .eq("package_id", pkg.id)
    .order("created_at", { ascending: false })
    .limit(3);

  console.log("Rendered outputs for ML Basics:");
  rendered?.forEach((r, i) => {
    console.log(`\n${i + 1}. ID: ${r.id}`);
    console.log(`   Renderer: ${r.renderer_id} v${r.renderer_version}`);
    console.log(`   Status: ${r.status}`);
    console.log(`   Quality Score: ${r.quality_score.overall}`);
    console.log(`   Created: ${r.created_at}`);
  });

  // Get full content of latest
  const { data: latestRendered } = await supabase
    .from("rendered_outputs")
    .select("content")
    .eq("package_id", pkg.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  console.log("\n\nLatest rendered content (first 1000 chars):");
  console.log(latestRendered.content.substring(0, 1000));

  console.log("\n\nChecking for Phase 15 changes:");
  console.log(`- Has 'Sources' section: ${latestRendered.content.includes('## Sources')}`);
  console.log(`- Has 'Learning Journey' section: ${latestRendered.content.includes('Learning Journey')}`);
  console.log(`- Has 'Prerequisites' section: ${latestRendered.content.includes('Prerequisites')}`);
  console.log(`- Has '${subject}' placeholder: ${latestRendered.content.includes('${subject}')}`);
}

main().catch(console.error);
