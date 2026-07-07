/**
 * Check knowledge_packages table schema
 */

import { createAdminClient } from "../lib/supabase/admin";

const supabase = createAdminClient();

async function checkSchema() {
  console.log("Checking knowledge_packages table schema...");

  const { data, error } = await supabase
    .from("knowledge_packages")
    .select("*")
    .limit(1);

  if (error) {
    console.error("Error:", error);
    return;
  }

  if (data && data.length > 0) {
    console.log("Sample row:", data[0]);
    console.log("Columns:", Object.keys(data[0]));
  } else {
    console.log("No data in knowledge_packages table");
  }
}

checkSchema()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
