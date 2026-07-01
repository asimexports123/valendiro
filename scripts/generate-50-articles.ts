/**
 * generate-50-articles.ts
 *
 * Generates ~50 articles across all 7 V1 categories using the complete
 * 5D intelligence pipeline: Entity → Intent → Level → Goal → Roadmap → Gemini
 *
 * Usage:  npx tsx scripts/generate-50-articles.ts
 * Output: scripts/output/v1/  (markdown files + validation report)
 */

import * as dotenv from "dotenv";
import { resolve } from "path";
import * as fs from "fs";
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

// Force Groq as active provider — Gemini quota may be exhausted
process.env.LLM_PROVIDER = "groq";
// Groq: 6k tokens/min — cap each agent at 1500 tokens, skip LLM editorial review
if (!process.env.GROQ_MAX_TOKENS) process.env.GROQ_MAX_TOKENS = "1500";
process.env.SKIP_EDITORIAL_REVIEW = "true";

import { classifyTopicIntelligence } from "../services/intelligence/topicSearchIntentClassifier";
import { classifyTopicDomain }        from "../services/intelligence/topicDomainClassifier";
import { generateArticleExpansionPlans } from "../services/demand/topicExpansionEngine";
import { runAgentPipeline }            from "../services/intelligence/agentPipeline";

// ─── 50 Topics — 7 V1 Categories ─────────────────────────────────────────────
// Spread across: intents (definition/tutorial/comparison/reference/guide/
//                         troubleshooting/calculator/review/checklist)
//                levels  (beginner/intermediate/advanced/professional)
//                goals   (understand/learn/compare/calculate/solve/reference/
//                         buy/decide/execute)

