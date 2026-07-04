/**
 * Check knowledge package content for budgeting-fundamentals
 */

import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkKnowledgePackage(): Promise<void> {
  console.log("Checking knowledge package for budgeting-fundamentals...");

  const { data: packageData } = await supabase
    .from("knowledge_packages")
    .select("*")
    .eq("topic_slug", "budgeting-fundamentals")
    .single();

  if (!packageData) {
    console.log("No knowledge package found");
    return;
  }

  console.log("Knowledge package found");
  console.log("Package:", JSON.stringify(packageData.package, null, 2));
}

checkKnowledgePackage()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
