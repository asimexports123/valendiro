/**
 * P0 Production Verification
 * Verify current production state
 */

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://diwwvkbztvhwouttajha.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY";

import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  "https://diwwvkbztvhwouttajha.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY"
);

async function main() {
  console.log("=== P0 Production Verification ===\n");

  // 1. Total topics
  const { count: totalTopics } = await sb
    .from("topics")
    .select("*", { count: "exact", head: true });

  // 2. Total published topics
  const { count: publishedTopics } = await sb
    .from("topics")
    .select("*", { count: "exact", head: true })
    .eq("status", "published");

  // 3. Total topics with rendered HTML
  const { data: topicsWithContent } = await sb
    .from("topic_translations")
    .select("topic_id")
    .not("content", "is", null)
    .eq("language_code", "en");

  // 4. Total topics with live URLs
  const { data: topicsWithSlugs } = await sb
    .from("topics")
    .select("slug")
    .eq("status", "published")
    .not("slug", "is", null);

  // 5. Total topics showing "No articles yet"
  const { data: noArticles } = await sb
    .from("topic_translations")
    .select("topic_id")
    .eq("content", "No articles yet")
    .eq("language_code", "en");

  // 6 & 7. Rendered outputs by content length
  const { data: renderedOutputs } = await sb
    .from("rendered_outputs")
    .select("content");
  
  const longContent = renderedOutputs?.filter(r => r.content && r.content.length > 1000).length || 0;
  const veryLongContent = renderedOutputs?.filter(r => r.content && r.content.length > 5000).length || 0;

  // 8. Test 20 random production URLs
  const { data: randomTopics } = await sb
    .from("topics")
    .select("slug")
    .eq("status", "published")
    .limit(50);

  const shuffled = randomTopics?.sort(() => Math.random() - 0.5).slice(0, 20) || [];
  
  console.log("Testing 20 random production URLs:\n");
  let urlSuccess = 0;
  const urlResults = [];

  for (const topic of shuffled) {
    try {
      const response = await fetch(`https://valendiro.com/en/topics/${topic.slug}`);
      const content = await response.text();
      const contentLength = content.length;
      const actuallyRenders = response.status === 200 && contentLength > 1000;
      
      if (actuallyRenders) urlSuccess++;
      
      urlResults.push({
        slug: topic.slug,
        status: response.status,
        contentLength,
        actuallyRenders
      });
      
      console.log(`${topic.slug}: ${response.status}, ${contentLength} chars, renders: ${actuallyRenders}`);
    } catch (e: any) {
      console.log(`${topic.slug}: ERROR - ${e.message}`);
      urlResults.push({
        slug: topic.slug,
        status: "ERROR",
        contentLength: 0,
        actuallyRenders: false
      });
    }
  }

  // 9-15. Content quality checks
  const { data: allContent } = await sb
    .from("topic_translations")
    .select("content, topic_id, topics!inner(slug)")
    .eq("language_code", "en");

  let duplicateArticles = 0;
  let placeholderArticles = 0;
  let rendererBugs = 0;
  let rawMarkdown = 0;
  let duplicateH1 = 0;
  let brokenTOC = 0;
  let missingReferences = 0;

  const contentHashes = new Map<string, number>();

  if (allContent) {
    for (const item of allContent) {
      const content = item.content || "";
      const slug = item.topics?.slug || "unknown";

      // Duplicate articles
      const hash = content.slice(0, 500);
      if (contentHashes.has(hash)) {
        duplicateArticles++;
      } else {
        contentHashes.set(hash, 1);
      }

      // Placeholder articles
      if (content.includes("No articles yet") || content.includes("Coming soon") || content.length < 200) {
        placeholderArticles++;
      }

      // Renderer bugs
      if (content.includes("headers:{type:") || content.includes("debug") || content.includes("undefined")) {
        rendererBugs++;
      }

      // Raw markdown
      if (content.includes("```") && !content.includes("<div")) {
        rawMarkdown++;
      }

      // Duplicate H1
      const h1Matches = content.match(/^# /gm);
      if (h1Matches && h1Matches.length > 1) {
        duplicateH1++;
      }

      // Broken TOC
      if (content.includes("## Table of Contents") && !content.includes("- [")) {
        brokenTOC++;
      }

      // Missing references
      if (content.length > 1000 && !content.includes("References") && !content.includes("## Sources")) {
        missingReferences++;
      }
    }
  }

  // 16. Production completion percentage
  const completionPercentage = ((urlSuccess / 20) * 100).toFixed(2);

  console.log(`\n=== DATABASE FACTS ===`);
  console.log(`1. Total topics: ${totalTopics}`);
  console.log(`2. Total published topics: ${publishedTopics}`);
  console.log(`3. Total topics with rendered HTML: ${topicsWithContent?.length || 0}`);
  console.log(`4. Total topics with live URLs: ${topicsWithSlugs?.length || 0}`);
  console.log(`5. Total topics showing "No articles yet": ${noArticles?.length || 0}`);
  console.log(`6. Total rendered_outputs with content >1000 chars: ${longContent}`);
  console.log(`7. Total rendered_outputs with content >5000 chars: ${veryLongContent}`);
  console.log(`8. Production URLs tested: 20`);
  console.log(`   Successfully rendering: ${urlSuccess}/20`);
  console.log(`9. Duplicate articles: ${duplicateArticles}`);
  console.log(`10. Placeholder articles: ${placeholderArticles}`);
  console.log(`11. Articles with renderer bugs: ${rendererBugs}`);
  console.log(`12. Articles with raw markdown: ${rawMarkdown}`);
  console.log(`13. Articles with duplicate H1: ${duplicateH1}`);
  console.log(`14. Articles with broken TOC: ${brokenTOC}`);
  console.log(`15. Articles missing references: ${missingReferences}`);
  console.log(`16. Production completion percentage: ${completionPercentage}%`);
}

main().catch(console.error);
