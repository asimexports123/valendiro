/**
 * Check content_generation_queue
 */

import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkQueue(): Promise<void> {
  console.log("Checking content_generation_queue...");

  const { data: queueItems } = await supabase
    .from("content_generation_queue")
    .select("*")
    .limit(10);

  console.log("Queue items:", queueItems?.length || 0);
  if (queueItems && queueItems.length > 0) {
    console.log("Sample items:", JSON.stringify(queueItems.slice(0, 3), null, 2));
  }
}

checkQueue()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
