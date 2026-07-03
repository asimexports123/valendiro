/**
 * Check rendered output structure for machine-learning-basics
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

  // Get rendered output
  const { data: rendered } = await supabase
    .from("rendered_outputs")
    .select("content_html")
    .eq("topic_id", topic.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!rendered) {
    console.log("No rendered output found");
    return;
  }

  console.log("Rendered Output HTML (first 2000 chars):");
  console.log("=========================================");
  console.log(rendered.content_html.substring(0, 2000));
  console.log("\n\nHeadings found:");
  const headings = rendered.content_html.match(/<h[1-6][^>]*>.*?<\/h[1-6]>/gi) || [];
  headings.forEach(h => console.log(h));
}

main().catch(console.error);
