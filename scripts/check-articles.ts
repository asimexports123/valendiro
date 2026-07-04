/**
 * Check articles table for budgeting-fundamentals
 */

import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkArticles(): Promise<void> {
  console.log("Checking articles for budgeting-fundamentals...");

  const { data: topic } = await supabase
    .from("topics")
    .select("id")
    .eq("slug", "budgeting-fundamentals")
    .single();

  if (!topic) {
    console.log("Topic not found");
    return;
  }

  const { data: articles } = await supabase
    .from("articles")
    .select("*")
    .eq("topic_id", topic.id);

  console.log("Articles found:", articles?.length || 0);
  if (articles && articles.length > 0) {
    console.log("Sample article:", JSON.stringify(articles[0], null, 2));
  }
}

checkArticles()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
