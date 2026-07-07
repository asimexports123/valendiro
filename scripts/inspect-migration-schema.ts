/**
 * Inspect remote production schema
 */

import { createAdminClient } from "../lib/supabase/admin";

const supabase = createAdminClient();

async function inspectSchema() {
  console.log("=" + "=".repeat(79));
  console.log("PRODUCTION SCHEMA INSPECTION");
  console.log("=".repeat(80));
  console.log();

  // Check content_generation_queue table columns
  console.log("STEP 1: CONTENT_GENERATION_QUEUE COLUMNS");
  console.log("-".repeat(80));
  const { data: sample, error: sampleError } = await supabase
    .from("content_generation_queue")
    .select("*")
    .limit(1);

  if (sampleError) {
    console.log("Error selecting sample:", sampleError.message);
  } else if (sample && sample.length > 0) {
    console.log("Sample row columns:", Object.keys(sample[0]));
    console.log("Sample row:", JSON.stringify(sample[0], null, 2));
  } else {
    console.log("Table exists but is empty");
  }
  console.log();

  // Check migration history
  console.log("STEP 2: MIGRATION HISTORY");
  console.log("-".repeat(80));
  const { data: migrations, error: migrationsError } = await supabase
    .from("supabase_migrations")
    .select("*")
    .order("version")
    .limit(20);

  if (migrationsError) {
    console.log("Error getting migrations:", migrationsError.message);
  } else {
    console.log("Applied migrations:");
    migrations.forEach((m, i) => {
      console.log(`  ${i + 1}. ${m.version} - ${m.name}`);
    });
  }
  console.log();
}

inspectSchema()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
