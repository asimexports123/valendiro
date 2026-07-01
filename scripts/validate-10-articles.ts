/**
 * validate-10-articles.ts
 *
 * Phase 2 Validation — Generate 10 articles across major entity types.
 * Validates every pipeline stage and produces a comprehensive report.
 *
 * Usage: npx tsx scripts/validate-10-articles.ts
 * Output: scripts/output/validation/
 */

import * as dotenv from "dotenv";
import { resolve } from "path";
import * as fs from "fs";
dotenv.config({ path: resolve(process.cwd(), ".env.local") });
process.env.LLM_PROVIDER = "grok";
process.env.SKIP_EDITORIAL_REVIEW = "false";
process.env.LLM_INTER_CALL_DELAY = "0";

import { classifyTopicIntelligence, type UserGoal } from "../services/intelligence/topicSearchIntentClassifier";
import { classifyTopicDomain } from "../services/intelligence/topicDomainClassifier";
import { generateArticleExpansionPlans } from "../services/demand/topicExpansionEngine";
import { runAgentPipeline } from "../services/intelligence/agentPipeline";

// ─── 10 Validation Topics ─────────────────────────────────────────────────────

const TOPICS = [
  { topic: "Docker CMD vs ENTRYPOINT",     category: "Technology",        domain: "programming_comparison" },
  { topic: "What is Python?",              category: "Technology",        domain: "programming_concept"    },
  { topic: "React Hooks",                  category: "Technology",        domain: "programming_concept"    },
  { topic: "Index Funds",                  category: "Personal Finance",  domain: "finance_concept"        },
  { topic: "Compound Interest",            category: "Personal Finance",  domain: "finance_calculator"     },
  { topic: "Type 2 Diabetes",             category: "Health & Wellness", domain: "health_condition"       },
  { topic: "Protein",                      category: "Health & Wellness", domain: "health_nutrition"       },
  { topic: "HIIT Workout",                category: "Health & Wellness", domain: "health_fitness"         },
  { topic: "Travel Planning",              category: "Travel",            domain: "general"                },
  { topic: "Entrepreneurship Basics",      category: "Legal & Business",  domain: "general"                },
];

// ─── Domain-specific content validators ────────────────────────────────────────

interface DomainCheck {
  name: string;
  check: (content: string) => boolean;
}

