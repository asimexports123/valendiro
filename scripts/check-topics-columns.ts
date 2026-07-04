/**
 * Check topics table schema
 */

import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema(): Promise<void> {
  console.log("Checking topics table schema...");

  const { data: topics } = await supabase
    .from("topics")
    .select("*")
    .limit(1);

  if (topics && topics.length > 0) {
    console.log("Topics table columns:", Object.keys(topics[0]));
    console.log("Sample topic:", JSON.stringify(topics[0], null, 2));
  }
}

checkSchema()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
