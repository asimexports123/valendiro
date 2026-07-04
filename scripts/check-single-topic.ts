/**
 * Check the single topic in database
 */

import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSingleTopic(): Promise<void> {
  console.log("Checking single topic...");

  const { data: topics } = await supabase
    .from("topics")
    .select("*");

  console.log(`Found ${topics?.length || 0} topics:`);
  console.log(JSON.stringify(topics, null, 2));

  const { data: packages } = await supabase
    .from("knowledge_packages")
    .select("*");

  console.log(`\nFound ${packages?.length || 0} knowledge packages:`);
  console.log(JSON.stringify(packages, null, 2));
}

checkSingleTopic()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