const ARTICLES: Array<{
  topic: string;
  category: string;
  Subcategory: string;
}> = [

  // ── 1. TECHNOLOGY (14 articles) ─────────────────────────────────────────────
  { topic: "What Is Docker?",                   category: "Technology",       Subcategory: "Docker" },
  { topic: "Docker Commands Cheat Sheet",        category: "Technology",       Subcategory: "Docker" },
  { topic: "Docker vs Kubernetes",               category: "Technology",       Subcategory: "Docker" },
  { topic: "Docker not working",                 category: "Technology",       Subcategory: "Docker" },
  { topic: "Docker for DevOps",                  category: "Technology",       Subcategory: "Docker" },
  { topic: "What Is Python?",                    category: "Technology",       Subcategory: "Python" },
  { topic: "Learn Python",                       category: "Technology",       Subcategory: "Python" },
  { topic: "Python Intermediate Guide",          category: "Technology",       Subcategory: "Python" },
  { topic: "Python vs JavaScript",               category: "Technology",       Subcategory: "Python" },
  { topic: "What Is React?",                     category: "Technology",       Subcategory: "React"  },
  { topic: "React vs Vue",                       category: "Technology",       Subcategory: "React"  },
  { topic: "What Is PostgreSQL?",                category: "Technology",       Subcategory: "Databases" },
  { topic: "SQL vs NoSQL",                       category: "Technology",       Subcategory: "Databases" },
  { topic: "Git Commands Cheat Sheet",           category: "Technology",       Subcategory: "Git"    },

  // ── 2. PERSONAL FINANCE (10 articles) ───────────────────────────────────────
  { topic: "What Are Index Funds?",              category: "Personal Finance", Subcategory: "Investing Basics" },
  { topic: "Index Funds vs ETFs",                category: "Personal Finance", Subcategory: "Investing Basics" },
  { topic: "Best Index Funds 2024",              category: "Personal Finance", Subcategory: "Investing Basics" },
  { topic: "How to Invest in Index Funds",       category: "Personal Finance", Subcategory: "Investing Basics" },
  { topic: "Compound Interest Formula",          category: "Personal Finance", Subcategory: "Math of Money"    },
  { topic: "What Is Compound Interest?",         category: "Personal Finance", Subcategory: "Math of Money"    },
  { topic: "What Is a Stock?",                   category: "Personal Finance", Subcategory: "Stock Market"     },
  { topic: "Stock Market for Beginners",         category: "Personal Finance", Subcategory: "Stock Market"     },
  { topic: "What Is a Roth IRA?",                category: "Personal Finance", Subcategory: "Retirement"       },
  { topic: "Best Budget Apps 2024",              category: "Personal Finance", Subcategory: "Budgeting"        },

  // ── 3. HEALTH & WELLNESS (8 articles) ────────────────────────────────────────
  { topic: "Type 2 Diabetes",                   category: "Health & Wellness", Subcategory: "Chronic Conditions" },
  { topic: "Type 2 Diabetes Diet Checklist",    category: "Health & Wellness", Subcategory: "Chronic Conditions" },
  { topic: "Metformin",                         category: "Health & Wellness", Subcategory: "Medications"        },
  { topic: "What Is Cortisol?",                 category: "Health & Wellness", Subcategory: "Hormones"           },
  { topic: "Best Foods for Weight Loss",        category: "Health & Wellness", Subcategory: "Nutrition"          },
  { topic: "Vitamin D Deficiency",             category: "Health & Wellness", Subcategory: "Vitamins"           },
  { topic: "BMI Calculator",                    category: "Health & Wellness", Subcategory: "Calculators"        },
  { topic: "How to Lower Blood Pressure",       category: "Health & Wellness", Subcategory: "Heart Health"       },

  // ── 4. EDUCATION & SCIENCE (7 articles) ──────────────────────────────────────
  { topic: "What Is Photosynthesis?",           category: "Education",         Subcategory: "Biology"            },
  { topic: "Photosynthesis vs Respiration",     category: "Education",         Subcategory: "Biology"            },
  { topic: "What Is the Theory of Evolution?",  category: "Education",         Subcategory: "Biology"            },
  { topic: "Newton's Laws of Motion",           category: "Education",         Subcategory: "Physics"            },
  { topic: "What Is Quantum Mechanics?",        category: "Education",         Subcategory: "Physics"            },
  { topic: "World War II",                      category: "Education",         Subcategory: "Modern History"     },
  { topic: "Causes of World War I",             category: "Education",         Subcategory: "Modern History"     },

  // ── 5. TRAVEL (5 articles) ────────────────────────────────────────────────────
  { topic: "Visit Tokyo",                       category: "Travel",            Subcategory: "Asia"               },
  { topic: "Best Time to Visit Japan",          category: "Travel",            Subcategory: "Asia"               },
  { topic: "Visit Paris",                       category: "Travel",            Subcategory: "Europe"             },
  { topic: "Bali vs Thailand",                  category: "Travel",            Subcategory: "Asia"               },
  { topic: "Solo Travel Checklist",             category: "Travel",            Subcategory: "Travel Planning"    },

  // ── 6. CONSUMER PRODUCTS (4 articles) ────────────────────────────────────────
  { topic: "Best Mechanical Keyboards 2024",    category: "Consumer Products", Subcategory: "Keyboards"          },
  { topic: "MacBook Air vs MacBook Pro",        category: "Consumer Products", Subcategory: "Laptops"            },
  { topic: "Best Noise Cancelling Headphones",  category: "Consumer Products", Subcategory: "Audio"              },
  { topic: "iPhone vs Android",                 category: "Consumer Products", Subcategory: "Smartphones"        },

  // ── 7. LEGAL & BUSINESS (4 articles) ─────────────────────────────────────────
  { topic: "What Is an LLC?",                   category: "Legal & Business",  Subcategory: "Business Structures" },
  { topic: "LLC vs S-Corp",                     category: "Legal & Business",  Subcategory: "Business Structures" },
  { topic: "What Is Copyright?",                category: "Legal & Business",  Subcategory: "Intellectual Property" },
  { topic: "How to Write a Business Plan",      category: "Legal & Business",  Subcategory: "Starting a Business" },
];

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ArticleResult {
  index: number;
  topic: string;
  category: string;
  Subcategory: string;
  entity: string;
  intent: string;
  level: string;
  goal: string;
  title: string;
  wordCount: number;
  qualityScore: number;
  editorialScore: number;
  factScore: number;
  seoScore: number;
  passed: boolean;
  autoPublish: boolean;
  retries: number;
  durationMs: number;
  issues: string[];
  contentContractSatisfied: boolean;
}

// ─── ANSI helpers ──────────────────────────────────────────────────────────────
const GREEN  = "\x1b[32m✓\x1b[0m";
const RED    = "\x1b[31m✗\x1b[0m";
const YELLOW = "\x1b[33m⚠\x1b[0m";
const BOLD   = "\x1b[1m";
const RESET  = "\x1b[0m";
const CYAN   = "\x1b[36m";
const DIM    = "\x1b[2m";

function h1(s: string) {
  console.log(`\n${BOLD}${"═".repeat(70)}${RESET}\n${BOLD}${s}${RESET}\n${"═".repeat(70)}`);
}
function h2(s: string) { console.log(`\n${CYAN}${BOLD}${s}${RESET}`); }
function ok(s: string)   { console.log(`  ${GREEN} ${s}`); }
function warn(s: string) { console.log(`  ${YELLOW} ${s}`); }
function fail(s: string) { console.log(`  ${RED} ${s}`); }
function dim(s: string)  { console.log(`  ${DIM}${s}${RESET}`); }

