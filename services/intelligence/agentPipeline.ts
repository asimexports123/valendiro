/**
 * 3-Agent Gemini Pipeline  (+ optional deterministic review)
 *
 * Gemini is used ONLY where reasoning, writing, or judgment is required.
 * Everything else (slug, SEO validation, duplicate check, links, metadata) stays
 * in deterministic code — LLM tokens are not wasted on mechanical operations.
 *
 * Gemini Calls:
 *   Agent 1 — Research Agent   (temp 0.3, 4096 tokens)
 *     Input:  keyword + category
 *     Output: KnowledgePack JSON — definitions, entities, FAQs, examples, mistakes
 *
 *   Agent 2 — Outline Agent    (temp 0.3, 2048 tokens)
 *     Input:  KnowledgePack
 *     Output: ArticleStructure JSON — sections, order, word targets
 *
 *   Agent 3 — Writer Agent     (temp 0.4, 8192 tokens)
 *     Input:  KnowledgePack + ArticleStructure
 *     Output: Complete Markdown article (1500–3000 words)
 *
 * Deterministic (no Gemini):
 *   SEO fields      — meta title/description built from pack + title by code
 *   Quality check   — structural validation by regex/word count
 *   Slug            — code
 *   Internal links  — hierarchical linker
 *   Schema JSON     — schema generator
 *
 * Quota handling:
 *   QuotaExhaustedError propagates upward without retry.
 *   The pipeline catches it and sets the queue item to "pending_llm" status,
 *   then continues to the next item. Resume happens automatically next day.
 */

import { getActiveLLMProvider } from "@/services/llm/llmProvider";
import "@/services/llm";
import { runFullEditorialReview, type EditorialReviewResult } from "./editorialReviewEngine"

// ─── Shared Types ─────────────────────────────────────────────────────────────

export interface AgentKnowledgePack {
  keyword: string;
  category: string;
  primaryDefinition: string;
  coreConcepts: string[];
  keyEntities: { name: string; role: string }[];
  useCases: string[];
  commonMistakes: string[];
  faqs: { question: string; answer: string }[];
  comparisons: string[];
  statistics: string[];
  targetAudience: string;
  searchIntent: "informational" | "commercial" | "navigational" | "transactional";
}

export interface AgentSection {
  order: number;
  heading: string;
  type: string;
  purpose: string;
  keyPoints: string[];
  estimatedWords: number;
}

export interface AgentArticleStructure {
  title: string;
  articleType: string;
  targetWordCount: number;
  sections: AgentSection[];
  mustInclude: string[];
  mustAvoid: string[];
}

/** Deterministic quality check — no LLM tokens used */
export interface AgentQualityReport {
  score: number;       // 0–100 estimated from structural checks
  passed: boolean;     // true if score >= 60
  issues: string[];
  wordCount: number;
  h2Count: number;
  hasConclusion: boolean;
  hasFAQ: boolean;
}

/** Deterministic SEO fields — built from pack + title by code, no LLM */
export interface AgentSEOFields {
  metaTitle: string;         // max 60 chars
  metaDescription: string;   // max 155 chars
  primaryKeyword: string;
  secondaryKeywords: string[];
}

export interface AgentPipelineResult {
  keyword: string;
  knowledgePack: AgentKnowledgePack;
  articleStructure: AgentArticleStructure;
  finalContent: string;
  finalTitle: string;
  qualityReport: AgentQualityReport;
  editorialReview: EditorialReviewResult;
  seoFields: AgentSEOFields;
  metaTitle: string;
  metaDescription: string;
  wordCount: number;
  totalDurationMs: number;
  agentDurationsMs: Record<string, number>;
  geminiCallCount: number;   // 3 writer + 3 editorial = 6 per article
  retryCount: number;
  autoPublish: boolean;      // true if all editorial reviewers passed
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseJSON<T>(raw: string, fallback: T): T {
  // Strip markdown code fences if Gemini wraps response
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Try to extract first JSON object/array
    const match = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (match) {
      try { return JSON.parse(match[1]) as T; } catch { /* fall through */ }
    }
    return fallback;
  }
}

