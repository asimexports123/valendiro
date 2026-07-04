/**
 * Test getTopicBySlug function to verify it returns content
 */

import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

import { createClient } from "@supabase/supabase-js";
import { getTopicBySlug } from "../services/public/publicData";

const supabase = createClient(supabaseUrl, supabaseKey);

async function testGetTopicBySlug(): Promise<void> {
  console.log("Testing getTopicBySlug for budgeting-fundamentals...");

  try {
    const topic = await getTopicBySlug("budgeting-fundamentals");
    console.log("Topic result:", JSON.stringify(topic, null, 2));
    console.log("Content length:", topic?.content?.length || 0);
    console.log("Content preview:", topic?.content?.substring(0, 200) || "No content");
  } catch (error) {
    console.error("Error:", error);
  }
}

testGetTopicBySlug()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
