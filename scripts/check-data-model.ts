/**
 * Check data model relationship between topics and articles
 */

import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDataModel() {
  // Count published topics
  const { data: topics } = await supabase
    .from("topics")
    .select("id, slug, status")
    .eq("status", "published");
  console.log(`Published topics: ${topics?.length || 0}`);

  // Count published articles
  const { data: articles } = await supabase
    .from("articles")
    .select("id, slug, status, topic_id")
    .eq("status", "published");
  console.log(`Published articles: ${articles?.length || 0}`);

  // Check if topics have knowledge packages
  const { data: packages } = await supabase
    .from("knowledge_packages")
    .select("topic_id, slug");
  console.log(`Knowledge packages: ${packages?.length || 0}`);

  // Sample topic to check structure
  if (topics && topics.length > 0) {
    const sampleTopic = topics[0];
    console.log(`\nSample topic: ${sampleTopic.slug} (id: ${sampleTopic.id})`);
    
    const { data: topicDetails } = await supabase
      .from("topics")
      .select("id, slug, content, updated_at")
      .eq("id", sampleTopic.id)
      .single();
    
    console.log(`  - Has content: ${!!topicDetails?.content}`);
    console.log(`  - Content length: ${topicDetails?.content?.length || 0}`);
    console.log(`  - Updated at: ${topicDetails?.updated_at}`);
  }

  // Sample article to check structure
  if (articles && articles.length > 0) {
    const sampleArticle = articles[0];
    console.log(`\nSample article: ${sampleArticle.slug} (id: ${sampleArticle.id}, topic_id: ${sampleArticle.topic_id})`);
  }

  // Determine which table is the primary published content
  console.log(`\nPrimary published content: ${articles && articles.length > 0 ? "articles" : "topics"}`);
}

checkDataModel()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