async function callAgent(
  agentName: string,
  systemPrompt: string,
  userPrompt: string,
  temperature: number,
  maxTokens: number
): Promise<{ content: string; durationMs: number }> {
  const provider = getActiveLLMProvider();
  const start = Date.now();
  const response = await provider.complete({
    systemPrompt,
    userPrompt,
    temperature,
    maxTokens,
  });
  const durationMs = Date.now() - start;
  console.log(`[AgentPipeline] ${agentName} done in ${durationMs}ms (${response.outputTokens} tokens, provider: ${response.provider})`);
  return { content: response.content, durationMs };
}

// ─── Domain Detector ─────────────────────────────────────────────────────────

function detectDomain(keyword: string, category: string): string {
  const text = (keyword + " " + category).toLowerCase();
  if (/docker|kubernetes|linux|bash|python|javascript|typescript|react|node|api|sql|git|css|html|programming|code|software|algorithm|database|server|cloud|aws|devops|cli|terminal|command|function|variable|class|framework/.test(text)) return "technology";
  if (/invest|stock|bond|crypto|finance|money|tax|budget|loan|mortgage|interest|compound|dividend|portfolio|bank|insurance|401k|ira|etf|mutual fund|revenue|profit|loss/.test(text)) return "finance";
  if (/health|disease|symptom|treatment|medicine|doctor|hospital|diet|nutrition|vitamin|exercise|mental|anxiety|depression|cortisol|hormone|cancer|diabetes|heart|blood/.test(text)) return "health";
  if (/law|legal|court|contract|rights|constitution|attorney|lawsuit|regulation|compliance/.test(text)) return "legal";
  if (/science|physics|chemistry|biology|math|formula|equation|theory|research|experiment/.test(text)) return "science";
  return "general";
}

function buildDomainSpecificInstructions(domain: string): string {
  switch (domain) {
    case "technology":
      return `DOMAIN: Technology/Programming
You MUST include in the Knowledge Pack:
- codeExamples: 2-4 real code snippets (actual syntax, not pseudocode)
- commands: CLI commands or syntax examples if applicable
- comparisonTable: key differences as [{"aspect": string, "optionA": string, "optionB": string}] if topic is a comparison
- technicalDetails: exact parameters, flags, options, return types
- ecosystem: related tools, libraries, alternatives
FAQs must be specific technical questions ("What happens when...", "How do I override...", "What is the difference between...")
Common mistakes must be real coding/config errors developers make.`;
    case "finance":
      return `DOMAIN: Finance/Economics
You MUST include in the Knowledge Pack:
- formulas: exact mathematical formulas with variable explanations
- calculations: 1-2 worked numeric examples (e.g. "$10,000 at 7% for 10 years = $19,671")
- comparisonTable: compare options/products if applicable
- risks: specific financial risks and how to mitigate them
- regulations: relevant laws or regulations if applicable
FAQs must be specific ("How much...", "What is the formula for...", "Is X better than Y?").
Common mistakes must be real money mistakes people make.`;
    case "health":
      return `DOMAIN: Health/Medical
You MUST include in the Knowledge Pack:
- symptoms: list of specific symptoms if applicable
- causes: root causes, risk factors
- treatments: evidence-based treatments, interventions
- warnings: when to see a doctor, red flags
- normalRanges: normal vs abnormal values/ranges if applicable
FAQs must be health questions people actually search ("Can X cause Y?", "How long does...", "Is X normal?").
Common mistakes must be real patient/practitioner errors.
ADD a disclaimer: "This is educational content, not medical advice. Consult a doctor."` ;
    case "science":
      return `DOMAIN: Science
You MUST include:
- formulas: key equations or laws
- experiments: notable experiments or proofs
- realWorldApplications: how this appears in everyday life
- comparisonTable: if comparing concepts/theories`;
    default:
      return `DOMAIN: General Knowledge
Focus on: clear definitions, concrete examples, real-world applications.
Avoid vague generalisations.`;
  }
}

// ─── Agent 1: Research Agent ──────────────────────────────────────────────────

