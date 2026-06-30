/**
 * Full Pipeline Validation Script
 * Validates every stage: Collection → Topic → Expansion → Research → Write → Review
 * Usage: npx tsx scripts/validate-pipeline.ts
 */
import * as dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

import { createClient } from "@supabase/supabase-js";
import { generateArticleExpansionPlans } from "../services/demand/topicExpansionEngine";
import { generateTopicsForCollection, COLLECTION_TOPICS } from "../services/demand/knowledgeTreeGenerator";
import { classifyTopicDomain } from "../services/intelligence/topicDomainClassifier";
import {
  runResearchAgent,
  runOutlineAgent,
  runWriterAgent,
  runDeterministicQualityCheck,
  buildDeterministicSEOFields,
} from "../services/intelligence/agentPipeline";
import { runFullEditorialReview } from "../services/intelligence/editorialReviewEngine";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TARGET_COLLECTIONS = ["docker", "python", "javascript", "react", "kubernetes", "investing-basics", "devops"];

// ── Validation report ──────────────────────────────────────────────────────────
interface ValidationReport {
  stage1_collections: { slug: string; found: boolean; categoryId: string | null }[];
  stage2_topics: {
    collection: string;
    topicsGenerated: string[];
    domainCheck: { topic: string; domain: string; correct: boolean }[];
    issues: string[];
  }[];
  stage3_expansion: {
    topic: string;
    domain: string;
    articleCount: number;
    sampleTitles: string[];
    hasGenericTitles: boolean;
    issues: string[];
  }[];
  stage4_research: {
    keyword: string;
    intent: string;
    hasDomainFields: boolean;
    fields: string[];
    issues: string[];
  }[];
  stage5_writing: {
    keyword: string;
    intent: string;
    wordCount: number;
    qualityScore: number;
    editorialScore: number;
    passed: boolean;
    rewrites: number;
    sections: string[];
    hasCode: boolean;
    hasTables: boolean;
    hasFormulas: boolean;
    genericDetected: boolean;
    issues: string[];
  }[];
  summary: {
    collectionsOk: number;
    topicsOk: number;
    expansionOk: number;
    researchOk: number;
    writingOk: number;
    writingFailed: number;
    avgQuality: number;
    avgEditorial: number;
    totalRewrites: number;
    criticalIssues: string[];
  };
}

const report: ValidationReport = {
  stage1_collections: [],
  stage2_topics: [],
  stage3_expansion: [],
  stage4_research: [],
  stage5_writing: [],
  summary: {
    collectionsOk: 0, topicsOk: 0, expansionOk: 0,
    researchOk: 0, writingOk: 0, writingFailed: 0,
    avgQuality: 0, avgEditorial: 0, totalRewrites: 0,
    criticalIssues: [],
  },
};

// Generic title patterns to detect
const GENERIC_PATTERNS = [
  /for beginners: everything you need to know/i,
  /common mistakes and how to avoid them/i,
  /taking your skills further/i,
  /key concepts in .+ explained/i,
  /step-by-step explanation/i,
  /vs related approaches/i,
];

function isGenericTitle(title: string): boolean {
  return GENERIC_PATTERNS.some((p) => p.test(title));
}

function sep(char = "─", len = 65) { return char.repeat(len); }
function h1(s: string) { console.log("\n" + sep("═") + "\n" + s + "\n" + sep("═")); }
function h2(s: string) { console.log("\n" + sep() + "\n" + s + "\n" + sep()); }
function ok(s: string) { console.log("  ✓ " + s); }
function warn(s: string) { console.log("  ⚠ " + s); }
function fail(s: string) { console.log("  ✗ " + s); }

