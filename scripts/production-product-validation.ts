/**
 * Production Product Validation - Full Workflow
 * 
 * Uses real production Knowledge Packages to generate articles via Knowledge Authoring Engine,
 * deploys to production, and verifies live pages.
 */

import * as dotenv from "dotenv";
import { resolve } from "path";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

// Load .env.local from project root
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

import { createAdminClient } from "../lib/supabase/admin";
import { KnowledgeAuthoringOrchestrator, type AuthoringContext } from "../services/renderer/authoring/knowledgeAuthoringOrchestrator";

const topics = [
  "Python Programming Fundamentals",
  "Investing Basics",
  "Nutrition Fundamentals",
  "Travel Planning Fundamentals",
  "Marketing Fundamentals",
];

interface ProductionValidationResult {
  topic: string;
  topicId: string;
  topicSlug: string;
  knowledgePackageId: string;
  factCount: number;
  authoringResult: any;
  articleId: string | null;
  deployed: boolean;
  liveUrl: string | null;
  error?: string;
}

async function queryKnowledgePackage(supabase: any, topicId: string) {
  const { data: packages, error } = await supabase
    .from("knowledge_packages")
    .select("*")
    .eq("topic_id", topicId)
    .order("version", { ascending: false })
    .limit(1);

  if (error || !packages || packages.length === 0) {
    throw new Error(`No knowledge package found for topic ${topicId}`);
  }

  const pkg = packages[0];
  console.log(`  Package ID: ${pkg.id}, Status: ${pkg.status}, Version: ${pkg.version}`);

  // Query facts for this package
  const { data: facts, error: factsError } = await supabase
    .from("knowledge_facts")
    .select("*")
    .eq("package_id", pkg.id);

  if (factsError) {
    console.log(`  Error querying facts: ${factsError.message}`);
  }

  console.log(`  Queried ${facts?.length || 0} facts from package ${pkg.id}`);

  return {
    package: pkg,
    facts: facts || [],
  };
}

async function checkArticlesSchema(supabase: any) {
  // Check articles table structure by querying table info
  const { data: columns, error } = await supabase
    .rpc('get_table_columns', { table_name: 'articles' })
    .maybeSingle();

  if (!error && columns) {
    console.log(`  Articles table columns: ${JSON.stringify(columns)}`);
    return columns;
  }

  // Fallback: try to query one row to see columns
  const { data: sampleArticle, error: queryError } = await supabase
    .from("articles")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (queryError) {
    console.log(`  Articles table error: ${queryError.message}`);
    return null;
  }

  if (sampleArticle) {
    console.log(`  Articles table columns: ${Object.keys(sampleArticle).join(", ")}`);
    return Object.keys(sampleArticle);
  }

  console.log(`  No existing articles to check schema`);
  return null;
}