const RESEARCH_SYSTEM_BASE = `You are a domain-expert Research Agent at a professional knowledge publishing company.
Your Knowledge Packs are used by writers to produce authoritative, specific, useful articles — NOT generic educational essays.

CRITICAL RULES:
- Every field must contain SPECIFIC, USEFUL information a writer can directly use.
- Do NOT write generic statements like "It is important to understand..." or "This concept helps in many ways".
- Do NOT hallucinate statistics, studies, or claims you are not certain about.
- FAQs must be EXACT questions real users type into Google — not vague.
- Common mistakes must be PRACTITIONER-LEVEL specific errors — not obvious beginner stuff.
- If topic is a comparison (X vs Y), you MUST include a detailed comparison table.
- codeExamples (for tech topics) must be REAL, RUNNABLE syntax — not pseudocode.

Return ONLY valid JSON. No markdown. No explanation outside the JSON.`;

function buildResearchUserPrompt(keyword: string, category: string, domain: string): string {
  const domainInstructions = buildDomainSpecificInstructions(domain);
  return `Keyword: "${keyword}"
Category: "${category}"
Domain: ${domain}

${domainInstructions}

Produce the Knowledge Pack JSON now. Schema:
{
  "keyword": "${keyword}",
  "category": "${category}",
  "primaryDefinition": "2-3 precise sentences. Must define the exact concept, not the category.",
  "coreConcepts": ["specific concept 1", "specific concept 2"],
  "keyEntities": [{"name": "exact name", "role": "specific role in this topic"}],
  "useCases": ["specific real-world use case with context"],
  "commonMistakes": ["specific mistake: what they do wrong and why it fails"],
  "faqs": [{"question": "exact Google search query", "answer": "direct answer in 2-3 sentences"}],
  "comparisons": ["X vs Y: key difference"],
  "statistics": ["only include if you are certain — include source"],
  "targetAudience": "specific audience description",
  "searchIntent": "informational",
  "codeExamples": ["actual code snippet if tech topic, else omit"],
  "comparisonTable": [{"aspect": "label", "optionA": "value", "optionB": "value"}],
  "domainSpecific": {"include any domain-specific fields listed above"}
}`;
}

export async function runResearchAgent(
  keyword: string,
  category: string
): Promise<{ pack: AgentKnowledgePack; durationMs: number }> {
  const domain = detectDomain(keyword, category);
  const userPrompt = buildResearchUserPrompt(keyword, category, domain);
  const { content, durationMs } = await callAgent("ResearchAgent", RESEARCH_SYSTEM_BASE, userPrompt, 0.3, 4096);

  const fallback: AgentKnowledgePack = {
    keyword,
    category,
    primaryDefinition: `${keyword} is a key concept in ${category}.`,
    coreConcepts: [keyword],
    keyEntities: [],
    useCases: [],
    commonMistakes: [],
    faqs: [{ question: `What is ${keyword}?`, answer: `${keyword} is a key concept in ${category}.` }],
    comparisons: [],
    statistics: [],
    targetAudience: "general audience",
    searchIntent: "informational",
  };

  const pack = parseJSON<AgentKnowledgePack>(content, fallback);
  return { pack, durationMs };
}

// ─── Agent 2: Outline Agent ───────────────────────────────────────────────────

