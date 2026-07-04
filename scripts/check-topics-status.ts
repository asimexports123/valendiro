/**
 * Check topics status
 */

import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTopicsStatus(): Promise<void> {
  console.log("Checking topics status...");

  const { data: topics } = await supabase
    .from("topics")
    .select("slug, status")
    .limit(10);

  console.log("Topics:", topics?.length || 0);
  if (topics && topics.length > 0) {
    console.log("Sample topics:", topics);
  }
}

checkTopicsStatus()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
