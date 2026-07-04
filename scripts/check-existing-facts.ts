/**
 * Check existing knowledge_facts to understand schema
 */

import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkExistingFacts() {
  console.log("Checking existing knowledge_facts...");

  const { data: facts } = await supabase
    .from("knowledge_facts")
    .select("*")
    .limit(3);

  if (facts && facts.length > 0) {
    console.log("Fact columns:", Object.keys(facts[0]));
    console.log("Sample fact:", JSON.stringify(facts[0], null, 2));
  } else {
    console.log("No facts found");
  }
}

checkExistingFacts()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