const OUTLINE_SYSTEM = `You are an Outline Agent at a professional knowledge publishing company.

YOUR TASK:
Given a Knowledge Pack, produce an article outline that directly answers what a user searching for this keyword actually wants to know.

CRITICAL RULES:
- Section headings must be SPECIFIC to the topic — never generic ("How CMD Works in Docker" not "How It Works").
- If the Knowledge Pack has codeExamples: there MUST be a code/syntax section.
- If the Knowledge Pack has comparisonTable: there MUST be a comparison section with a table.
- If the Knowledge Pack has formulas/calculations: there MUST be a calculations section.
- If the Knowledge Pack has symptoms/treatments: there MUST be dedicated sections for each.
- Every article MUST end with FAQ and Conclusion.
- mustInclude must list SPECIFIC things from the Knowledge Pack (e.g. "Include the Dockerfile syntax example", "Include CMD vs ENTRYPOINT table").
- mustAvoid must list generic filler ("Core Principles", "Continuous improvement", vague motivational text).
- Target: 1800-2500 words. Every section should add real value.

OUTPUT:
Return ONLY valid JSON. No markdown. No explanation.
{
  "title": string (specific, SEO-friendly, under 65 chars),
  "articleType": "guide" | "explainer" | "how-to" | "comparison" | "reference",
  "targetWordCount": number (1800-2500),
  "sections": [
    {
      "order": number,
      "heading": string (SPECIFIC to the topic),
      "type": "introduction" | "definition" | "how_it_works" | "examples" | "comparison" | "code" | "mistakes" | "faq" | "conclusion" | "deep_dive",
      "purpose": string (what specific question this section answers),
      "keyPoints": string[] (exact content points from Knowledge Pack to cover),
      "estimatedWords": number
    }
  ],
  "mustInclude": string[] (specific content items that MUST appear),
  "mustAvoid": string[] (generic phrases and filler to avoid)
}`;

export async function runOutlineAgent(
  pack: AgentKnowledgePack
): Promise<{ structure: AgentArticleStructure; durationMs: number }> {
  const userPrompt = `Knowledge Pack:\n${JSON.stringify(pack, null, 2)}\n\nProduce the Article Structure JSON now.`;
  const { content, durationMs } = await callAgent("OutlineAgent", OUTLINE_SYSTEM, userPrompt, 0.3, 2048);

  const fallback: AgentArticleStructure = {
    title: pack.keyword,
    articleType: "guide",
    targetWordCount: 1800,
    sections: [
      { order: 1, heading: `What Is ${pack.keyword}?`, type: "definition", purpose: "Define the topic", keyPoints: [pack.primaryDefinition], estimatedWords: 300 },
      { order: 2, heading: "Key Concepts", type: "how_it_works", purpose: "Explain core concepts", keyPoints: pack.coreConcepts, estimatedWords: 400 },
      { order: 3, heading: "Common Mistakes", type: "mistakes", purpose: "Warn about pitfalls", keyPoints: pack.commonMistakes, estimatedWords: 300 },
      { order: 4, heading: "Frequently Asked Questions", type: "faq", purpose: "Answer user questions", keyPoints: [], estimatedWords: 400 },
      { order: 5, heading: "Conclusion", type: "conclusion", purpose: "Summarise key points", keyPoints: [], estimatedWords: 200 },
    ],
    mustInclude: ["definition", "FAQ section", "conclusion"],
    mustAvoid: ["marketing language", "placeholder text"],
  };

  const structure = parseJSON<AgentArticleStructure>(content, fallback);
  return { structure, durationMs };
}

// ─── Agent 3: Writer Agent ────────────────────────────────────────────────────

const WRITER_SYSTEM = `You are a Writer Agent for an autonomous knowledge publishing system.

YOUR TASK:
Write a complete, high-quality article in Markdown using ONLY the provided Knowledge Pack and Article Structure.

WRITING STANDARDS:
- Quality benchmark: Investopedia, NerdWallet, or Healthline level clarity and depth.
- Write for an intelligent reader who is not yet an expert.
- Every claim must come from the Knowledge Pack. Do NOT add information not in the pack.
- Use specific examples, not vague generalisations.
- Vary sentence length. Mix short punchy sentences with longer explanatory ones.
- Use **bold** for key terms on first use.
- Use tables where comparison data exists.
- FAQ answers must be direct — answer in the first sentence, then elaborate.

DO NOT:
- Use marketing language ("game-changing", "revolutionary", "unlock your potential").
- Use filler phrases ("In today's world", "It is important to note", "Delve into").
- Write placeholder content ("[Add more here]", "To be completed").
- Repeat information across sections.
- Add a top-level # title — start directly with the first ## section.

OUTPUT:
Return ONLY the article in Markdown. No JSON, no preamble, no "Here is the article:".`;

