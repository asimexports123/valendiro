/**
 * Check if topic_translations was updated by migration
 */

import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTranslations() {
  const topics = ["python-programming-fundamentals", "git-version-control", "investing-basics"];
  
  for (const slug of topics) {
    console.log(`\n=== ${slug} ===`);
    
    const { data: topic } = await supabase
      .from("topics")
      .select("id, content, updated_at")
      .eq("slug", slug)
      .single();
    
    if (!topic) {
      console.log("Topic not found");
      continue;
    }
    
    console.log(`TOPICS.CONTENT updated at: ${topic.updated_at}`);
    console.log(`TOPICS.CONTENT length: ${topic.content?.length || 0}`);
    console.log(`TOPICS.CONTENT first 200 chars: ${topic.content?.substring(0, 200)}...`);
    
    const { data: translation } = await supabase
      .from("topic_translations")
      .select("content, updated_at")
      .eq("topic_id", topic.id)
      .eq("language_code", "en")
      .maybeSingle();
    
    if (!translation) {
      console.log("Translation not found");
      continue;
    }
    
    console.log(`\nTRANSLATIONS.CONTENT updated at: ${translation.updated_at}`);
    console.log(`TRANSLATIONS.CONTENT length: ${translation.content?.length || 0}`);
    console.log(`TRANSLATIONS.CONTENT first 200 chars: ${translation.content?.substring(0, 200)}...`);
    
    const match = topic.content === translation.content;
    console.log(`\nTopics and translations match: ${match}`);
  }
}

checkTranslations()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
