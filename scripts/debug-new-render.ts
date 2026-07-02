const SUPABASE_URL = "https://diwwvkbztvhwouttajha.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY";
process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE_URL;
process.env.SUPABASE_SERVICE_ROLE_KEY = SERVICE_KEY;
process.env.ALLOW_RENDER = "true";

import { createClient } from "@supabase/supabase-js";
const sb = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
  // Check package + facts for budgeting-fundamentals
  const { data: pkg } = await sb.from("knowledge_packages").select("id, slug, status, fact_count").eq("slug","budgeting-fundamentals").maybeSingle();
  console.log("Package:", pkg);

  if (pkg) {
    const { data: facts, count } = await sb.from("knowledge_facts").select("id, statement, fact_type", { count: "exact" }).eq("package_id", pkg.id).limit(3);
    console.log("Facts count:", count);
    console.log("Sample facts:", facts);

    // Try rendering
    const { render } = await import("@/services/renderer/orchestrator");
    const result = await render({ packageId: pkg.id, format: "markdown", rendererId: "long-article", style: ["intermediate"], forceRerender: true });
    console.log("\nRender status:", result.status);
    console.log("Content length:", result.content?.length ?? 0);
    console.log("Content preview:", result.content?.slice(0, 300));
  }
}
main().catch(console.error);
