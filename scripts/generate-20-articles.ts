/**
 * generate-20-articles.ts
 *
 * Generates 20 real articles across diverse domains, goals, intents, and reader levels.
 * Validates that each article satisfies the reader's UserGoal content contract.
 *
 * Usage: npx tsx scripts/generate-20-articles.ts
 *
 * Results are written to: scripts/output/articles-validation.json
 */

import * as dotenv from "dotenv";
import { resolve } from "path";
import * as fs from "fs";
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

import { classifyTopicIntelligence } from "../services/intelligence/topicSearchIntentClassifier";
import { classifyTopicDomain } from "../services/intelligence/topicDomainClassifier";
import { generateArticleExpansionPlans } from "../services/demand/topicExpansionEngine";
import { runAgentPipeline } from "../services/intelligence/agentPipeline";

// ─── 20 Test Articles ──────────────────────────────────────────────────────────
// Coverage: tech, finance, health, education, travel, products
// Intents: definition, tutorial, comparison, reference, troubleshooting,
//          guide, calculator, review
// Goals: understand, learn, compare, calculate, solve, reference, buy, decide, execute

const TEST_ARTICLES = [
  // ── Technology ───────────────────────────────────────────────────────────────
  { topic: "What Is Docker?",                  domain: "Technology",       expectedGoal: "understand" },
  { topic: "Learn Python",                     domain: "Technology",       expectedGoal: "learn"      },
  { topic: "Docker Commands",                  domain: "Technology",       expectedGoal: "reference"  },
  { topic: "Docker vs Kubernetes",             domain: "Technology",       expectedGoal: "compare"    },
  { topic: "Docker not working",               domain: "Technology",       expectedGoal: "solve"      },
  { topic: "Advanced Docker",                  domain: "Technology",       expectedGoal: "learn"      },
  { topic: "Python Intermediate Guide",        domain: "Technology",       expectedGoal: "decide"     },
  // ── Finance ──────────────────────────────────────────────────────────────────
  { topic: "Index Funds",                      domain: "Personal Finance", expectedGoal: "understand" },
  { topic: "Compound Interest Formula",        domain: "Personal Finance", expectedGoal: "calculate"  },
  { topic: "Best Index Funds 2024",            domain: "Personal Finance", expectedGoal: "buy"        },
  { topic: "Index Funds vs ETFs",              domain: "Personal Finance", expectedGoal: "compare"    },
  { topic: "How to Invest in Index Funds",     domain: "Personal Finance", expectedGoal: "learn"      },
  // ── Health ───────────────────────────────────────────────────────────────────
  { topic: "Type 2 Diabetes",                  domain: "Health & Wellness", expectedGoal: "understand" },
  { topic: "Type 2 Diabetes Diet Checklist",   domain: "Health & Wellness", expectedGoal: "execute"    },
  { topic: "Metformin",                        domain: "Health & Wellness", expectedGoal: "understand" },
  // ── Education / Science ──────────────────────────────────────────────────────
  { topic: "Photosynthesis",                   domain: "Education",        expectedGoal: "understand" },
  { topic: "World War II",                     domain: "Education",        expectedGoal: "understand" },
  // ── Travel ───────────────────────────────────────────────────────────────────
  { topic: "Visit Tokyo",                      domain: "Travel",           expectedGoal: "decide"     },
  // ── Product Review ───────────────────────────────────────────────────────────
  { topic: "Best Mechanical Keyboards 2024",   domain: "Consumer Products", expectedGoal: "buy"       },
  // ── Calculator ───────────────────────────────────────────────────────────────
  { topic: "BMI Calculator",                   domain: "Health & Wellness", expectedGoal: "calculate"  },
];

// ─── Output ────────────────────────────────────────────────────────────────────

interface ArticleResult {
  topic: string;
  domain: string;
  entity: string;
  intent: string;
  level: string;
  goal: string;
  expectedGoal: string;
  goalMatch: boolean;
  wordCount: number;
  qualityScore: number;
  editorialScore: number;
  passed: boolean;
  autoPublish: boolean;
  title: string;
  excerpt: string;
  issues: string[];
  durationMs: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const GREEN  = "\x1b[32m✓\x1b[0m";
const RED    = "\x1b[31m✗\x1b[0m";
const YELLOW = "\x1b[33m⚠\x1b[0m";
const CYAN   = "\x1b[36m";
const RESET  = "\x1b[0m";
const BOLD   = "\x1b[1m";

function h1(s: string) { console.log(`\n${BOLD}${"═".repeat(65)}${RESET}\n${BOLD}${s}${RESET}\n${"═".repeat(65)}`); }
function h2(s: string) { console.log(`\n${CYAN}${s}${RESET}`); }
function ok(s: string)   { console.log(`  ${GREEN} ${s}`); }
function warn(s: string) { console.log(`  ${YELLOW} ${s}`); }
function fail(s: string) { console.log(`  ${RED} ${s}`); }

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  h1(`Generating ${TEST_ARTICLES.length} Articles — Full Intelligence Pipeline`);
  console.log(`Flow: Topic → Entity → Intent → Level → UserGoal → Roadmap → Research → Gemini → Review\n`);

