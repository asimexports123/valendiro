/**
 * Check if budgeting-fundamentals has content in database
 */

import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTopicContent(): Promise<void> {
  console.log("Checking budgeting-fundamentals content...");

  const { data: topic } = await supabase
    .from("topics")
    .select("*")
    .eq("slug", "budgeting-fundamentals")
    .single();

  console.log("Topic data:", topic);
  console.log("Content length:", topic?.content?.length || 0);
  console.log("Content preview:", topic?.content?.substring(0, 500) || "No content");
}

checkTopicContent()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