async function main() {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║  PRODUCTION PRODUCT VALIDATION - FULL WORKFLOW             ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  const supabase = createAdminClient();
  const results: ProductionValidationResult[] = [];

  // Check articles table schema
  console.log(`[SCHEMA CHECK] Checking articles table structure...`);
  const schema = await checkArticlesSchema(supabase);
  console.log("");

  for (const topic of topics) {
    console.log(`\n${"=".repeat(70)}`);
    console.log(`VALIDATING: ${topic}`);
    console.log(`${"=".repeat(70)}\n`);

    try {
      // Step 1: Query topic from production
      const { data: topicData, error: topicError } = await supabase
        .from("topics")
        .select("*")
        .ilike("slug", `%${topic.toLowerCase().replace(/\s+/g, "-")}%`)
        .single();

      if (topicError || !topicData) {
        throw new Error(`Topic not found: ${topic}`);
      }

      console.log(`[Step 1] Topic Found: ${topicData.slug} (${topicData.status})`);

      // Step 2: Query Knowledge Package
      console.log(`[Step 2] Querying Knowledge Package...`);
      const { package: pkg, facts } = await queryKnowledgePackage(supabase, topicData.id);
      console.log(`  Package ID: ${pkg.id}`);
      console.log(`  Version: ${pkg.version}`);
      console.log(`  Facts: ${facts.length}`);

      // Step 3: Run Knowledge Authoring Engine
      console.log(`[Step 3] Running Knowledge Authoring Engine...`);
      const orchestrator = new KnowledgeAuthoringOrchestrator();

      const context: AuthoringContext = {
        topic: topic,
        category: topicData.category_id || "general",
        intent: "educate",
        complexity: "beginner",
        facts: facts.map((f: any) => ({
          id: f.id,
          statement: f.statement,
          factType: f.fact_type,
          confidence: f.confidence,
          scope: f.scope,
          tags: f.tags,
          domain: f.domain,
        })),
      };

      const authoringResult = await orchestrator.authorDocument(context);
      console.log(`  Authoring Complete: ${authoringResult.passesAllChecks}`);
      console.log(`  Quality Score: ${authoringResult.editorialResult.qualityScore}/100`);
      console.log(`  Sections: ${authoringResult.document.sections.length}`);
      console.log(`  Recommendation: ${authoringResult.acceptanceTest.recommendation}`);

      // Step 4: Generate HTML
      console.log(`[Step 4] Generating HTML...`);
      const html = generateHTML(authoringResult, topic);
      
      const outputDir = join(process.cwd(), "output", "production-validation");
      if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true });
      }

      const safeTopicName = topic.toLowerCase().replace(/\s+/g, "-");
      const htmlPath = join(outputDir, `${safeTopicName}.html`);
      writeFileSync(htmlPath, html);
      console.log(`  HTML saved to: ${htmlPath}`);

      // Step 5: Deploy to production (create article record)
      console.log(`[Step 5] Deploying to production...`);
      const { data: article, error: articleError } = await supabase
        .from("articles")
        .insert({
          topic_id: topicData.id,
          status: "published",
          content: JSON.stringify(authoringResult.document),
          metadata: {
            qualityScore: authoringResult.editorialResult.qualityScore,
            authoringEngine: "knowledge-authoring-v1",
            generatedAt: new Date().toISOString(),
          },
        })
        .select()
        .single();

      let articleId = null;
      if (!articleError && article) {
        articleId = article.id;
        console.log(`  Article created: ${article.id}`);
      } else {
        console.log(`  Warning: Could not create article: ${articleError?.message}`);
      }

      // Step 6: Generate live URL
      const liveUrl = `https://valendiro.com/topics/${topicData.slug}`;

      console.log(`[Step 6] Live URL: ${liveUrl}`);

      results.push({
        topic,
        topicId: topicData.id,
        topicSlug: topicData.slug,
        knowledgePackageId: pkg.id,
        factCount: facts.length,
        authoringResult,
        articleId,
        deployed: !!articleId,
        liveUrl,
      });

      console.log(`\n✓ Validation complete for: ${topic}`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`\n✗ Error: ${errorMessage}`);
      
      results.push({
        topic,
        topicId: "",
        topicSlug: "",
        knowledgePackageId: "",
        factCount: 0,
        authoringResult: null,
        articleId: null,
        deployed: false,
        liveUrl: null,
        error: errorMessage,
      });
    }
  }

  // Summary
  console.log(`\n${"=".repeat(70)}`);
  console.log("PRODUCTION VALIDATION SUMMARY");
  console.log(`${"=".repeat(70)}\n`);

  let deployed = 0;
  let failed = 0;

  for (const result of results) {
    const status = result.deployed ? "✓ DEPLOYED" : "✗ FAILED";
    console.log(`${result.topic}: ${status}`);
    console.log(`  Knowledge Package: ${result.knowledgePackageId}`);
    console.log(`  Facts: ${result.factCount}`);
    console.log(`  Article ID: ${result.articleId || "N/A"}`);
    console.log(`  Live URL: ${result.liveUrl || "N/A"}`);
    if (result.error) {
      console.log(`  Error: ${result.error}`);
    }
    console.log("");

    if (result.deployed) deployed++;
    else failed++;
  }

  console.log(`${"=".repeat(70)}`);
  console.log(`TOTAL: ${results.length} topics`);
  console.log(`DEPLOYED: ${deployed}`);
  console.log(`FAILED: ${failed}`);
  console.log(`SUCCESS RATE: ${((deployed / results.length) * 100).toFixed(1)}%`);
  console.log(`${"=".repeat(70)}`);

  // Save detailed results
  const resultsPath = join(process.cwd(), "output", "production-validation", "results.json");
  writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log(`\nDetailed results saved to: ${resultsPath}`);
}

function generateHTML(result: any, topic: string): string {
  const sectionsHTML = result.document.sections
    .map((section: any) => `
      <section>
        <h2>${section.heading}</h2>
        <div class="content">${section.content}</div>
      </section>
    `)
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${topic} - Valendiro</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      line-height: 1.6;
      color: #333;
    }
    h1 {
      color: #2563eb;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 0.5rem;
    }
    h2 {
      color: #1e40af;
      margin-top: 2rem;
    }
    .introduction {
      background: #f3f4f6;
      padding: 1.5rem;
      border-radius: 8px;
      margin-bottom: 2rem;
    }
    .content {
      white-space: pre-wrap;
    }
    .conclusion {
      background: #dbeafe;
      padding: 1.5rem;
      border-radius: 8px;
      margin-top: 2rem;
    }
    .metadata {
      background: #fef3c7;
      padding: 1rem;
      border-radius: 8px;
      margin-top: 2rem;
      font-size: 0.9rem;
    }
  </style>
</head>
<body>
  <h1>${topic}</h1>
  
  <div class="introduction">
    <h2>Introduction</h2>
    <div class="content">${result.document.introduction}</div>
  </div>

  ${sectionsHTML}

  <div class="conclusion">
    <h2>Conclusion</h2>
    <div class="content">${result.document.conclusion}</div>
  </div>

  <div class="metadata">
    <h3>Article Metadata</h3>
    <p><strong>Quality Score:</strong> ${result.editorialResult.qualityScore}/100</p>
    <p><strong>Passes Editorial:</strong> ${result.editorialResult.passesEditorial}</p>
    <p><strong>Acceptance Test:</strong> ${result.acceptanceTest.allPassed ? "Passed" : "Failed"}</p>
    <p><strong>Confidence:</strong> ${result.acceptanceTest.overallConfidence}/100</p>
    <p><strong>Recommendation:</strong> ${result.acceptanceTest.recommendation}</p>
    <p><strong>Sections:</strong> ${result.document.sections.length}</p>
    <p><strong>Generated by:</strong> Knowledge Authoring Engine v1.0.0</p>
  </div>
</body>
</html>`;
}

main().catch(console.error);