export async function runWriterAgent(
  pack: AgentKnowledgePack,
  structure: AgentArticleStructure
): Promise<{ content: string; durationMs: number }> {
  const sectionsGuide = structure.sections
    .map(s => `Section ${s.order}: ## ${s.heading}\nType: ${s.type}\nPurpose: ${s.purpose}\nKey points to cover: ${s.keyPoints.join("; ") || "see knowledge pack"}\nTarget: ~${s.estimatedWords} words`)
    .join("\n\n");

  const userPrompt = `KNOWLEDGE PACK:
Keyword: ${pack.keyword}
Definition: ${pack.primaryDefinition}
Core Concepts: ${pack.coreConcepts.join(", ")}
Key Entities: ${pack.keyEntities.map(e => `${e.name} (${e.role})`).join(", ") || "none"}
Use Cases: ${pack.useCases.join("; ")}
Common Mistakes: ${pack.commonMistakes.join("; ")}
FAQs: ${pack.faqs.map(f => `Q: ${f.question} | A: ${f.answer}`).join("\n")}
Comparisons: ${pack.comparisons.join("; ") || "none"}
Statistics: ${pack.statistics.join("; ") || "none — do not invent any"}

ARTICLE STRUCTURE:
Title: ${structure.title}
Type: ${structure.articleType}
Target word count: ${structure.targetWordCount}
Must include: ${structure.mustInclude.join(", ")}
Must avoid: ${structure.mustAvoid.join(", ")}

SECTIONS TO WRITE:
${sectionsGuide}

Write the complete article now. Start immediately with the first ## heading.`;

  const { content, durationMs } = await callAgent(
    "WriterAgent",
    WRITER_SYSTEM,
    userPrompt,
    0.4,
    8192
  );
  return { content, durationMs };
}

// ─── Deterministic Quality Check (no Gemini) ─────────────────────────────────
// Structural validation only. No LLM tokens spent on mechanical checks.

export function runDeterministicQualityCheck(content: string): AgentQualityReport {
  const words = content.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const h2Matches = content.match(/^##\s+.+/gm) ?? [];
  const h2Count = h2Matches.length;
  const hasConclusion = /^##\s+(conclusion|summary|final thoughts|key takeaways|next steps)/im.test(content);
  const hasFAQ = /^##\s+(frequently asked questions|faq|common questions)/im.test(content);

  const issues: string[] = [];
  let score = 100;

  if (wordCount < 500)  { issues.push(`Too short: ${wordCount} words (minimum 500)`); score -= 30; }
  if (h2Count < 3)      { issues.push(`Too few H2 sections: ${h2Count} (minimum 3)`); score -= 20; }
  if (!hasConclusion)   { issues.push("Missing Conclusion section"); score -= 15; }
  if (!hasFAQ)          { issues.push("Missing FAQ section"); score -= 15; }
  if (wordCount < 800)  { score -= 10; }

  // Filler/placeholder detection
  const FILLER = [/\[to be completed\]/i, /\[add content\]/i, /lorem ipsum/i, /placeholder/i];
  for (const p of FILLER) {
    if (p.test(content)) { issues.push(`Placeholder text detected: ${p.source}`); score -= 20; break; }
  }

  score = Math.max(0, Math.min(100, score));

  return {
    score,
    passed: score >= 60,
    issues,
    wordCount,
    h2Count,
    hasConclusion,
    hasFAQ,
  };
}

// ─── Deterministic SEO Field Builder (no Gemini) ─────────────────────────────
// meta_title and meta_description built from the KnowledgePack and article title.
// No LLM tokens spent generating 160-character fields.

export function buildDeterministicSEOFields(
  title: string,
  keyword: string,
  pack: AgentKnowledgePack
): AgentSEOFields {
  // meta_title: use article title, trim to 60 chars
  const rawTitle = title.trim();
  const metaTitle = rawTitle.length <= 60 ? rawTitle : rawTitle.slice(0, 57).trimEnd() + "...";

  // meta_description: keyword + definition snippet, max 155 chars
  const definitionSnippet = pack.primaryDefinition
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 110);
  const rawDesc = `${keyword}: ${definitionSnippet}`;
  const metaDescription = rawDesc.length <= 155 ? rawDesc : rawDesc.slice(0, 152).trimEnd() + "...";

  // Secondary keywords: coreConcepts that are not the primary keyword
  const secondaryKeywords = pack.coreConcepts
    .filter(c => c.toLowerCase() !== keyword.toLowerCase())
    .slice(0, 5);

  return {
    metaTitle,
    metaDescription,
    primaryKeyword: keyword,
    secondaryKeywords,
  };
}

