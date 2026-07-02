import { createClient } from "@supabase/supabase-js";

async function main() {
  const sb = createClient(
    "https://diwwvkbztvhwouttajha.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTg1MzY0MCwiZXhwIjoyMDUxNDI5NjQwfQ.6yZJjLh8X7XqW7XqW7XqW7XqW7XqW7XqW7XqW7XqW7Xq"
  );

  const { data } = await sb
    .from("knowledge_packages")
    .select("id, slug, status")
    .eq("status", "ready")
    .limit(20);

  console.log("Ready packages:");
  data?.forEach((p: any) => {
    console.log(`  - ${p.slug} (${p.id})`);
  });
}

main().catch(console.error);