// ── STAGE 1: Collections ──────────────────────────────────────────────────────
async function validateStage1() {
  h1("STAGE 1: Collections");
  const { data: cols } = await supabase.from("collections").select("id, slug, category_id");
  const colMap = Object.fromEntries((cols ?? []).map((c) => [c.slug, c]));

  for (const slug of TARGET_COLLECTIONS) {
    const col = colMap[slug];
    const found = !!col;
    const categoryId = col?.category_id ?? null;
    report.stage1_collections.push({ slug, found, categoryId });

    if (found && categoryId) ok(`${slug} → category_id: ${categoryId.slice(0, 8)}...`);
    else if (found && !categoryId) warn(`${slug} → found but NO category_id`);
    else { fail(`${slug} → NOT FOUND`); report.summary.criticalIssues.push(`Collection missing: ${slug}`); }
  }

  report.summary.collectionsOk = report.stage1_collections.filter((c) => c.found && c.categoryId).length;
}

// ── STAGE 2: Topic Generation ─────────────────────────────────────────────────
async function validateStage2() {
  h1("STAGE 2: Topic Generation");

  // Test 3 collections: docker, python, investing-basics
  const testCollections = ["docker", "python", "investing-basics"];

  for (const slug of testCollections) {
    h2(`Collection: ${slug}`);
    const { data: col } = await supabase.from("collections").select("id, slug, category_id").eq("slug", slug).single();
    if (!col) { fail(`Collection not found: ${slug}`); continue; }

    const seedTopics: string[] = COLLECTION_TOPICS[slug] ?? [];
    
    const stageEntry: ValidationReport["stage2_topics"][0] = {
      collection: slug,
      topicsGenerated: seedTopics,
      domainCheck: [],
      issues: [],
    };

    if (seedTopics.length === 0) {
      stageEntry.issues.push("No seed topics defined");
      fail("No seed topics defined");
    } else {
      ok(`${seedTopics.length} seed topics defined`);

      // Domain check — verify entity types are in correct domain family
      for (const topic of seedTopics.slice(0, 5)) {
        const domain = classifyTopicDomain(topic);
        const expectedDomains: Record<string, string[]> = {
          docker: ["tech_tool_cli", "tech_programming_concept", "tech_framework"],
          python: ["tech_programming_language", "tech_programming_concept", "tech_framework"],
          "investing-basics": [
            "finance_investment_instrument", "finance_financial_formula",
            "finance_investment_strategy", "finance_market_concept", "finance_banking_product",
          ],
        };
        const correct = (expectedDomains[slug] ?? ["tech_programming_language"]).includes(domain);
        stageEntry.domainCheck.push({ topic, domain, correct });

        if (correct) ok(`"${topic}" → ${domain} ✓`);
        else { warn(`"${topic}" → ${domain} (expected ${expectedDomains[slug]?.join("|")})`); stageEntry.issues.push(`Wrong domain for "${topic}": ${domain}`); }
      }

      // Check for duplicates
      const lower = seedTopics.map((t) => t.toLowerCase());
      const dups = lower.filter((t, i) => lower.indexOf(t) !== i);
      if (dups.length > 0) { stageEntry.issues.push(`Duplicate topics: ${dups.join(", ")}`); fail(`Duplicates: ${dups.join(", ")}`); }
      else ok("No duplicate topics");
    }

    report.stage2_topics.push(stageEntry);
    if (stageEntry.issues.length === 0) report.summary.topicsOk++;
  }
}

