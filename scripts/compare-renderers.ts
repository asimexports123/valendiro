/**
 * Before/After Renderer Comparison Script
 *
 * Generates comparisons between v1 (fact-listing) and v2 (composition engine) renderers
 * for 10 different topics to demonstrate improvements in educational quality.
 */

import { createClient } from "@supabase/supabase-js";
import { render } from "@/services/renderer/orchestrator";

const SUPABASE_URL = "https://diwwvkbztvhwouttajha.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTg1MzY0MCwiZXhwIjoyMDUxNDI5NjQwfQ.6yZJjLh8X7XqW7XqW7XqW7XqW7XqW7XqW7XqW7XqW7XqW7Xq";

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const TOPICS_TO_COMPARE = [
  "agile-development",
  "cloud-computing-fundamentals",
  "cybersecurity-fundamentals",
  "machine-learning-basics",
  "etf-fundamentals",
  "credit-card-fundamentals",
  "career-planning",
  "cooking-fundamentals",
  "travel-planning-fundamentals",
  "dividend-investing",
];

interface ComparisonResult {
  topic: string;
  v1: {
    qualityScore: number;
    wordCount: number;
    sectionCount: number;
    issues: string[];
  };
  v2: {
    qualityScore: number;
    educationalValue: number;
    clarity: number;
    logicalFlow: number;
    wordCount: number;
    sectionCount: number;
    issues: string[];
  };
  improvements: {
    qualityDelta: number;
    wordCountDelta: number;
    sectionCountDelta: number;
  };
}

async function getPackageIdBySlug(slug: string): Promise<string | null> {
  const { data: topic } = await sb
    .from("topics")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (!topic?.id) return null;

  const { data: pkg } = await sb
    .from("knowledge_packages")
    .select("id")
    .eq("topic_id", topic.id)
    .eq("status", "ready")
    .maybeSingle();

  return pkg?.id ?? null;
}

async function renderWithVersion(
  packageId: string,
  rendererId: string
): Promise<any> {
  return await render({
    packageId,
    rendererId,
    format: "html",
    forceRerender: true,
  });
}

async function compareTopic(topicSlug: string): Promise<ComparisonResult> {
  console.log(`\nComparing topic: ${topicSlug}`);
  
  const packageId = await getPackageIdBySlug(topicSlug);
  if (!packageId) {
    console.log(`  ✗ No package found for ${topicSlug}`);
    throw new Error(`No package found for ${topicSlug}`);
  }

  console.log(`  Package ID: ${packageId}`);

  // Render with v1
  console.log(`  Rendering with v1...`);
  const v1Result = await renderWithVersion(packageId, "long-article");
  
  // Render with v2
  console.log(`  Rendering with v2...`);
  const v2Result = await renderWithVersion(packageId, "long-article-v2");

  const comparison: ComparisonResult = {
    topic: topicSlug,
    v1: {
      qualityScore: v1Result.qualityScore.overall,
      wordCount: v1Result.qualityScore.wordCount,
      sectionCount: v1Result.qualityScore.sectionCount,
      issues: v1Result.diagnostics.warnings,
    },
    v2: {
      qualityScore: v2Result.qualityScore.overall,
      educationalValue: v2Result.qualityScore.readingFlow.overallFlowScore, // Using flow score as proxy for now
      clarity: v2Result.qualityScore.readabilityEstimate,
      logicalFlow: v2Result.qualityScore.readingFlow.overallFlowScore,
      wordCount: v2Result.qualityScore.wordCount,
      sectionCount: v2Result.qualityScore.sectionCount,
      issues: v2Result.diagnostics.warnings,
    },
    improvements: {
      qualityDelta: v2Result.qualityScore.overall - v1Result.qualityScore.overall,
      wordCountDelta: v2Result.qualityScore.wordCount - v1Result.qualityScore.wordCount,
      sectionCountDelta: v2Result.qualityScore.sectionCount - v1Result.qualityScore.sectionCount,
    },
  };

  console.log(`  V1 Quality: ${v1Result.qualityScore.overall}`);
  console.log(`  V2 Quality: ${v2Result.qualityScore.overall}`);
  console.log(`  Delta: ${comparison.improvements.qualityDelta}`);

  return comparison;
}