// ─── Content contract validator ────────────────────────────────────────────────

const GOAL_CONTRACTS: Record<string, { check: RegExp; label: string }> = {
  understand: { check: /what is|definition|means|refers to|how it works|overview/i,              label: "definition/how-it-works"    },
  learn:      { check: /step|install|example|code|tutorial|exercise|getting started|beginner/i,   label: "steps/code/examples"        },
  compare:    { check: /comparison|vs\.?|versus|difference|table|when to use|better/i,            label: "comparison/vs section"      },
  calculate:  { check: /formula|calculate|example.*\d|\d.*=|step.*\d/i,                           label: "formula + worked example"   },
  solve:      { check: /fix|error|cause|solution|how to resolve|debug|troubleshoot/i,             label: "causes + fixes"             },
  reference:  { check: /command|syntax|flag|option|table|list|cheat/i,                            label: "command/syntax reference"   },
  buy:        { check: /pros|cons|verdict|recommend|worth|price|rating|review|best/i,             label: "verdict/pros-cons"          },
  decide:     { check: /recommend|should you|guide|best for|decision|when to|choose/i,            label: "recommendation/decision"    },
  execute:    { check: /step \d|checklist|\d\.|procedure|how to complete|follow these/i,          label: "numbered steps/checklist"   },
};

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  h1(`V1 Content Validation — ${ARTICLES.length} Articles Across 7 Categories`);
  console.log(`Pipeline: Entity → Intent → Level → Goal → Research → Gemini → Review → Publish\n`);
  console.log(`Provider: ${process.env.LLM_PROVIDER?.toUpperCase() ?? "AUTO"} | Model: ${process.env.GROQ_MODEL ?? process.env.GEMINI_MODEL ?? "default"}\n`);

  const outDir = resolve(process.cwd(), "scripts", "output", "v1");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const results: ArticleResult[] = [];
  let passed = 0;
  let failed = 0;
  let rejected = 0;
  let totalWords = 0;
  let totalQuality = 0;
  let totalEditorial = 0;
  let totalFact = 0;
  let totalSeo = 0;
  let totalMs = 0;

  for (let i = 0; i < ARTICLES.length; i++) {
    const { topic, category, Subcategory } = ARTICLES[i];
    const num = `[${String(i + 1).padStart(2, "0")}/${ARTICLES.length}]`;

    h2(`${num} ${category} › ${Subcategory} › "${topic}"`);

    // ── Intelligence layer ───────────────────────────────────────────────────
    const entity = classifyTopicDomain(topic);
    const intel  = classifyTopicIntelligence(topic);
    const { intent, level, goal } = intel;
    const plans = generateArticleExpansionPlans(topic);

    dim(`Entity: ${entity}  Intent: ${intent}  Level: ${level}  Goal: ${goal}  Plans: ${plans.length}`);

    const result: ArticleResult = {
      index: i + 1,
      topic,
      category,
      Subcategory,
      entity,
      intent,
      level,
      goal,
      title: "",
      wordCount: 0,
      qualityScore: 0,
      editorialScore: 0,
      factScore: 0,
      seoScore: 0,
      passed: false,
      autoPublish: false,
      retries: 0,
      durationMs: 0,
      issues: [],
      contentContractSatisfied: false,
    };

    const start = Date.now();
    try {
      const pipeline = await runAgentPipeline(topic, category, goal);

      result.durationMs     = Date.now() - start;
      result.title          = pipeline.finalTitle;
      result.wordCount      = pipeline.wordCount;
      result.qualityScore   = pipeline.qualityReport.score;
      result.editorialScore = pipeline.editorialReview?.overallScore ?? 0;
      result.factScore      = pipeline.editorialReview?.factCheck?.score ?? 0;
      result.seoScore       = pipeline.editorialReview?.seoReview?.score ?? 0;
      result.passed         = pipeline.qualityReport.passed;
      result.autoPublish    = pipeline.autoPublish;
      result.retries        = pipeline.retryCount;

      // Content contract check
      const content  = pipeline.finalContent.toLowerCase();
      const contract = GOAL_CONTRACTS[goal];
      result.contentContractSatisfied = !contract || contract.check.test(content);
      if (!result.contentContractSatisfied) {
        result.issues.push(`Content contract fail: missing ${contract?.label} for goal="${goal}"`);
      }

      // Quality gates
      if (!pipeline.qualityReport.passed) {
        rejected++;
        result.issues.push(...pipeline.qualityReport.issues.slice(0, 3));
      }

      totalWords     += result.wordCount;
      totalQuality   += result.qualityScore;
      totalEditorial += result.editorialScore;
      totalFact      += result.factScore;
      totalSeo       += result.seoScore;
      totalMs        += result.durationMs;

      const scoreStr = `Q:${result.qualityScore} F:${result.factScore} S:${result.seoScore} E:${result.editorialScore}`;
      const meta     = `${result.wordCount}w | ${scoreStr} | ${Math.round(result.durationMs / 1000)}s`;

      if (result.passed && result.contentContractSatisfied) {
        passed++;
        ok(`"${result.title}" — ${meta}${result.autoPublish ? " ✓ AutoPublish" : ""}`);
      } else if (result.passed) {
        passed++;
        warn(`"${result.title}" — ${meta} (contract gap)`);
        result.issues.forEach(i => warn(`  ${i}`));
      } else {
        failed++;
        fail(`"${result.title}" — ${meta}`);
        result.issues.forEach(i => fail(`  ${i}`));
      }

      // Save article markdown
      const safeSlug = topic.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 50);
      const catSlug  = category.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 20);
      const filename = `${String(i + 1).padStart(2, "0")}-${catSlug}-${safeSlug}.md`;
      const badge    = result.autoPublish ? "✅ AutoPublish" : result.passed ? "⚠ Draft" : "❌ Rejected";
      fs.writeFileSync(
        resolve(outDir, filename),
        [
          `# ${pipeline.finalTitle}`,
          ``,
          `| Field | Value |`,
          `|-------|-------|`,
          `| **Category** | ${category} |`,
          `| **Subcategory** | ${Subcategory} |`,
          `| **Entity** | ${entity} |`,
          `| **Intent** | ${intent} |`,
          `| **Level** | ${level} |`,
          `| **User Goal** | ${goal} |`,
          `| **Quality** | ${result.qualityScore}/100 |`,
          `| **Fact** | ${result.factScore}/100 |`,
          `| **SEO** | ${result.seoScore}/100 |`,
          `| **Editorial** | ${result.editorialScore}/100 |`,
          `| **Words** | ${result.wordCount} |`,
          `| **Status** | ${badge} |`,
          ``,
          `---`,
          ``,
          pipeline.finalContent,
        ].join("\n")
      );

    } catch (err) {
      result.durationMs = Date.now() - start;
      const msg = err instanceof Error ? err.message.slice(0, 200) : String(err).slice(0, 200);
      result.issues.push(msg);
      failed++;
      fail(`ERROR: ${msg}`);

      // Rate limit — wait and continue
      if (msg.includes("429") || msg.includes("quota") || msg.includes("rate")) {
        warn("Rate limit hit — waiting 30s before next article...");
        await new Promise(r => setTimeout(r, 30_000));
      }
    }

    results.push(result);

    // Groq: 6,000 tokens/min — wait 20s between articles to stay under limit
    if (i < ARTICLES.length - 1) {
      const waitMs = process.env.LLM_PROVIDER === "groq" ? 20_000 : 2_000;
      if (waitMs > 2000) dim(`Waiting ${waitMs / 1000}s (rate limit window)...`);
      await new Promise(r => setTimeout(r, waitMs));
    }
  }

  // ─── Validation Report ─────────────────────────────────────────────────────

  h1("V1 CONTENT VALIDATION REPORT");

  const n         = ARTICLES.length;
  const avgWords  = Math.round(totalWords  / n);
  const avgQual   = Math.round(totalQuality / n);
  const avgEdit   = Math.round(totalEditorial / n);
  const avgFact   = Math.round(totalFact   / n);
  const avgSeo    = Math.round(totalSeo    / n);
  const avgMs     = Math.round(totalMs     / n / 1000);
  const autoPublished = results.filter(r => r.autoPublish).length;
  const contractOk    = results.filter(r => r.contentContractSatisfied).length;

  // Coverage stats
  const categories  = [...new Set(results.map(r => r.category))];
  const subcategories = [...new Set(results.map(r => r.Subcategory))];
  const entities    = [...new Set(results.map(r => r.entity))];
  const intents     = [...new Set(results.map(r => r.intent))];
  const levels      = [...new Set(results.map(r => r.level))];
  const goals       = [...new Set(results.map(r => r.goal))];

  console.log(`\n${"─".repeat(70)}`);
  console.log(`${BOLD}Coverage${RESET}`);
  console.log(`  Categories:    ${categories.length}/7 — ${categories.join(", ")}`);
  console.log(`  Subcategories:   ${subcategories.length} — ${subcategories.join(", ")}`);
  console.log(`  Entity types:  ${entities.length} — ${entities.join(", ")}`);
  console.log(`  Search intents: ${intents.length} — ${intents.join(", ")}`);
  console.log(`  Reader levels:  ${levels.length} — ${levels.join(", ")}`);
  console.log(`  User goals:     ${goals.length} — ${goals.join(", ")}`);

  console.log(`\n${"─".repeat(70)}`);
  console.log(`${BOLD}Generation Results${RESET}`);
  console.log(`  Articles targeted:   ${n}`);
  console.log(`  Passed quality gate: ${passed}`);
  console.log(`  Failed/rejected:     ${failed + rejected}`);
  console.log(`  Auto-publish ready:  ${autoPublished}`);
  console.log(`  Content contract ✓:  ${contractOk}/${n}`);

  console.log(`\n${"─".repeat(70)}`);
  console.log(`${BOLD}Average Scores${RESET}`);
  console.log(`  Quality score:   ${avgQual}/100`);
  console.log(`  Fact confidence: ${avgFact}/100`);
  console.log(`  SEO score:       ${avgSeo}/100`);
  console.log(`  Editorial score: ${avgEdit}/100`);
  console.log(`  Avg word count:  ${avgWords} words`);
  console.log(`  Avg time/article: ${avgMs}s`);

  // Failures
  const failures = results.filter(r => !r.passed || r.issues.length > 0);
  if (failures.length > 0) {
    console.log(`\n${"─".repeat(70)}`);
    console.log(`${BOLD}Failures & Weak Areas${RESET}`);
    for (const f of failures) {
      console.log(`  ${RED} [${String(f.index).padStart(2, "0")}] "${f.topic}" — Q:${f.qualityScore} F:${f.factScore} S:${f.seoScore}`);
      f.issues.forEach(i => console.log(`       ⚠ ${i}`));
    }
  } else {
    console.log(`\n  ${GREEN} No failures. All articles passed quality gates.`);
  }

  // Per-article table
  console.log(`\n${"─".repeat(70)}`);
  console.log(`${BOLD}Per-Article Summary${RESET}`);
  for (const r of results) {
    const status = r.passed && r.contentContractSatisfied ? GREEN : r.passed ? YELLOW : RED;
    const ap     = r.autoPublish ? " [AUTO]" : "";
    console.log(
      `  ${status} [${String(r.index).padStart(2, "0")}] ${r.category.padEnd(18)} ${r.goal.padEnd(10)} ` +
      `Q:${String(r.qualityScore).padStart(3)} F:${String(r.factScore).padStart(3)} S:${String(r.seoScore).padStart(3)} ` +
      `${r.wordCount}w${ap} — "${r.title.slice(0, 45)}"`
    );
  }

  // Write JSON report
  const report = {
    generatedAt: new Date().toISOString(),
    provider: process.env.LLM_PROVIDER ?? "auto",
    totalTargeted: n,
    passed,
    failed: failed + rejected,
    autoPublished,
    contentContractOk: contractOk,
    coverage: { categories, subcategories, entities, intents, levels, goals },
    averages: {
      qualityScore: avgQual,
      factScore: avgFact,
      seoScore: avgSeo,
      editorialScore: avgEdit,
      wordCount: avgWords,
      secondsPerArticle: avgMs,
    },
    failures: failures.map(f => ({ topic: f.topic, category: f.category, scores: { q: f.qualityScore, f: f.factScore, s: f.seoScore }, issues: f.issues })),
    articles: results,
  };

  fs.writeFileSync(resolve(outDir, "validation-report.json"), JSON.stringify(report, null, 2));

  console.log(`\n${"─".repeat(70)}`);
  console.log(`Articles saved to: scripts/output/v1/`);
  console.log(`JSON report:       scripts/output/v1/validation-report.json`);

  if (failed + rejected === 0) {
    console.log(`\n${"═".repeat(70)}`);
    console.log(`${BOLD}✅ V1 VALIDATION PASSED — ${passed}/${n} articles ready for review${RESET}`);
    console.log(`${"═".repeat(70)}\n`);
  } else {
    console.log(`\n${"═".repeat(70)}`);
    console.log(`${BOLD}⚠  ${passed} passed, ${failed + rejected} failed — review scripts/output/v1/${RESET}`);
    console.log(`${"═".repeat(70)}\n`);
  }

  process.exit(failed + rejected > 3 ? 1 : 0); // allow up to 3 failures
}

main().catch(err => {
  console.error("[generate-50-articles] Fatal:", err);
  process.exit(1);
});
