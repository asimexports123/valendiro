/**
 * Check knowledge_packages structure
 */

import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPackages() {
  console.log("Checking existing knowledge packages...");

  const { data: packages } = await supabase
    .from("knowledge_packages")
    .select("*")
    .limit(3);

  console.log("Existing packages:", JSON.stringify(packages, null, 2));
}

checkPackages()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