async function generateComparisonReport(): Promise<void> {
  console.log("=== Phase 14: Before/After Renderer Comparison ===\n");

  const results: ComparisonResult[] = [];

  for (const topic of TOPICS_TO_COMPARE) {
    try {
      const result = await compareTopic(topic);
      results.push(result);
    } catch (error) {
      console.error(`  Error comparing ${topic}:`, error);
    }
  }

  // Generate summary report
  console.log("\n=== COMPARISON SUMMARY ===\n");

  const avgQualityDelta = results.reduce((sum, r) => sum + r.improvements.qualityDelta, 0) / results.length;
  const avgWordCountDelta = results.reduce((sum, r) => sum + r.improvements.wordCountDelta, 0) / results.length;
  const avgSectionCountDelta = results.reduce((sum, r) => sum + r.improvements.sectionCountDelta, 0) / results.length;

  console.log(`Average Quality Improvement: ${avgQualityDelta.toFixed(2)} points`);
  console.log(`Average Word Count Change: ${avgWordCountDelta.toFixed(0)} words`);
  console.log(`Average Section Count Change: ${avgSectionCountDelta.toFixed(2)} sections`);

  console.log("\n=== DETAILED RESULTS ===\n");

  for (const result of results) {
    console.log(`\n${result.topic}`);
    console.log(`  V1: Quality=${result.v1.qualityScore}, Words=${result.v1.wordCount}, Sections=${result.v1.sectionCount}`);
    console.log(`  V2: Quality=${result.v2.qualityScore}, Words=${result.v2.wordCount}, Sections=${result.v2.sectionCount}`);
    console.log(`  Delta: Quality=${result.improvements.qualityDelta}, Words=${result.improvements.wordCountDelta}, Sections=${result.improvements.sectionCountDelta}`);
  }

  // Generate markdown report
  const markdown = generateMarkdownReport(results);
  console.log("\n=== MARKDOWN REPORT ===\n");
  console.log(markdown);
}

function generateMarkdownReport(results: ComparisonResult[]): string {
  let md = "# Phase 14: Before/After Renderer Comparison\n\n";
  md += "This report compares the original v1 renderer (fact-listing) with the new v2 renderer (composition engine).\n\n";

  md += "## Summary\n\n";
  
  const avgQualityDelta = results.reduce((sum, r) => sum + r.improvements.qualityDelta, 0) / results.length;
  const avgWordCountDelta = results.reduce((sum, r) => sum + r.improvements.wordCountDelta, 0) / results.length;
  const avgSectionCountDelta = results.reduce((sum, r) => sum + r.improvements.sectionCountDelta, 0) / results.length;

  md += `- **Average Quality Improvement:** ${avgQualityDelta.toFixed(2)} points\n`;
  md += `- **Average Word Count Change:** ${avgWordCountDelta.toFixed(0)} words\n`;
  md += `- **Average Section Count Change:** ${avgSectionCountDelta.toFixed(2)} sections\n\n`;

  md += "## Detailed Results\n\n";
  md += "| Topic | V1 Quality | V2 Quality | Delta | V1 Words | V2 Words | Delta | V1 Sections | V2 Sections | Delta |\n";
  md += "|-------|-----------|-----------|-------|----------|----------|-------|-------------|-------------|-------|\n";

  for (const result of results) {
    md += `| ${result.topic} | ${result.v1.qualityScore} | ${result.v2.qualityScore} | ${result.improvements.qualityDelta > 0 ? '+' : ''}${result.improvements.qualityDelta} | ${result.v1.wordCount} | ${result.v2.wordCount} | ${result.improvements.wordCountDelta > 0 ? '+' : ''}${result.improvements.wordCountDelta} | ${result.v1.sectionCount} | ${result.v2.sectionCount} | ${result.improvements.sectionCountDelta > 0 ? '+' : ''}${result.improvements.sectionCountDelta} |\n`;
  }

  md += "\n## Key Improvements\n\n";
  md += "The v2 renderer introduces:\n";
  md += "- **Reader-first philosophy**: Articles structured around what beginners need to understand\n";
  md += "- **Natural knowledge flow**: Introduction → Concept → How → Example → Application → Implications\n";
  md += "- **Contextualized facts**: Every fact answers What? Why? How? When? Where? Why does it matter?\n";
  md += "- **Practical examples**: Real-world scenarios help readers visualize concepts\n";
  md += "- **Natural transitions**: Sections flow logically, not sequentially\n";
  md += "- **Dynamic length**: Content depth matches topic complexity\n";
  md += "- **Quality validation**: Educational value, clarity, and flow scored before publishing\n\n";

  md += "## Success Definition\n\n";
  md += "A successful article should make a reader think:\n";
  md += "> \"I understand this topic now. I didn't just read facts—I actually learned something.\"\n\n";

  return md;
}

// Run the comparison
generateComparisonReport().catch(console.error);
