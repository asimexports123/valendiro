/**
 * Check topics table schema
 */

import { createAdminClient } from "../lib/supabase/admin";

const supabase = createAdminClient();

async function checkSchema() {
  console.log("Checking topics table structure...");
  
  const { data, error } = await supabase
    .from("topics")
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
    console.log("No data in topics table");
  }
}

checkSchema()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
