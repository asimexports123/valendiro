/**
 * Check rendered_outputs table for machine-learning-basics
 */

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://diwwvkbztvhwouttajha.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  // Get topic
  const { data: topic } = await supabase
    .from("topics")
    .select("id")
    .eq("slug", "machine-learning-basics")
    .single();

  if (!topic) {
    console.log("Topic not found");
    return;
  }

  // Get all rendered outputs
  const { data: rendered } = await supabase
    .from("rendered_outputs")
    .select("*")
    .eq("topic_id", topic.id)
    .order("created_at", { ascending: false })
    .limit(5);

  if (!rendered || rendered.length === 0) {
    console.log("No rendered outputs found");
    return;
  }

  console.log(`Found ${rendered.length} rendered outputs\n`);
  
  for (const output of rendered) {
    console.log(`ID: ${output.id}`);
    console.log(`Renderer ID: ${output.renderer_id}`);
    console.log(`Created: ${output.created_at}`);
    console.log(`Content length: ${output.content_html?.length || 0}`);
    
    if (output.content_html) {
      const headings = output.content_html.match(/<h[1-6][^>]*>.*?<\/h[1-6]>/gi) || [];
      console.log(`Headings: ${headings.join(", ")}`);
    }
    console.log("---");
  }
}

main().catch(console.error);
