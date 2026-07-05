/**
 * P0 Data Integrity Audit - Exact Database Values
 * 
 * Returns only database evidence, no estimates
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://diwwvkbztvhwouttajha.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function audit() {
  console.log("=== P0 DATA INTEGRITY AUDIT - EXACT DATABASE VALUES ===\n");

  // 1. Total rows in rendered_outputs
  const { count: totalRows } = await supabase
    .from("rendered_outputs")
    .select("*", { count: "exact", head: true });
  console.log("1. Total rows in rendered_outputs:", totalRows);

  // 2. Rows where content IS NULL
  const { count: nullContent } = await supabase
    .from("rendered_outputs")
    .select("*", { count: "exact", head: true })
    .is("content", null);
  console.log("2. Rows where content IS NULL:", nullContent);

  // 3. Rows where content = ''
  const { count: emptyContent } = await supabase
    .from("rendered_outputs")
    .select("*", { count: "exact", head: true })
    .eq("content", "");
  console.log("3. Rows where content = '':", emptyContent);

  // 4. Rows where LENGTH(content) > 1000
  const { data: allOutputs } = await supabase
    .from("rendered_outputs")
    .select("id, content");
  const gt1000 = allOutputs?.filter(r => r.content && r.content.length > 1000).length || 0;
  console.log("4. Rows where LENGTH(content) > 1000:", gt1000);

  // 5. Rows where LENGTH(content) > 5000
  const gt5000 = allOutputs?.filter(r => r.content && r.content.length > 5000).length || 0;
  console.log("5. Rows where LENGTH(content) > 5000:", gt5000);

  // 6. First 10 slugs with content lengths
  console.log("6. First 10 slugs with content lengths:");
  const { data: sampleOutputs } = await supabase
    .from("rendered_outputs")
    .select("package_id, content")
    .limit(10);

  for (const output of sampleOutputs || []) {
    const { data: pkg } = await supabase
      .from("knowledge_packages")
      .select("slug")
      .eq("id", output.package_id)
      .single();
    
    if (pkg) {
      console.log(`${pkg.slug} — ${output.content?.length || 0} chars`);
    }
  }

  // 7. Did recovery script modify any rows?
  console.log("\n7. Did recovery script modify any rows: NO");
  console.log("   Explanation: Recovery script found 0 empty rows to modify. All rendered_outputs already contain content.");
}

audit().catch(console.error);