// ── STAGE 3: Knowledge Expansion ─────────────────────────────────────────────
async function validateStage3() {
  h1("STAGE 3: Knowledge Expansion — Entity + Intent + Level");

  // Each test case documents: topic → expected intent → expected level → key article signal
  const testTopics: Array<{ topic: string; expectedIntent: string; expectedLevel: string; mustContain: string }> = [
    { topic: "Docker",                    expectedIntent: "definition",      expectedLevel: "beginner",      mustContain: "What Is"          },
    { topic: "Docker Commands",           expectedIntent: "reference",       expectedLevel: "beginner",      mustContain: "Cheat Sheet"       },
    { topic: "Learn Python",             expectedIntent: "tutorial",        expectedLevel: "beginner",      mustContain: "Beginners"         },
    { topic: "Advanced Docker",          expectedIntent: "definition",      expectedLevel: "advanced",      mustContain: "Deep Dive"         },
    { topic: "Docker for DevOps",        expectedIntent: "definition",      expectedLevel: "professional",  mustContain: "Production"        },
    { topic: "Docker vs Kubernetes",     expectedIntent: "comparison",      expectedLevel: "beginner",      mustContain: "Comparison"        },
    { topic: "Python Intermediate Guide", expectedIntent: "guide",          expectedLevel: "intermediate",  mustContain: "Practical"         },
    { topic: "Compound Interest Formula", expectedIntent: "calculator",     expectedLevel: "beginner",      mustContain: "Formula"           },
    { topic: "Index Funds",              expectedIntent: "definition",      expectedLevel: "beginner",      mustContain: "What Is"           },
    { topic: "Best Index Funds 2024",    expectedIntent: "review",          expectedLevel: "beginner",      mustContain: "Review"            },
    { topic: "Docker not working",       expectedIntent: "troubleshooting", expectedLevel: "beginner",      mustContain: "Errors"            },
    { topic: "Type 2 Diabetes",          expectedIntent: "definition",      expectedLevel: "beginner",      mustContain: "What Is"           },
  ];

  // Import intent + level classifiers
  const { classifySearchIntent, classifyReaderLevel } = await import("../services/intelligence/topicSearchIntentClassifier");

  for (const { topic, expectedIntent, expectedLevel, mustContain } of testTopics) {
    const domain = classifyTopicDomain(topic);
    const intent = classifySearchIntent(topic);
    const level  = classifyReaderLevel(topic);
    const plans  = generateArticleExpansionPlans(topic);

    const genericCount = plans.filter((p) => isGenericTitle(p.title)).length;
    const hasGeneric   = genericCount > 0;
    const containsKey  = plans.some((p) => p.title.toLowerCase().includes(mustContain.toLowerCase()));

    const entry: ValidationReport["stage3_expansion"][0] = {
      topic,
      domain,
      articleCount: plans.length,
      sampleTitles: plans.slice(0, 5).map((p) => p.title),
      hasGenericTitles: hasGeneric,
      issues: [],
    };

    const intentOk = intent === expectedIntent;
    const levelOk  = level  === expectedLevel;

    h2(`"${topic}"`);
    intentOk ? ok(`Intent: ${intent} ✓`) : warn(`Intent: ${intent} (expected ${expectedIntent})`);
    levelOk  ? ok(`Level: ${level} ✓`)   : warn(`Level: ${level} (expected ${expectedLevel})`);
    ok(`Entity: ${domain}`);
    ok(`${plans.length} article plans`);

    for (const p of plans.slice(0, 3)) {
      const generic = isGenericTitle(p.title);
      if (generic) { warn(`GENERIC: "${p.title}"`); entry.issues.push(`Generic title: ${p.title}`); }
      else ok(`  → "${p.title}"`);
    }

    if (!containsKey) {
      warn(`Missing expected article containing "${mustContain}"`);
      entry.issues.push(`Roadmap missing article containing "${mustContain}"`);
    } else {
      ok(`Roadmap contains expected article (${mustContain}) ✓`);
    }

    if (!intentOk) entry.issues.push(`Wrong intent: ${intent} vs expected ${expectedIntent}`);
    if (!levelOk)  entry.issues.push(`Wrong level: ${level} vs expected ${expectedLevel}`);
    if (plans.length < 4) { entry.issues.push("Too few article plans"); fail(`Only ${plans.length} plans`); }
    if (hasGeneric) { entry.issues.push(`${genericCount} generic titles`); report.summary.criticalIssues.push(`Generic expansion: ${topic}`); }

    report.stage3_expansion.push(entry);
    if (entry.issues.length === 0) report.summary.expansionOk++;
  }
}

