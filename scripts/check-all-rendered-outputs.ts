/**
 * Check all rendered outputs in the table
 */

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://diwwvkbztvhwouttajha.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  // Get all rendered outputs
  const { data: rendered, error } = await supabase
    .from("rendered_outputs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    console.log("Error:", error.message);
    return;
  }

  if (!rendered || rendered.length === 0) {
    console.log("No rendered outputs found in table");
    return;
  }

  console.log(`Found ${rendered.length} rendered outputs:\n`);
  
  for (const output of rendered) {
    console.log(`ID: ${output.id}`);
    console.log(`Package ID: ${output.package_id}`);
    console.log(`Renderer ID: ${output.renderer_id}`);
    console.log(`Status: ${output.status}`);
    console.log(`Created: ${output.created_at}`);
    console.log(`Content length: ${output.content?.length || 0}`);
    
    if (output.content) {
      const headings = output.content.match(/<h[1-6][^>]*>.*?<\/h[1-6]>/gi) || [];
      console.log(`Headings (${headings.length}): ${headings.slice(0, 5).join(", ")}`);
    }
    console.log("---");
  }
}

main().catch(console.error);
