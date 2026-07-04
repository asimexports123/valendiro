/**
 * Check topic_translations table
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

async function checkTranslations() {
  for (const slug of TOPICS) {
    console.log(`\n=== ${slug} ===`);
    
    const { data: topic } = await supabase
      .from("topics")
      .select("id, content")
      .eq("slug", slug)
      .single();
    
    console.log(`Topic content length: ${topic?.content?.length || 0}`);
    console.log(`Topic content preview: ${topic?.content?.substring(0, 200)}...`);
    
    const { data: translations } = await supabase
      .from("topic_translations")
      .select("*")
      .eq("topic_id", topic?.id)
      .eq("language_code", "en");
    
    console.log(`Translations found: ${translations?.length || 0}`);
    
    if (translations && translations.length > 0) {
      console.log(`Translation content length: ${translations[0].content?.length || 0}`);
      console.log(`Translation content preview: ${translations[0].content?.substring(0, 200)}...`);
    }
  }
}

checkTranslations()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