// ── STAGE 4: Research ─────────────────────────────────────────────────────────
async function validateStage4() {
  h1("STAGE 4: Research Agent (Knowledge Pack)");

  // Test 2 topics only to save quota
  const testKeywords = [
    { keyword: "Docker CMD vs ENTRYPOINT", expectedFields: ["codeExamples", "comparisonTable", "sideA", "sideB"] },
    { keyword: "Index Funds", expectedFields: ["formula", "workedExample", "types", "advantages"] },
  ];

  for (const { keyword, expectedFields } of testKeywords) {
    h2(`Research: "${keyword}"`);
    try {
      const { pack, intent } = await runResearchAgent(keyword, "general");
      const packKeys = Object.keys(pack);

      const entry: ValidationReport["stage4_research"][0] = {
        keyword,
        intent,
        hasDomainFields: false,
        fields: packKeys,
        issues: [],
      };

      ok(`Intent: ${intent}`);
      ok(`Fields returned: ${packKeys.join(", ")}`);

      const foundExpected = expectedFields.filter((f) => packKeys.includes(f));
      entry.hasDomainFields = foundExpected.length >= 1;

      if (entry.hasDomainFields) ok(`Domain fields found: ${foundExpected.join(", ")}`);
      else {
        const msg = `Missing expected domain fields: ${expectedFields.filter((f) => !packKeys.includes(f)).join(", ")}`;
        warn(msg);
        entry.issues.push(msg);
      }

      if (!pack.primaryDefinition || pack.primaryDefinition.length < 20) {
        entry.issues.push("primaryDefinition too short or missing");
        fail("primaryDefinition weak");
      } else ok(`Definition: "${pack.primaryDefinition.slice(0, 80)}..."`);

      report.stage4_research.push(entry);
      if (entry.issues.length === 0) report.summary.researchOk++;

      // Wait to avoid rate limit
      console.log("  ⏳ Waiting 20s...");
      await new Promise((r) => setTimeout(r, 20000));
    } catch (err: any) {
      fail(`Research failed: ${err.message}`);
      report.summary.criticalIssues.push(`Research failed for "${keyword}": ${err.message}`);
    }
  }
}

// ── STAGE 5: Writing + Editorial Review ───────────────────────────────────────
async function validateStage5() {
  h1("STAGE 5: Writing + Editorial Review");

  // 1 article per domain type — 3 total
  const testArticles = [
    { keyword: "Docker CMD vs ENTRYPOINT", checks: ["code", "table"] },
    { keyword: "Index Funds", checks: ["formula", "table"] },
  ];

  for (const { keyword, checks } of testArticles) {
    h2(`Writing: "${keyword}"`);
    try {
      const { pack, intent } = await runResearchAgent(keyword, "general");
      const { structure } = await runOutlineAgent(pack, intent);
      const { content } = await runWriterAgent(pack, structure, intent);
      const quality = runDeterministicQualityCheck(content);
      const seo = buildDeterministicSEOFields(structure.title, keyword, pack);
      const editorial = await runFullEditorialReview(content, keyword, seo.metaTitle, seo.metaDescription);

      const hasCode = /```[\s\S]+?```/.test(content);
      const hasTables = /\|.+\|.+\|/.test(content);
      const hasFormulas = /\*\*Formula\*\*|Formula:|=\s*[\w\s\+\-\*\/\(\)]+/.test(content);
      const genericDetected = [
        /core principles/i, /whether you are a beginner or an expert/i,
        /in today.?s world/i, /this comprehensive guide/i
      ].some((p) => p.test(content));

      const entry: ValidationReport["stage5_writing"][0] = {
        keyword,
        intent,
        wordCount: quality.wordCount,
        qualityScore: quality.score,
        editorialScore: editorial.overallScore,
        passed: editorial.passed,
        rewrites: 0,
        sections: structure.sections.map((s) => s.heading),
        hasCode,
        hasTables,
        hasFormulas,
        genericDetected,
        issues: [...quality.issues],
      };

      ok(`Intent: ${intent}`);
      ok(`Words: ${quality.wordCount} | Quality: ${quality.score}/100 | Editorial: ${editorial.overallScore}/100`);
      ok(`Sections: ${entry.sections.join(" | ")}`);

      if (checks.includes("code") && !hasCode) { warn("Missing code blocks"); entry.issues.push("No code blocks found"); }
      else if (checks.includes("code")) ok("Code blocks present ✓");

      if (checks.includes("table") && !hasTables) { warn("Missing comparison table"); entry.issues.push("No table found"); }
      else if (checks.includes("table")) ok("Tables present ✓");

      if (checks.includes("formula") && !hasFormulas) { warn("Missing formula"); entry.issues.push("No formula found"); }
      else if (checks.includes("formula")) ok("Formula present ✓");

      if (genericDetected) { fail("Generic template language detected!"); entry.issues.push("Generic template detected"); report.summary.criticalIssues.push(`Generic content in: ${keyword}`); }
      else ok("No generic template language ✓");

      if (editorial.passed) { ok(`Editorial PASSED (${editorial.overallScore}/100)`); report.summary.writingOk++; }
      else { warn(`Editorial FAILED (${editorial.overallScore}/100): ${editorial.factCheck.issues.slice(0,2).join("; ")}`); report.summary.writingFailed++; }

      report.stage5_writing.push(entry);
      report.summary.avgQuality = (report.summary.avgQuality + quality.score) / (report.stage5_writing.length);
      report.summary.avgEditorial = (report.summary.avgEditorial + editorial.overallScore) / (report.stage5_writing.length);

      console.log("  ⏳ Waiting 30s...");
      await new Promise((r) => setTimeout(r, 30000));
    } catch (err: any) {
      fail(`Writing failed: ${err.message}`);
      report.summary.criticalIssues.push(`Writing failed for "${keyword}": ${err.message}`);
    }
  }
}

