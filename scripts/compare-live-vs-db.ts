/**
 * Compare live site HTML with database content
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://diwwvkbztvhwouttajha.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY";

const sb = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
  console.log("=== LIVE SITE VS DATABASE COMPARISON ===\n");

  const slug = "machine-learning-basics";

  // Get database content
  const { data: topic } = await sb
    .from("topics")
    .select("id")
    .eq("slug", slug)
    .single();

  if (!topic) {
    console.log("Topic not found");
    return;
  }

  const { data: translation } = await sb
    .from("topic_translations")
    .select("content")
    .eq("topic_id", topic.id)
    .eq("language_code", "en")
    .single();

  const dbContent = translation?.content || "";
  const dbWords = dbContent.split(/\s+/).length;
  const dbPreview = dbContent.substring(0, 500);

  console.log("DATABASE CONTENT:");
  console.log(`  Words: ${dbWords}`);
  console.log(`  Preview: ${dbPreview}...\n`);

  // Get live site content
  const response = await fetch(`https://valendiro.com/en/topics/${slug}`);
  const html = await response.text();
  const liveWords = html.split(/\s+/).length;
  const livePreview = html.substring(0, 500);

  console.log("LIVE SITE HTML:");
  console.log(`  Words: ${liveWords}`);
  console.log(`  Preview: ${livePreview}...\n`);

  // Check if DB content is in live site
  const dbContentEscaped = dbContent.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const dbInLive = html.includes(dbContent) || html.includes(dbContentEscaped) || html.includes(dbContent.substring(0, 200));
  
  console.log("COMPARISON:");
  console.log(`  DB content in live site: ${dbInLive ? "YES" : "NO"}`);
  
  if (dbInLive) {
    console.log(`  ✅ Live site IS serving the v2 content from database`);
  } else {
    console.log(`  ❌ Live site is NOT serving the v2 content`);
    console.log(`  This indicates a caching or ISR issue`);
  }

  // Check for v1 indicators
  const hasOldIndicators = html.includes("long-article") && !html.includes("long-article-v2");
  console.log(`  Has v1 indicators: ${hasOldIndicators ? "YES" : "NO"}`);

  console.log("\n=== COMPARISON COMPLETE ===");
}

main().catch(console.error);
