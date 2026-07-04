/**
 * Check discovery_sources structure
 */

import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDiscoverySources() {
  console.log("Checking existing discovery sources...");

  const { data: sources } = await supabase
    .from("discovery_sources")
    .select("*")
    .limit(5);

  console.log("Existing sources:", sources);
}

checkDiscoverySources()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
