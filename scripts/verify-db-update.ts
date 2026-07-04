/**
 * Verify database updates persisted
 */

import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(supabaseUrl, supabaseKey);

const TOPICS = [
  "python-programming-fundamentals",
];

async function verifyUpdates() {
  for (const slug of TOPICS) {
    console.log(`\n=== ${slug} ===`);
    
    const { data: topic } = await supabase
      .from("topics")
      .select("id, content, updated_at")
      .eq("slug", slug)
      .single();
    
    console.log(`Topic content length: ${topic?.content?.length || 0}`);
    console.log(`Topic updated_at: ${topic?.updated_at}`);
    console.log(`Has "Python is a high-level": ${topic?.content?.includes("Python is a high-level") ? "YES" : "NO"}`);
    
    const { data: translations } = await supabase
      .from("topic_translations")
      .select("content, updated_at")
      .eq("topic_id", topic?.id)
      .eq("language_code", "en")
      .single();
    
    console.log(`Translation content length: ${translations?.content?.length || 0}`);
    console.log(`Translation updated_at: ${translations?.updated_at}`);
    console.log(`Has "Python is a high-level": ${translations?.content?.includes("Python is a high-level") ? "YES" : "NO"}`);
  }
}

verifyUpdates()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
