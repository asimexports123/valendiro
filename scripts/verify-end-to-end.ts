/**
 * Phase 29A - End-to-end verification
 * Compare database content vs live site content
 */

import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyTopic(slug: string) {
  console.log(`\n=== Verifying ${slug} ===\n`);

  // Get database content
  const { data: topic } = await supabase
    .from("topics")
    .select("id, content, updated_at")
    .eq("slug", slug)
    .single();

  if (!topic) {
    console.log("Topic not found in database");
    return;
  }

  console.log("DATABASE CONTENT:");
  console.log(`Updated at: ${topic.updated_at}`);
  console.log(`Content length: ${topic.content?.length || 0} characters`);
  console.log(`\nFirst 300 characters:\n${topic.content?.substring(0, 300)}...`);
  
  // Check for placeholders in database
  const hasPlaceholders = /key point \d+ about|example \d+|placeholder/i.test(topic.content || "");
  console.log(`\nHas placeholders in database: ${hasPlaceholders}`);

  // Get live site content
  const liveUrl = `https://valendiro.com/en/topics/${slug}`;
  console.log(`\nLIVE URL: ${liveUrl}`);
  
  try {
    const response = await fetch(liveUrl);
    const text = await response.text();
    console.log(`\nLive page length: ${text.length} characters`);
    
    // Extract prose content (actual article content)
    const proseMatch = text.match(/<div[^>]*class="[^"]*prose[^"]*"[^>]*>([\s\S]*?)<\/div>/);
    const liveContent = proseMatch ? proseMatch[1] : text;
    
    // Remove HTML tags for comparison
    const liveText = liveContent.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    const dbText = (topic.content || '').replace(/\s+/g, ' ').trim();
    
    console.log(`\nLive text (first 300 chars):\n${liveText.substring(0, 300)}...`);
    console.log(`\nDatabase text (first 300 chars):\n${dbText.substring(0, 300)}...`);
    
    // Check if database content appears in live site
    const dbSnippet = dbText.substring(0, 100);
    const dbInLive = liveText.includes(dbSnippet);
    
    console.log(`\nMATCH STATUS:`);
    console.log(`Database snippet in live site: ${dbInLive ? "YES" : "NO"}`);
    console.log(`Database content length: ${dbText.length}`);
    console.log(`Live text length: ${liveText.length}`);
    
    // Check for placeholders in live site
    const liveHasPlaceholders = /key point \d+ about|example \d+|placeholder/i.test(liveText);
    console.log(`Has placeholders on live site: ${liveHasPlaceholders}`);
    
    // Detailed match check
    if (dbInLive) {
      console.log(`\n✅ LIVE SITE IS SERVING REGENERATED CONTENT`);
    } else {
      console.log(`\n❌ LIVE SITE IS NOT SERVING REGENERATED CONTENT`);
    }
    
  } catch (error) {
    console.log(`\nError fetching live site: ${error}`);
  }
}

async function main() {
  const topics = ["python-programming-fundamentals", "git-version-control", "investing-basics"];
  
  for (const slug of topics) {
    await verifyTopic(slug);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
