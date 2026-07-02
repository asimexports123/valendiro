import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  "https://diwwvkbztvhwouttajha.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY"
);

async function main() {
  // Notify PostgREST to reload schema cache
  const { error } = await sb.rpc("exec_sql", {
    sql_string: "NOTIFY pgrst, 'reload schema'"
  });
  console.log("Schema reload notify:", error ? error.message : "OK");

  // Wait for cache to refresh
  console.log("Waiting 5 seconds for cache refresh...");
  await new Promise((r) => setTimeout(r, 5000));

  // Test access
  const { data, error: e2 } = await sb.from("subcategories").select("id").limit(1);
  console.log("subcategories accessible:", e2 ? "ERROR: " + e2.message : "OK (" + (data?.length || 0) + " rows)");

  const { data: d2, error: e3 } = await sb.from("subcategory_translations").select("id").limit(1);
  console.log("subcategory_translations accessible:", e3 ? "ERROR: " + e3.message : "OK");
}

main();
