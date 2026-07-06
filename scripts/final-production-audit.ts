/**
 * FINAL PRODUCTION AUDIT
 * Only verify current production state - no code changes
 */

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://diwwvkbztvhwouttajha.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY";

import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  "https://diwwvkbztvhwouttajha.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY"
);

const TEST_URLS = [
  '/en/topics/python-programming-fundamentals',
  '/en/topics/git-version-control',
  '/en/topics/html-fundamentals',
  '/en/topics/javascript-fundamentals',
  '/en/topics/restful-apis',
  '/en/topics/sql-fundamentals',
  '/en/topics/software-testing',
  '/en/topics/machine-learning-fundamentals',
  '/en/topics/business-strategy-fundamentals',
  '/en/topics/effective-study-techniques'
];

async function main() {
  console.log("=== FINAL PRODUCTION AUDIT ===\n");

  // DATABASE FACTS
  console.log("DATABASE");
  console.log("-------");

  const { count: totalTopics } = await sb.from("topics").select("*", { count: "exact", head: true });
  console.log(`1. Total topics: ${totalTopics}`);

  const { count: publishedTopics } = await sb.from("topics").select("*", { count: "exact", head: true }).eq("status", "published");
  console.log(`2. Total published topics: ${publishedTopics}`);

  const { count: totalPackages } = await sb.from("knowledge_packages").select("*", { count: "exact", head: true });
  console.log(`3. Total Knowledge Packages: ${totalPackages}`);

  const { count: totalRenderedOutputs } = await sb.from("rendered_outputs").select("*", { count: "exact", head: true });
  console.log(`4. Total rendered_outputs: ${totalRenderedOutputs}`);

  const { data: renderedOutputs } = await sb.from("rendered_outputs").select("content");
  const withHTML = renderedOutputs?.filter(r => r.content && (r.content.includes('<') || r.content.length > 500)).length || 0;
  const withoutHTML = (totalRenderedOutputs || 0) - withHTML;
  console.log(`5. rendered_outputs with HTML: ${withHTML}`);
  console.log(`6. rendered_outputs without HTML: ${withoutHTML}`);

  const { data: topicTranslations } = await sb.from("topic_translations").select("content").eq("language_code", "en");
  const withHTMLTranslations = topicTranslations?.filter(t => t.content && (t.content.includes('<') || t.content.length > 500)).length || 0;
  console.log(`7. topic_translations with HTML: ${withHTMLTranslations}`);

  const { data: linkedTopics } = await sb.from("knowledge_packages").select("topic_id").not("topic_id", "is", null);
  const uniqueLinkedTopics = new Set(linkedTopics?.map(p => p.topic_id) || []).size;
  console.log(`8. Topics linked to Knowledge Packages: ${uniqueLinkedTopics}`);

  console.log("\nPRODUCTION");
  console.log("---------");

  const urlResults = [];

  for (const url of TEST_URLS) {
    try {
      const response = await fetch(`https://valendiro.com${url}`);
      const content = await response.text();
      
      const titleMatch = content.match(/<title>(.*?)<\/title>/);
      const title = titleMatch ? titleMatch[1] : "No title";
      const renders = response.status === 200 && content.length > 1000;
      const htmlLength = content.length;
      
      const hasRendererBug = content.includes("headers:{type:") || content.includes("debug") || content.includes("undefined");
      const hasRawCode = content.includes("```") && !content.includes("<div class=\"code\"");
      const h1Matches = content.match(/<h1/g);
      const hasDuplicateH1 = h1Matches && h1Matches.length > 1;
      const hasReferences = content.includes("References") || content.includes("## Sources");
      const hasTOC = content.includes("Table of Contents") || content.includes("toc");

      console.log(`\n${url}`);
      console.log(`   HTTP Status: ${response.status}`);
      console.log(`   Page Title: ${title}`);
      console.log(`   Article renders? ${renders ? "YES" : "NO"}`);
      console.log(`   Approx HTML length: ${htmlLength}`);
      console.log(`   Any renderer bug? ${hasRendererBug ? "YES" : "NO"}`);
      console.log(`   Any raw code? ${hasRawCode ? "YES" : "NO"}`);
      console.log(`   Duplicate H1? ${hasDuplicateH1 ? "YES" : "NO"}`);
      console.log(`   References section? ${hasReferences ? "YES" : "NO"}`);
      console.log(`   TOC works? ${hasTOC ? "YES" : "NO"}`);

      urlResults.push({
        url,
        status: response.status,
        title,
        renders,
        htmlLength,
        hasRendererBug,
        hasRawCode,
        hasDuplicateH1,
        hasReferences,
        hasTOC
      });
    } catch (e: any) {
      console.log(`\n${url}`);
      console.log(`   HTTP Status: ERROR`);
      console.log(`   Page Title: ERROR`);
      console.log(`   Article renders? NO`);
      console.log(`   Approx HTML length: 0`);
      console.log(`   Any renderer bug? UNKNOWN`);
      console.log(`   Any raw code? UNKNOWN`);
      console.log(`   Duplicate H1? UNKNOWN`);
      console.log(`   References section? UNKNOWN`);
      console.log(`   TOC works? UNKNOWN`);

      urlResults.push({
        url,
        status: "ERROR",
        title: "ERROR",
        renders: false,
        htmlLength: 0,
        hasRendererBug: false,
        hasRawCode: false,
        hasDuplicateH1: false,
        hasReferences: false,
        hasTOC: false
      });
    }
  }

  console.log("\nQUALITY");
  console.log("-------");

  const { data: allTranslations } = await sb.from("topic_translations").select("content").eq("language_code", "en");

  let duplicateArticles = 0;
  let placeholderArticles = 0;
  let rawMarkdown = 0;
  let rendererArtifacts = 0;
  let brokenTOC = 0;
  let duplicateH1 = 0;
  let missingReferences = 0;
  let noArticlesYet = 0;

  const contentHashes = new Map<string, number>();

  if (allTranslations) {
    for (const item of allTranslations) {
      const content = item.content || "";

      const hash = content.slice(0, 500);
      if (contentHashes.has(hash)) {
        duplicateArticles++;
      } else {
        contentHashes.set(hash, 1);
      }

      if (content.includes("No articles yet") || content.includes("Coming soon") || content.length < 200) {
        placeholderArticles++;
      }

      if (content.includes("No articles yet")) {
        noArticlesYet++;
      }

      if (content.includes("headers:{type:") || content.includes("debug") || content.includes("undefined")) {
        rendererArtifacts++;
      }

      if (content.includes("```") && !content.includes("<div")) {
        rawMarkdown++;
      }

      const h1Matches = content.match(/^# /gm);
      if (h1Matches && h1Matches.length > 1) {
        duplicateH1++;
      }

      if (content.includes("## Table of Contents") && !content.includes("- [")) {
        brokenTOC++;
      }

      if (content.length > 1000 && !content.includes("References") && !content.includes("## Sources")) {
        missingReferences++;
      }
    }
  }

  console.log(`Duplicate articles: ${duplicateArticles}`);
  console.log(`Placeholder articles: ${placeholderArticles}`);
  console.log(`Raw markdown: ${rawMarkdown}`);
  console.log(`Renderer artifacts: ${rendererArtifacts}`);
  console.log(`Broken TOC: ${brokenTOC}`);
  console.log(`Duplicate H1: ${duplicateH1}`);
  console.log(`Missing references: ${missingReferences}`);
  console.log(`"No articles yet": ${noArticlesYet}`);

  console.log("\nFINAL STATUS");
  console.log("-----------");

  const urlSuccess = urlResults.filter(r => r.renders).length;
  const completionPercentage = ((urlSuccess / 10) * 100).toFixed(2);
  console.log(`Production Completion %: ${completionPercentage}%`);

  const blockers = [
    { issue: "Placeholder articles", count: placeholderArticles },
    { issue: "Missing references", count: missingReferences },
    { issue: "Renderer artifacts", count: rendererArtifacts },
    { issue: "Broken TOC", count: brokenTOC },
    { issue: "Duplicate H1", count: duplicateH1 },
    { issue: "Raw markdown", count: rawMarkdown },
    { issue: "Duplicate articles", count: duplicateArticles },
    { issue: "No articles yet", count: noArticlesYet }
  ].sort((a, b) => b.count - a.count);

  console.log("\nTop 10 remaining blockers:");
  blockers.slice(0, 10).forEach((b, i) => {
    console.log(`${i + 1}. ${b.issue}: ${b.count}`);
  });

  console.log(`\nNext highest-priority production issue: ${blockers[0]?.issue || "None"} (${blockers[0]?.count || 0} affected)`);
}

main().catch(console.error);
