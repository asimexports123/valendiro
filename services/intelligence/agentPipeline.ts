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
  seoFields: AgentSEOFields;
  metaTitle: string;
  metaDescription: string;
  wordCount: number;
  totalDurationMs: number;
  agentDurationsMs: Record<string, number>;
  geminiCallCount: number;   // always 3 in normal operation
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

// ─── Agent 1: Research Agent ──────────────────────────────────────────────────

const RESEARCH_SYSTEM = `You are a Research Agent for an autonomous knowledge publishing system.

YOUR TASK:
Given a keyword and category, produce a structured Knowledge Pack that a writer will use to write a complete article.

RULES:
- Only include factual, verifiable information.
- Do NOT hallucinate statistics, studies, company names, or claims.
- If you are uncertain about a fact, omit it entirely.
- Be specific. Generic statements are useless to the writer.
- FAQs must be real questions a user would type into Google.
- Common mistakes must be real, practitioner-level mistakes — not obvious.

OUTPUT:
Return ONLY valid JSON matching this exact schema. No markdown, no explanation.
{
  "keyword": string,
  "category": string,
  "primaryDefinition": string (2-3 sentences, precise),
  "coreConcepts": string[] (5-8 key concepts),
  "keyEntities": [{"name": string, "role": string}] (people, tools, orgs, frameworks),
  "useCases": string[] (3-5 concrete real-world applications),
  "commonMistakes": string[] (4-6 specific mistakes practitioners make),
  "faqs": [{"question": string, "answer": string}] (5-7 FAQ pairs),
  "comparisons": string[] (2-3 "X vs Y" comparisons relevant to this topic),
  "statistics": string[] (2-4 real stats with source, or omit if uncertain),
  "targetAudience": string,
  "searchIntent": "informational" | "commercial" | "navigational" | "transactional"
}`;

export async function runResearchAgent(
  keyword: string,
  category: string
): Promise<{ pack: AgentKnowledgePack; durationMs: number }> {
  const userPrompt = `Keyword: "${keyword}"\nCategory: "${category}"\n\nProduce the Knowledge Pack JSON now.`;
  const { content, durationMs } = await callAgent("ResearchAgent", RESEARCH_SYSTEM, userPrompt, 0.3, 4096);

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

const OUTLINE_SYSTEM = `You are an Outline Agent for an autonomous knowledge publishing system.

YOUR TASK:
Given a Knowledge Pack, produce a structured article outline that a writer will follow exactly.

RULES:
- Every section must have a clear purpose that maps to specific Knowledge Pack content.
- Minimum 6 sections, maximum 10 sections.
- Every article MUST include: Introduction, at least one concept section, Examples, FAQ, Conclusion.
- Headings must be specific, not generic ("How Compound Interest Works" not "How It Works").
- estimatedWords must add up to the targetWordCount.
- mustInclude: specific things the writer MUST put in the article.
- mustAvoid: specific things the writer must NOT write.

OUTPUT:
Return ONLY valid JSON matching this exact schema. No markdown, no explanation.
{
  "title": string (compelling, SEO-friendly, under 65 chars),
  "articleType": "guide" | "explainer" | "how-to" | "comparison" | "reference",
  "targetWordCount": number (1500-2500),
  "sections": [
    {
      "order": number,
      "heading": string,
      "type": "introduction" | "definition" | "how_it_works" | "examples" | "comparison" | "mistakes" | "faq" | "conclusion" | "deep_dive",
      "purpose": string,
      "keyPoints": string[],
      "estimatedWords": number
    }
  ],
  "mustInclude": string[],
  "mustAvoid": string[]
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

export async function runAgentPipeline(
  keyword: string,
  category: string
): Promise<AgentPipelineResult> {
  const pipelineStart = Date.now();
  const durations: Record<string, number> = {};

  console.log(`[AgentPipeline] Starting 3-call pipeline for: "${keyword}" (${category})`);

  // Gemini Call 1: Research
  const { pack, durationMs: d1 } = await runResearchAgent(keyword, category);
  durations["research"] = d1;

  // Gemini Call 2: Outline
  const { structure, durationMs: d2 } = await runOutlineAgent(pack);
  durations["outline"] = d2;

  // Gemini Call 3: Write
  const { content, durationMs: d3 } = await runWriterAgent(pack, structure);
  durations["write"] = d3;

  // Deterministic quality check — no Gemini
  const qualityReport = runDeterministicQualityCheck(content);

  // Deterministic SEO fields — no Gemini
  const seoFields = buildDeterministicSEOFields(structure.title, keyword, pack);

  const wordCount = qualityReport.wordCount;
  const totalDurationMs = Date.now() - pipelineStart;

  console.log(
    `[AgentPipeline] Done "${keyword}" — ${wordCount} words, ` +
    `quality: ${qualityReport.score}/100 (${qualityReport.passed ? "PASS" : "FAIL"}), ` +
    `total: ${totalDurationMs}ms, gemini calls: 3`
  );

  return {
    keyword,
    knowledgePack: pack,
    articleStructure: structure,
    finalContent: content,
    finalTitle: structure.title,
    qualityReport,
    seoFields,
    metaTitle: seoFields.metaTitle,
    metaDescription: seoFields.metaDescription,
    wordCount,
    totalDurationMs,
    agentDurationsMs: durations,
    geminiCallCount: 3,
  };
}
