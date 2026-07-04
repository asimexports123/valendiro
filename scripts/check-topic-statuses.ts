/**
 * Check topic statuses in database
 */

import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTopicStatuses(): Promise<void> {
  console.log("Checking topic statuses...");

  const { data: topics } = await supabase
    .from("topics")
    .select("slug, status, content")
    .limit(20);

  if (!topics || topics.length === 0) {
    console.log("No topics found");
    return;
  }

  console.log(`Found ${topics.length} topics:`);
  for (const topic of topics) {
    console.log(`- ${topic.slug}: status=${topic.status}, content_length=${topic.content?.length || 0}`);
  }
}

checkTopicStatuses()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
