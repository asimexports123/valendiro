import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  "https://diwwvkbztvhwouttajha.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY"
);

async function runSQL(label: string, sql: string) {
  const { error } = await sb.rpc("exec_sql", { sql_string: sql });
  if (error) {
    console.log(`✗ ${label}: ${error.message}`);
    return false;
  }
  console.log(`✓ ${label}`);
  return true;
}

async function main() {
  console.log("=== Creating subcategories tables ===\n");

  await runSQL("CREATE subcategories", `
    CREATE TABLE IF NOT EXISTS subcategories (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      slug TEXT NOT NULL UNIQUE,
      category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await runSQL("CREATE subcategory_translations", `
    CREATE TABLE IF NOT EXISTS subcategory_translations (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      subcategory_id UUID NOT NULL REFERENCES subcategories(id) ON DELETE CASCADE,
      language_code TEXT NOT NULL REFERENCES languages(code) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      meta_title TEXT,
      meta_description TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (subcategory_id, language_code)
    )
  `);

  await runSQL("INDEX idx_subcategories_category", `
    CREATE INDEX IF NOT EXISTS idx_subcategories_category ON subcategories(category_id)
  `);

  await runSQL("INDEX idx_subcategories_slug", `
    CREATE INDEX IF NOT EXISTS idx_subcategories_slug ON subcategories(slug)
  `);

  // Verify
  const { data, error } = await sb.from("subcategories").select("id").limit(1);
  console.log("\nVerify subcategories accessible:", error ? "ERROR: " + error.message : "OK (table exists)");
}

main();