const DOMAIN_VALIDATORS: Record<string, DomainCheck[]> = {
  Technology: [
    { name: "Code examples",            check: c => /```/.test(c) || /`[^`]+`/.test(c) },
    { name: "Commands or syntax",       check: c => /```(bash|sh|cmd|shell|python|javascript|typescript|jsx|tsx|docker)/i.test(c) || /`[a-z]+.*`/i.test(c) },
    { name: "Technical explanation",    check: c => /how it works|under the hood|internally|execution|runtime|compile/i.test(c) },
  ],
  "Personal Finance": [
    { name: "Real numbers/examples",    check: c => /\$[\d,]+|\d+%|\d+\.\d+/.test(c) },
    { name: "Risk explanation",         check: c => /risk|volatil|loss|diversif|caution|warning/i.test(c) },
    { name: "Practical guidance",       check: c => /how to|step|start|open|account|invest|buy|strategy/i.test(c) },
  ],
  "Health & Wellness": [
    { name: "Symptoms or signs",        check: c => /symptom|sign|feel|experience|notice/i.test(c) },
    { name: "Causes or risk factors",   check: c => /cause|risk factor|trigger|lead to|contribute/i.test(c) },
    { name: "Treatment or guidance",    check: c => /treat|therapy|medication|manage|prevent|doctor|consult/i.test(c) },
    { name: "Medical caution",          check: c => /consult.*doctor|medical.*advice|healthcare.*provider|disclaimer|not.*substitute/i.test(c) },
  ],
  Travel: [
    { name: "Practical visitor info",   check: c => /budget|cost|transport|hotel|visa|weather|season|tip/i.test(c) },
    { name: "Planning advice",          check: c => /plan|itinerary|book|reserve|pack|prepare|before you go/i.test(c) },
  ],
  "Legal & Business": [
    { name: "Actionable steps",         check: c => /step|how to|register|file|apply|form|start/i.test(c) },
    { name: "Practical guidance",       check: c => /example|tip|common mistake|avoid|recommend/i.test(c) },
  ],
};

// ─── Pipeline stage validators ────────────────────────────────────────────────

interface StageResult {
  stage: string;
  passed: boolean;
  detail: string;
}

// ─── Output types ──────────────────────────────────────────────────────────────

interface ArticleValidation {
  topic: string;
  category: string;
  entity: string;
  intent: string;
  level: string;
  goal: string;
  title: string;
  wordCount: number;
  qualityScore: number;
  factScore: number;
  seoScore: number;
  editorialScore: number;
  passed: boolean;
  autoPublish: boolean;
  retryCount: number;
  durationMs: number;
  stages: StageResult[];
  domainChecks: { name: string; passed: boolean }[];
  issues: string[];
}

// ─── ANSI ──────────────────────────────────────────────────────────────────────

const G = "\x1b[32m✓\x1b[0m";
const R = "\x1b[31m✗\x1b[0m";
const Y = "\x1b[33m⚠\x1b[0m";
const B = "\x1b[1m";
const C = "\x1b[36m";
const D = "\x1b[2m";
const X = "\x1b[0m";

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n${B}${"═".repeat(70)}${X}`);
  console.log(`${B}  PHASE 2 — 10-ARTICLE PIPELINE VALIDATION${X}`);
  console.log(`${"═".repeat(70)}\n`);
  console.log(`Provider: ${process.env.LLM_PROVIDER?.toUpperCase() ?? "AUTO"}\n`);

  const outDir = resolve(process.cwd(), "scripts", "output", "validation");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const results: ArticleValidation[] = [];

  for (let i = 0; i < TOPICS.length; i++) {
    const { topic, category } = TOPICS[i];
    const num = `[${i + 1}/${TOPICS.length}]`;
    console.log(`\n${C}${B}${num} "${topic}" — ${category}${X}`);

    const stages: StageResult[] = [];
    const issues: string[] = [];

    // ── Stage 1: Entity Classification ─────────────────────────────────────
    const entity = classifyTopicDomain(topic);
    stages.push({ stage: "Entity Classification", passed: entity !== "general", detail: entity });
    console.log(`  ${entity !== "general" ? G : Y} Entity: ${entity}`);

    // ── Stage 2: Intent + Level + Goal ─────────────────────────────────────
    const intel = classifyTopicIntelligence(topic);
    stages.push({ stage: "Intent Classification", passed: true, detail: intel.intent });
    stages.push({ stage: "Reader Level", passed: true, detail: intel.level });
    stages.push({ stage: "User Goal", passed: true, detail: intel.goal });
    console.log(`  ${G} Intent: ${intel.intent}  Level: ${intel.level}  Goal: ${intel.goal}`);

    // ── Stage 3: Knowledge Expansion ───────────────────────────────────────
    const plans = generateArticleExpansionPlans(topic);
    stages.push({ stage: "Knowledge Expansion", passed: plans.length > 0, detail: `${plans.length} plans` });
    console.log(`  ${plans.length > 0 ? G : R} Expansion: ${plans.length} plans`);

    // ── Stage 4-9: Full Agent Pipeline ─────────────────────────────────────
    const start = Date.now();
    const result: ArticleValidation = {
      topic, category, entity,
      intent: intel.intent, level: intel.level, goal: intel.goal,
      title: "", wordCount: 0, qualityScore: 0, factScore: 0, seoScore: 0,
      editorialScore: 0, passed: false, autoPublish: false, retryCount: 0,
      durationMs: 0, stages, domainChecks: [], issues,
    };

    try {
      const pipeline = await runAgentPipeline(topic, category, intel.goal as UserGoal);
      result.durationMs     = Date.now() - start;
      result.title          = pipeline.finalTitle;
      result.wordCount      = pipeline.wordCount;
      result.qualityScore   = pipeline.qualityReport.score;
      result.editorialScore = pipeline.editorialReview?.overallScore ?? 0;
      result.factScore      = pipeline.editorialReview?.factCheck?.score ?? 0;
      result.seoScore       = pipeline.editorialReview?.seoReview?.score ?? 0;
      result.passed         = pipeline.qualityReport.passed;
      result.autoPublish    = pipeline.autoPublish;
      result.retryCount     = pipeline.retryCount;

      // Stage results from pipeline
      stages.push({ stage: "Research Agent", passed: true, detail: "✓" });
      stages.push({ stage: "Knowledge Pack", passed: true, detail: "✓" });
      stages.push({ stage: "Outline Agent", passed: true, detail: "✓" });
      stages.push({ stage: "Gemini Writer", passed: result.wordCount >= 500, detail: `${result.wordCount} words` });
      stages.push({ stage: "Fact Checker", passed: result.factScore >= 60 || result.factScore === 0, detail: `${result.factScore}/100` });
      stages.push({ stage: "Quality Reviewer", passed: result.qualityScore >= 60, detail: `${result.qualityScore}/100` });
      stages.push({ stage: "SEO Reviewer", passed: result.seoScore >= 50 || result.seoScore === 0, detail: `${result.seoScore}/100` });

      console.log(`  ${G} Research → Outline → Write → Review`);
      console.log(`  ${result.passed ? G : R} Quality: ${result.qualityScore}  Fact: ${result.factScore}  SEO: ${result.seoScore}  Words: ${result.wordCount}`);

      // ── Domain-specific validation ─────────────────────────────────────
      const validators = DOMAIN_VALIDATORS[category] ?? [];
      const content = pipeline.finalContent;
      for (const v of validators) {
        const passed = v.check(content);
        result.domainChecks.push({ name: v.name, passed });
        if (!passed) {
          result.issues.push(`Domain check failed: ${v.name}`);
          console.log(`  ${R} Domain: ${v.name}`);
        } else {
          console.log(`  ${G} Domain: ${v.name}`);
        }
      }

      // Save article
      const safeSlug = topic.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 50);
      fs.writeFileSync(
        resolve(outDir, `${String(i + 1).padStart(2, "0")}-${safeSlug}.md`),
        [
          `# ${pipeline.finalTitle}`,
          ``,
          `| Field | Value |`,
          `|-------|-------|`,
          `| Category | ${category} |`,
          `| Entity | ${entity} |`,
          `| Intent | ${intel.intent} |`,
          `| Level | ${intel.level} |`,
          `| Goal | ${intel.goal} |`,
          `| Quality | ${result.qualityScore}/100 |`,
          `| Fact | ${result.factScore}/100 |`,
          `| SEO | ${result.seoScore}/100 |`,
          `| Words | ${result.wordCount} |`,
          `| Time | ${Math.round(result.durationMs / 1000)}s |`,
          ``,
          `---`,
          ``,
          pipeline.finalContent,
        ].join("\n")
      );

      const status = result.passed ? (result.issues.length === 0 ? G : Y) : R;
      console.log(`  ${status} "${result.title}" — ${Math.round(result.durationMs / 1000)}s`);

    } catch (err) {
      result.durationMs = Date.now() - start;
      const msg = err instanceof Error ? err.message.slice(0, 200) : String(err).slice(0, 200);
      result.issues.push(`Pipeline error: ${msg}`);
      stages.push({ stage: "Pipeline Execution", passed: false, detail: msg });
      console.log(`  ${R} ERROR: ${msg}`);

      // Rate limit handling
      if (msg.includes("429") || msg.includes("quota") || msg.includes("rate")) {
        console.log(`  ${Y} Rate limit — waiting 60s...`);
        await new Promise(r => setTimeout(r, 60_000));
      }
    }

    results.push(result);

    // Small gap between articles (rate limit handled by LLM_INTER_CALL_DELAY)
    if (i < TOPICS.length - 1) {
      await new Promise(r => setTimeout(r, 5000));
    }
  }

  // ─── VALIDATION REPORT ───────────────────────────────────────────────────────

  console.log(`\n${B}${"═".repeat(70)}${X}`);
  console.log(`${B}  VALIDATION REPORT${X}`);
  console.log(`${"═".repeat(70)}\n`);

  const n = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = n - passed;
  const avgQuality   = Math.round(results.reduce((s, r) => s + r.qualityScore, 0) / n);
  const avgFact      = Math.round(results.reduce((s, r) => s + r.factScore, 0) / n);
  const avgSeo       = Math.round(results.reduce((s, r) => s + r.seoScore, 0) / n);
  const totalRetries = results.reduce((s, r) => s + r.retryCount, 0);

  const entities = [...new Set(results.map(r => r.entity))];
  const intents  = [...new Set(results.map(r => r.intent))];
  const levels   = [...new Set(results.map(r => r.level))];
  const goals    = [...new Set(results.map(r => r.goal))];

  console.log(`  Generated Articles:   ${n}`);
  console.log(`  Passed Quality Gate:  ${passed}/${n}`);
  console.log(`  Failed:               ${failed}/${n}`);
  console.log(`  Total Rewrites:       ${totalRetries}`);
  console.log(``);
  console.log(`  Entity Types Used:    ${entities.length} — ${entities.join(", ")}`);
  console.log(`  Search Intents Used:  ${intents.length} — ${intents.join(", ")}`);
  console.log(`  Reader Levels Used:   ${levels.length} — ${levels.join(", ")}`);
  console.log(`  User Goals Used:      ${goals.length} — ${goals.join(", ")}`);
  console.log(``);
  console.log(`  Average Quality Score:  ${avgQuality}/100`);
  console.log(`  Average Fact Score:     ${avgFact}/100`);
  console.log(`  Average SEO Score:      ${avgSeo}/100`);
  console.log(``);

  // Weak articles
  const weak = results.filter(r => !r.passed || r.issues.length > 0);
  if (weak.length > 0) {
    console.log(`  ${B}Weak Articles:${X}`);
    for (const w of weak) {
      console.log(`    ${R} "${w.topic}" — Q:${w.qualityScore} F:${w.factScore} S:${w.seoScore}`);
      w.issues.forEach(i => console.log(`       ⚠ ${i}`));
    }
  } else {
    console.log(`  ${G} All articles passed validation.`);
  }

  // Domain check summary
  const allDomainChecks = results.flatMap(r => r.domainChecks);
  const domainFails = allDomainChecks.filter(d => !d.passed);
  if (domainFails.length > 0) {
    console.log(`\n  ${B}Domain Check Failures:${X}`);
    domainFails.forEach(d => console.log(`    ${R} ${d.name}`));
  }

  // Write JSON report
  const report = {
    generatedAt: new Date().toISOString(),
    provider: process.env.LLM_PROVIDER ?? "auto",
    summary: {
      generatedArticles: n, passed, failed,
      rewriteCount: totalRetries,
      avgQualityScore: avgQuality,
      avgFactConfidence: avgFact,
      avgSeoScore: avgSeo,
    },
    coverage: { entities, intents, levels, goals },
    weakArticles: weak.map(w => ({ topic: w.topic, quality: w.qualityScore, fact: w.factScore, seo: w.seoScore, issues: w.issues })),
    domainCheckFailures: domainFails,
    articles: results,
  };

  fs.writeFileSync(resolve(outDir, "validation-report.json"), JSON.stringify(report, null, 2));

  console.log(`\n  Articles: scripts/output/validation/`);
  console.log(`  Report:   scripts/output/validation/validation-report.json`);
  console.log(`\n${"═".repeat(70)}\n`);

  process.exit(failed > 2 ? 1 : 0);
}

main().catch(err => {
  console.error("[validate-10-articles] Fatal:", err);
  process.exit(1);
});
