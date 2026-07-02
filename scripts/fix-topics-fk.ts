process.env.NEXT_PUBLIC_SUPABASE_URL = "https://diwwvkbztvhwouttajha.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY";

import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  "https://diwwvkbztvhwouttajha.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY"
);

async function run(label: string, sql: string) {
  const { error } = await sb.rpc("exec_sql", { sql_string: sql });
  console.log(error ? `  ✗ ${label}: ${error.message}` : `  ✓ ${label}`);
  return !error;
}

async function main() {
  console.log("=== Fix topics FK constraint ===\n");

  await run(
    "Drop old FK topics_collection_id_fkey",
    `ALTER TABLE topics DROP CONSTRAINT IF EXISTS topics_collection_id_fkey;`
  );

  await run(
    "Add new FK topics_subcategory_id_fkey → subcategories",
    `ALTER TABLE topics ADD CONSTRAINT topics_subcategory_id_fkey FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE SET NULL;`
  );

  // Verify by inserting a test row
  const { error } = await sb.from("topics").insert({
    slug: "__fk_test__",
    canonical_path: "/fk-test",
    subcategory_id: "c2958e16-3155-4946-95fd-816ead05e8d9",
    status: "draft",
  });

  if (!error) {
    console.log("  ✓ Test insert succeeded — FK works");
    await sb.from("topics").delete().eq("slug", "__fk_test__");
    console.log("  ✓ Test row cleaned up");
  } else {
    console.log(`  ✗ Test insert failed: ${error.message}`);
  }

  console.log("\n=== Done ===");
}

main().catch(console.error);