  const results: ArticleResult[] = [];
  let passed = 0;
  let failed = 0;
  let goalMatches = 0;
  let totalWords = 0;
  let totalQuality = 0;
  let totalEditorial = 0;

  const outDir = resolve(process.cwd(), "scripts", "output");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  for (let i = 0; i < TEST_ARTICLES.length; i++) {
    const { topic, domain, expectedGoal } = TEST_ARTICLES[i];
    const num = `[${String(i + 1).padStart(2, "0")}/${TEST_ARTICLES.length}]`;

    h2(`${num} "${topic}"`);

    // ── Stage 1: Classification ──────────────────────────────────────────────
    const entity    = classifyTopicDomain(topic);
    const intel     = classifyTopicIntelligence(topic);
    const { intent, level, goal } = intel;
    const goalMatch = goal === expectedGoal;

    goalMatch
      ? ok(`Entity: ${entity}  Intent: ${intent}  Level: ${level}  Goal: ${BOLD}${goal}${RESET} ✓`)
      : warn(`Entity: ${entity}  Intent: ${intent}  Level: ${level}  Goal: ${goal} (expected ${expectedGoal})`);

    // ── Stage 2: Roadmap preview ─────────────────────────────────────────────
    const plans = generateArticleExpansionPlans(topic);
    ok(`${plans.length} article plans — first: "${plans[0]?.title}"`);

    // ── Stage 3: Full Gemini pipeline ────────────────────────────────────────
    const start = Date.now();
    const result: ArticleResult = {
      topic,
      domain,
      entity,
      intent,
      level,
      goal,
      expectedGoal,
      goalMatch,
      wordCount: 0,
      qualityScore: 0,
      editorialScore: 0,
      passed: false,
      autoPublish: false,
      title: "",
      excerpt: "",
      issues: [],
      durationMs: 0,
    };

    try {
      const pipeline = await runAgentPipeline(topic, domain, goal);

      result.wordCount      = pipeline.wordCount;
      result.qualityScore   = pipeline.qualityReport.score;
      result.editorialScore = pipeline.editorialReview?.overallScore ?? 0;
      result.passed         = pipeline.qualityReport.passed;
      result.autoPublish    = pipeline.autoPublish;
      result.title          = pipeline.finalTitle;
      result.durationMs     = Date.now() - start;

      const firstPara = pipeline.finalContent
        .replace(/^#+.+$/mg, "")
        .split(/\n{2,}/)
        .find(p => p.trim().length > 40) ?? "";
      result.excerpt = firstPara.replace(/\*\*/g, "").trim().slice(0, 200);

      // Validate content contract vs userGoal
      const content = pipeline.finalContent.toLowerCase();
      const goalValidation: Record<string, { check: RegExp; label: string }> = {
        understand: { check: /what is|definition|means|refers to|how it works/,          label: "definition/how-it-works section" },
        learn:      { check: /step|install|example|code|tutorial|exercise|getting started/, label: "steps/code/examples" },
        compare:    { check: /comparison|vs\.?|versus|difference|table|when to use/,       label: "comparison table/vs section" },
        calculate:  { check: /formula|calculate|example.*\d|\d.*=|step.*\d/i,              label: "formula/worked example with numbers" },
        solve:      { check: /fix|error|cause|solution|how to resolve|debug/,              label: "error causes and fixes" },
        reference:  { check: /command|syntax|flag|option|table|list|cheat/,                label: "command/syntax reference" },
        buy:        { check: /pros|cons|verdict|recommend|worth|price|rating|review/,      label: "verdict/pros-cons/pricing" },
        decide:     { check: /recommend|should you|guide|best for|decision|when to/,       label: "recommendation/decision guide" },
        execute:    { check: /step \d|checklist|\d\.|procedure|how to|follow/,             label: "numbered steps/checklist" },
      };

      const validation = goalValidation[goal];
      if (validation && !validation.check.test(content)) {
        result.issues.push(`Content contract for goal "${goal}" not satisfied — missing ${validation.label}`);
        warn(`Content contract FAIL: missing ${validation.label}`);
      } else {
        ok(`Content contract ✓ (${goal})`);
      }

      if (!goalMatch) {
        result.issues.push(`Goal mismatch: classified as "${goal}", expected "${expectedGoal}"`);
      }

      totalWords     += result.wordCount;
      totalQuality   += result.qualityScore;
      totalEditorial += result.editorialScore;

      if (result.passed && result.issues.length === 0) {
        passed++;
        goalMatches++;
        ok(`✓ PASS — "${result.title}" (${result.wordCount}w, Q:${result.qualityScore} E:${result.editorialScore}) [${Math.round(result.durationMs / 1000)}s]`);
      } else if (result.passed) {
        passed++;
        if (goalMatch) goalMatches++;
        warn(`PASS with warnings — "${result.title}" (${result.wordCount}w, Q:${result.qualityScore})`);
        result.issues.forEach(i => warn(`  Issue: ${i}`));
      } else {
        failed++;
        fail(`FAIL — "${result.title}" (score: ${result.qualityScore})`);
        result.issues.forEach(i => fail(`  ${i}`));
      }

      // Write article content to file for manual review
      const safeSlug = topic.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 50);
      fs.writeFileSync(
        resolve(outDir, `${String(i + 1).padStart(2, "0")}-${safeSlug}.md`),
        `# ${pipeline.finalTitle}\n\n**Goal:** ${goal} | **Intent:** ${intent} | **Level:** ${level} | **Entity:** ${entity}\n\n**Quality:** ${result.qualityScore}/100 | **Editorial:** ${result.editorialScore}/100 | **Words:** ${result.wordCount}\n\n---\n\n${pipeline.finalContent}`
      );

    } catch (err) {
      result.durationMs = Date.now() - start;
      const msg = err instanceof Error ? err.message : String(err);
      result.issues.push(msg);
      failed++;
      fail(`ERROR: ${msg.slice(0, 120)}`);
    }

    results.push(result);
  }