// ─── Main Pipeline Orchestrator — 3 Gemini Calls ─────────────────────────────
//
// Total Gemini calls per article: 3
// Deterministic operations: quality check, SEO fields, slug, links, schema
//
// QuotaExhaustedError is NOT caught here — it propagates to the publishing
// engine which sets the queue item to "pending_llm" and skips to the next item.

const MAX_RETRIES = 2; // Max rewrite attempts if editorial review fails

export async function runAgentPipeline(
  keyword: string,
  category: string
): Promise<AgentPipelineResult> {
  const pipelineStart = Date.now();
  const durations: Record<string, number> = {};
  let retryCount = 0;

  console.log(`[AgentPipeline] Starting 6-call pipeline for: "${keyword}" (${category})`);

  // Call 1: Research (always once — reuse on retries)
  const { pack, durationMs: d1 } = await runResearchAgent(keyword, category);
  durations["research"] = d1;

  // Call 2: Outline (always once — reuse on retries)
  const { structure, durationMs: d2 } = await runOutlineAgent(pack);
  durations["outline"] = d2;

  let content: string;
  let editorialReview: EditorialReviewResult;
  let seoFields: AgentSEOFields;

  // Retry loop: Write → Editorial Review → Rewrite if needed
  while (true) {
    // Call 3: Write
    const writeStart = Date.now();
    const writeResult = await runWriterAgent(pack, structure);
    content = writeResult.content;
    durations[`write_${retryCount}`] = writeResult.durationMs;

    // Deterministic SEO fields
    seoFields = buildDeterministicSEOFields(structure.title, keyword, pack);

    // Calls 4+5+6: Editorial Review (Fact + Quality + SEO) — parallel
    const reviewStart = Date.now();
    editorialReview = await runFullEditorialReview(
      content,
      keyword,
      seoFields.metaTitle,
      seoFields.metaDescription
    );
    durations[`review_${retryCount}`] = Date.now() - reviewStart;

    console.log(
      `[AgentPipeline] Review attempt ${retryCount + 1}: ` +
      `fact=${editorialReview.factCheck.score} quality=${editorialReview.qualityReview.score} ` +
      `seo=${editorialReview.seoReview.score} overall=${editorialReview.overallScore} ` +
      `passed=${editorialReview.passed}`
    );

    if (editorialReview.passed || retryCount >= MAX_RETRIES) break;

    retryCount++;
    console.log(`[AgentPipeline] Rewriting "${keyword}" (attempt ${retryCount + 1}/${MAX_RETRIES + 1})...`);
  }

  // Deterministic quality check — no LLM
  const qualityReport = runDeterministicQualityCheck(content!);
  const wordCount = qualityReport.wordCount;
  const totalDurationMs = Date.now() - pipelineStart;

  console.log(
    `[AgentPipeline] Done "${keyword}" — ${wordCount} words, ` +
    `overall: ${editorialReview!.overallScore}/100 (${editorialReview!.passed ? "PASS" : "FAIL"}), ` +
    `retries: ${retryCount}, total: ${totalDurationMs}ms`
  );

  return {
    keyword,
    knowledgePack: pack,
    articleStructure: structure,
    finalContent: content!,
    finalTitle: structure.title,
    qualityReport,
    editorialReview: editorialReview!,
    seoFields: seoFields!,
    metaTitle: seoFields!.metaTitle,
    metaDescription: seoFields!.metaDescription,
    wordCount,
    totalDurationMs,
    agentDurationsMs: durations,
    geminiCallCount: 3 + (3 * (retryCount + 1)), // 3 editorial per attempt
    retryCount,
    autoPublish: editorialReview!.passed,
  };
}
