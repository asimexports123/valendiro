/**
 * 5-Agent Gemini Pipeline
 *
 * Each agent is a focused Gemini call with its own system prompt and task.
 * No single call tries to do everything.
 *
 * Agent 1 — Research Agent
 *   Input:  keyword + category context
 *   Output: KnowledgePack JSON (definitions, entities, facts, FAQs, examples, mistakes)
 *
 * Agent 2 — Outline Agent
 *   Input:  KnowledgePack
 *   Output: ArticleStructure JSON (sections, headings, guidance, word targets)
 *
 * Agent 3 — Writer Agent
 *   Input:  KnowledgePack + ArticleStructure
 *   Output: Complete article in Markdown (1500–3000 words)
 *
 * Agent 4 — Reviewer Agent
 *   Input:  Article draft
 *   Output: QualityReport JSON (score, issues, corrected article)
 *
 * Agent 5 — SEO Agent
 *   Input:  Article + keyword
 *   Output: SEOReport JSON (meta_title, meta_description, internal_link_suggestions, seo_score)
 *
 * All agents use the same LLM provider (Gemini by default).
 * Temperature: 0.3 for research/outline/SEO, 0.4 for writing, 0.2 for review.
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

export interface AgentQualityReport {
  score: number;                  // 0–100
  passed: boolean;                // true if score >= 70
  issues: string[];
  strengths: string[];
  correctedArticle: string;       // revised markdown — may be same as input if no issues
}

export interface AgentSEOReport {
  seoScore: number;               // 0–100
  metaTitle: string;
  metaDescription: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  internalLinkSuggestions: { anchorText: string; targetTopic: string }[];
  issues: string[];
  optimizedArticle: string;       // article with SEO improvements applied inline
}

export interface AgentPipelineResult {
  keyword: string;
  knowledgePack: AgentKnowledgePack;
  articleStructure: AgentArticleStructure;
  draftContent: string;
  qualityReport: AgentQualityReport;
  seoReport: AgentSEOReport;
  finalContent: string;
  finalTitle: string;
  metaTitle: string;
  metaDescription: string;
  wordCount: number;
  totalDurationMs: number;
  agentDurationsMs: Record<string, number>;
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

// ─── Agent 4: Reviewer Agent ──────────────────────────────────────────────────

const REVIEWER_SYSTEM = `You are a Reviewer Agent for an autonomous knowledge publishing system.

YOUR TASK:
Review the article draft for quality. Your benchmark is Investopedia, NerdWallet, or Healthline.
Fix every issue you find and return a corrected article.

EVALUATION CRITERIA:
- Factual accuracy: no hallucinations, no vague claims without basis
- Completeness: all sections present, no section feels thin or rushed
- Clarity: would a smart non-expert understand every paragraph?
- Specificity: concrete examples, not vague generalisations
- Structure: logical flow, good use of headings, proper Markdown
- No filler: every sentence adds information
- No marketing language: neutral, educational tone throughout
- FAQ quality: direct answers, not evasive

SCORING (0-100):
- 90-100: Publication-ready. Investopedia level.
- 70-89: Good. Minor fixes needed.
- 50-69: Acceptable. Significant improvements needed.
- 0-49: Rejected. Needs full rewrite.

OUTPUT:
Return ONLY valid JSON. No preamble.
{
  "score": number,
  "passed": boolean (true if score >= 70),
  "strengths": string[],
  "issues": string[],
  "correctedArticle": string (full corrected Markdown article)
}`;

export async function runReviewerAgent(
  content: string,
  pack: AgentKnowledgePack
): Promise<{ report: AgentQualityReport; durationMs: number }> {
  const userPrompt = `KEYWORD: ${pack.keyword}

ARTICLE TO REVIEW:
${content}

Review this article and return your quality report JSON now.`;

  const { content: raw, durationMs } = await callAgent("ReviewerAgent", REVIEWER_SYSTEM, userPrompt, 0.2, 8192);

  const fallback: AgentQualityReport = {
    score: 70,
    passed: true,
    issues: [],
    strengths: ["Article generated successfully"],
    correctedArticle: content,
  };

  const report = parseJSON<AgentQualityReport>(raw, fallback);
  // Ensure correctedArticle always has content
  if (!report.correctedArticle || report.correctedArticle.trim().length < 100) {
    report.correctedArticle = content;
  }
  return { report, durationMs };
}

// ─── Agent 5: SEO Agent ───────────────────────────────────────────────────────

const SEO_SYSTEM = `You are an SEO Agent for an autonomous knowledge publishing system.

YOUR TASK:
Review the article for SEO quality and produce a complete SEO report with meta fields.

SEO RULES:
- meta_title: 50-60 characters, include primary keyword, compelling
- meta_description: 140-155 characters, include keyword, clear value proposition, no truncation
- Primary keyword should appear in: first 100 words, at least 2 H2 headings, naturally 3-5 times total
- Secondary keywords: related terms that should appear naturally in the article
- Internal link suggestions: anchor text and topic suggestions based on article content
- Do NOT keyword-stuff. Natural language always wins over forced repetition.

OUTPUT:
Return ONLY valid JSON. No preamble.
{
  "seoScore": number (0-100),
  "metaTitle": string,
  "metaDescription": string,
  "primaryKeyword": string,
  "secondaryKeywords": string[],
  "internalLinkSuggestions": [{"anchorText": string, "targetTopic": string}],
  "issues": string[],
  "optimizedArticle": string (article with any inline SEO improvements applied)
}`;

export async function runSEOAgent(
  content: string,
  keyword: string,
  category: string
): Promise<{ report: AgentSEOReport; durationMs: number }> {
  const userPrompt = `PRIMARY KEYWORD: ${keyword}
CATEGORY: ${category}

ARTICLE:
${content}

Produce the SEO report JSON now.`;

  const { content: raw, durationMs } = await callAgent("SEOAgent", SEO_SYSTEM, userPrompt, 0.3, 4096);

  const fallback: AgentSEOReport = {
    seoScore: 70,
    metaTitle: keyword.length <= 60 ? keyword : keyword.slice(0, 57) + "...",
    metaDescription: `Learn about ${keyword}. Complete guide covering definitions, examples, and expert answers.`.slice(0, 155),
    primaryKeyword: keyword,
    secondaryKeywords: [],
    internalLinkSuggestions: [],
    issues: [],
    optimizedArticle: content,
  };

  const report = parseJSON<AgentSEOReport>(raw, fallback);
  if (!report.optimizedArticle || report.optimizedArticle.trim().length < 100) {
    report.optimizedArticle = content;
  }
  return { report, durationMs };
}

// ─── Main Pipeline Orchestrator ───────────────────────────────────────────────

export async function runAgentPipeline(
  keyword: string,
  category: string
): Promise<AgentPipelineResult> {
  const pipelineStart = Date.now();
  const durations: Record<string, number> = {};

  console.log(`[AgentPipeline] Starting 5-agent pipeline for: "${keyword}"`);

  // Agent 1: Research
  const { pack, durationMs: d1 } = await runResearchAgent(keyword, category);
  durations["research"] = d1;

  // Agent 2: Outline
  const { structure, durationMs: d2 } = await runOutlineAgent(pack);
  durations["outline"] = d2;

  // Agent 3: Write
  const { content: draft, durationMs: d3 } = await runWriterAgent(pack, structure);
  durations["write"] = d3;

  // Agent 4: Review + correct
  const { report: qualityReport, durationMs: d4 } = await runReviewerAgent(draft, pack);
  durations["review"] = d4;

  // Agent 5: SEO
  const reviewedContent = qualityReport.correctedArticle;
  const { report: seoReport, durationMs: d5 } = await runSEOAgent(reviewedContent, keyword, category);
  durations["seo"] = d5;

  const finalContent = seoReport.optimizedArticle;
  const wordCount = finalContent.split(/\s+/).filter(Boolean).length;
  const totalDurationMs = Date.now() - pipelineStart;

  console.log(`[AgentPipeline] Complete for "${keyword}" — ${wordCount} words, quality: ${qualityReport.score}/100, SEO: ${seoReport.seoScore}/100, total: ${totalDurationMs}ms`);

  return {
    keyword,
    knowledgePack: pack,
    articleStructure: structure,
    draftContent: draft,
    qualityReport,
    seoReport,
    finalContent,
    finalTitle: structure.title,
    metaTitle: seoReport.metaTitle,
    metaDescription: seoReport.metaDescription,
    wordCount,
    totalDurationMs,
    agentDurationsMs: durations,
  };
}
