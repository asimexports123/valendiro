import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://diwwvkbztvhwouttajha.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY";
process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE_URL;
process.env.SUPABASE_SERVICE_ROLE_KEY = SERVICE_KEY;
process.env.ALLOW_RENDER = "true";

const sb = createClient(SUPABASE_URL, SERVICE_KEY);
const slug = process.argv[2] || "agile-development";

async function main() {
  const { render } = await import("@/services/renderer/orchestrator");
  const { data: pkg } = await sb.from("knowledge_packages").select("id").eq("slug", slug).single();
  if (!pkg) { console.log("Not found:", slug); return; }
  const result = await render({ packageId: pkg.id, format: "markdown", rendererId: "long-article", style: ["intermediate"], forceRerender: true });
  console.log(result.content);
}
main().catch(console.error);