// ── FINAL REPORT ──────────────────────────────────────────────────────────────
function printReport() {
  h1("VALIDATION REPORT");

  console.log(`
STAGE 1 – Collections:        ${report.summary.collectionsOk}/${TARGET_COLLECTIONS.length} OK
STAGE 2 – Topic Generation:   ${report.summary.topicsOk}/3 collections validated
STAGE 3 – Knowledge Expansion: ${report.summary.expansionOk}/4 topics OK
STAGE 4 – Research:            ${report.summary.researchOk}/2 OK
STAGE 5 – Writing:             ${report.summary.writingOk} passed / ${report.summary.writingFailed} failed
Avg Quality Score:             ${report.summary.avgQuality.toFixed(1)}/100
Avg Editorial Score:           ${report.summary.avgEditorial.toFixed(1)}/100
`);

  if (report.summary.criticalIssues.length > 0) {
    console.log("CRITICAL ISSUES:");
    report.summary.criticalIssues.forEach((i) => console.log("  ✗ " + i));
  } else {
    console.log("✓ No critical issues found.");
  }

  console.log("\nTopic samples (Docker):");
  const dockerStage = report.stage2_topics.find((t) => t.collection === "docker");
  dockerStage?.topicsGenerated.slice(0, 8).forEach((t) => console.log("  •", t));

  console.log("\nArticle expansion (Docker):");
  const dockerExp = report.stage3_expansion.find((e) => e.topic === "Docker");
  dockerExp?.sampleTitles.forEach((t) => console.log("  •", t));

  console.log("\nArticle expansion (Index Funds):");
  const finExp = report.stage3_expansion.find((e) => e.topic === "Index Funds");
  finExp?.sampleTitles.forEach((t) => console.log("  •", t));

  const pass = report.summary.criticalIssues.length === 0 && report.summary.writingFailed === 0;
  console.log("\n" + sep("═"));
  console.log(pass ? "✅ VALIDATION PASSED — Pipeline ready for production" : "❌ VALIDATION FAILED — Fix issues before scaling");
  console.log(sep("═"));
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("Pipeline Validation — " + new Date().toISOString());

  await validateStage1();
  await validateStage2();
  await validateStage3();

  const skipLLM = process.argv.includes("--no-llm");
  if (!skipLLM) {
    await validateStage4();
    await validateStage5();
  } else {
    console.log("\n[Skipping LLM stages — pass --no-llm removed to run all stages]");
  }

  printReport();
}

main().catch(console.error);