  // ─── Summary ────────────────────────────────────────────────────────────────

  h1("GENERATION REPORT");
  const avgWords     = Math.round(totalWords / TEST_ARTICLES.length);
  const avgQuality   = Math.round(totalQuality / TEST_ARTICLES.length);
  const avgEditorial = Math.round(totalEditorial / TEST_ARTICLES.length);

  console.log(`\nArticles Generated:  ${TEST_ARTICLES.length}`);
  console.log(`Passed Quality Gate: ${passed}/${TEST_ARTICLES.length}`);
  console.log(`Failed Quality Gate: ${failed}/${TEST_ARTICLES.length}`);
  console.log(`Goal Classification: ${goalMatches}/${TEST_ARTICLES.length} correct`);
  console.log(`Avg Word Count:      ${avgWords} words`);
  console.log(`Avg Quality Score:   ${avgQuality}/100`);
  console.log(`Avg Editorial Score: ${avgEditorial}/100`);

  console.log("\nPer-article results:");
  for (const r of results) {
    const status = r.passed && r.issues.length === 0 ? GREEN : r.passed ? YELLOW : RED;
    const goalIcon = r.goalMatch ? "✓" : "✗";
    console.log(`  ${status} [goal:${goalIcon}] "${r.title || r.topic}" — ${r.wordCount}w Q:${r.qualityScore} E:${r.editorialScore}`);
    if (r.issues.length > 0) r.issues.forEach(i => console.log(`       ⚠ ${i}`));
  }

  // Write JSON report
  const report = {
    generatedAt: new Date().toISOString(),
    totalArticles: TEST_ARTICLES.length,
    passed,
    failed,
    goalMatchRate: `${goalMatches}/${TEST_ARTICLES.length}`,
    avgWordCount: avgWords,
    avgQualityScore: avgQuality,
    avgEditorialScore: avgEditorial,
    articles: results,
  };
  fs.writeFileSync(resolve(outDir, "articles-validation.json"), JSON.stringify(report, null, 2));

  console.log(`\nArticles saved to: scripts/output/`);
  console.log(`JSON report:       scripts/output/articles-validation.json`);

  if (failed === 0) {
    console.log(`\n${"═".repeat(65)}`);
    console.log(`${BOLD}✅ ALL ${TEST_ARTICLES.length} ARTICLES GENERATED SUCCESSFULLY${RESET}`);
    console.log(`${"═".repeat(65)}\n`);
  } else {
    console.log(`\n${"═".repeat(65)}`);
    console.log(`${BOLD}⚠  ${passed} passed, ${failed} failed — review scripts/output/${RESET}`);
    console.log(`${"═".repeat(65)}\n`);
  }

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error("[generate-20-articles] Fatal:", err);
  process.exit(1);
});
