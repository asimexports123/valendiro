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

// ─── Intent Classifier ───────────────────────────────────────────────────────
// Classifies WHAT the topic is before any research begins.
// This determines the research strategy, outline structure, and writing style.

export type TopicIntent =
  | "programming_tutorial"   // Docker, Kubernetes, Python, React
  | "programming_concept"    // What is recursion, What are closures
  | "programming_comparison" // CMD vs ENTRYPOINT, useEffect vs useLayoutEffect
  | "finance_concept"        // What is compound interest, Index funds
  | "finance_product"        // Credit card, Mortgage, ETF
  | "finance_calculator"     // Mortgage calculator, ROI calculator
  | "health_condition"       // Diabetes, Anxiety, Cortisol
  | "health_treatment"       // How to treat X, Medication Y
  | "health_nutrition"       // Diet, Vitamins, Supplements
  | "movie_tv"               // Movie, TV series, Miniseries
  | "person_celebrity"       // Actor, Politician, Athlete
  | "place_travel"           // Eiffel Tower, Paris, destination
  | "product_review"         // Tesla Model 3, iPhone, Product X
  | "company_org"            // Tesla company, Google, startup
  | "historical_event"       // World War II, Moon landing
  | "scientific_concept"     // Quantum mechanics, DNA
  | "legal_topic"            // Copyright law, Contract
  | "news_current"           // FIFA World Cup 2026, Recent event
  | "educational_concept"    // Gerrymandering, Photosynthesis
  | "general";               // Fallback

function classifyIntent(keyword: string): TopicIntent {
  const k = keyword.toLowerCase().trim();

  // Programming comparison (must check before tutorial/concept)
  if (/\bvs\b|versus|difference between|compared to|or\s+\w+\?/.test(k) &&
    /docker|kubernetes|linux|python|javascript|typescript|react|node|api|sql|git|css|html|code|software|algorithm|cloud|aws|devops|command|function|class|framework|cmd|entrypoint|useeffect|uselayout|interface|type|promise|async/.test(k))
    return "programming_comparison";

  // Programming tutorial (how to do X)
  if (/how to|how do|step by step|install|setup|configure|deploy|build|create|run|use|implement/.test(k) &&
    /docker|kubernetes|linux|python|javascript|typescript|react|node|api|sql|git|css|html|code|software|algorithm|cloud|aws|devops|command|function|class|framework/.test(k))
    return "programming_tutorial";

  // Programming concept (what is X in tech)
  if (/docker|kubernetes|linux|bash|python|javascript|typescript|react|node\.js|api|sql|git|css|html|programming|code|software|algorithm|database|server|cloud|aws|devops|cli|terminal|command|function|variable|class|framework|logits|softmax|epoch|iteration|kubectl|ingress|load.?balancer|entrypoint|dockerfile/.test(k))
    return "programming_concept";

  // Finance calculator
  if (/calculator|calculate|how much|formula for|compound interest|roi|return on investment|amortization/.test(k))
    return "finance_calculator";

  // Finance product
  if (/credit card|mortgage|loan|etf|mutual fund|index fund|bond|savings account|checking account|401k|ira|roth/.test(k))
    return "finance_product";

  // Finance concept
  if (/invest|stock|bond|crypto|finance|money|tax|budget|interest|compound|dividend|portfolio|bank|insurance|revenue|profit|loss|inflation|recession|gdp|economics/.test(k))
    return "finance_concept";

  // Health condition
  if (/diabetes|cancer|anxiety|depression|cortisol|hypertension|asthma|arthritis|alzheimer|parkinson|adhd|autism|obesity|cholesterol|thyroid|hormone|disease|disorder|syndrome|condition|infection/.test(k))
    return "health_condition";

  // Health treatment
  if (/treatment|therapy|medication|medicine|drug|surgery|vaccine|remedy|cure|how to treat|how to manage/.test(k) &&
    /health|disease|symptom|doctor|medical|patient/.test(k))
    return "health_treatment";

  // Health nutrition
  if (/diet|nutrition|vitamin|supplement|protein|calorie|carb|fat|keto|vegan|intermittent fasting|weight loss|muscle|exercise|workout|fitness/.test(k))
    return "health_nutrition";

  // Movie / TV
  if (/movie|film|series|miniseries|mini.series|tv show|television|season|episode|streaming|netflix|hulu|disney|hbo|prime video|documentary|anime|sitcom|drama/.test(k) ||
    /\(\d{4}\)/.test(k) ||
    /\(film\)|\(series\)|\(miniseries\)|\(tv\)/.test(k))
    return "movie_tv";

  // Person / Celebrity
  if (/who is|biography|born|actor|actress|singer|musician|athlete|politician|ceo|founder|president|prime minister|director|author/.test(k))
    return "person_celebrity";

  // Place / Travel
  if (/eiffel tower|statue of liberty|great wall|taj mahal|travel|visit|tourism|destination|city|country|hotel|flight|trip/.test(k))
    return "place_travel";

  // Product review
  if (/tesla|iphone|samsung|macbook|ipad|android|model 3|model s|model x|model y|review|specs|features|price|buy|best/.test(k) &&
    !/credit card|mortgage/.test(k))
    return "product_review";

  // Company
  if (/company|corporation|startup|founded|headquarters|revenue|employees|ceo of|history of/.test(k) &&
    /tesla|google|apple|microsoft|amazon|meta|facebook|twitter|uber|airbnb|netflix|spotify/.test(k))
    return "company_org";

  // Historical event
  if (/world war|ww1|ww2|wwii|wwi|revolution|battle|war|historical|history of|ancient|medieval|empire|dynasty|independence/.test(k))
    return "historical_event";

  // News / Current events
  if (/2024|2025|2026|fifa world cup|olympics|election|summit|championship|tournament|award|oscar|grammy/.test(k))
    return "news_current";

  // Scientific concept
  if (/science|physics|chemistry|biology|math|formula|equation|theory|quantum|dna|evolution|gravity|photosynthesis|atom|molecule|cell/.test(k))
    return "scientific_concept";

  // Legal
  if (/law|legal|court|contract|rights|constitution|attorney|lawsuit|regulation|compliance|copyright|patent|trademark/.test(k))
    return "legal_topic";

  // Educational concept (fallback for known educational topics)
  if (/gerrymandering|democracy|socialism|capitalism|philosophy|psychology|sociology|economics|political|government|constitution|amendment/.test(k))
    return "educational_concept";

  return "general";
}

function buildResearchPromptForIntent(keyword: string, intent: TopicIntent): string {
  const base = `Topic: "${keyword}"
Intent: ${intent}

`;

  switch (intent) {
    case "programming_concept":
    case "programming_tutorial":
      return base + `You are researching a programming/technology topic.
Extract ONLY factual, specific technical information.

Return JSON:
{
  "keyword": "${keyword}",
  "intent": "${intent}",
  "primaryDefinition": "Precise 2-3 sentence technical definition. What it is, what it does, why it exists.",
  "coreConcepts": ["specific technical concept with brief explanation"],
  "syntax": "exact syntax or command if applicable — e.g. docker run [OPTIONS] IMAGE [COMMAND]",
  "codeExamples": ["real working code snippet — not pseudocode"],
  "parameters": ["parameter/flag: what it does"],
  "howItWorks": "step-by-step technical explanation of internals",
  "useCases": ["specific real-world use case — not generic"],
  "commonErrors": ["exact error message or mistake: why it happens, how to fix"],
  "bestPractices": ["specific best practice with reasoning"],
  "ecosystem": ["related tool/library: how it relates"],
  "faqs": [{"question": "exact technical question developers Google", "answer": "direct technical answer"}],
  "targetAudience": "developers/engineers working with X",
  "searchIntent": "informational"
}`;

    case "programming_comparison":
      return base + `You are researching a programming comparison topic.
Extract specific technical differences between the two concepts.

Return JSON:
{
  "keyword": "${keyword}",
  "intent": "${intent}",
  "primaryDefinition": "One sentence each defining both sides of the comparison.",
  "sideA": {"name": "", "definition": "", "whenToUse": "", "example": ""},
  "sideB": {"name": "", "definition": "", "whenToUse": "", "example": ""},
  "comparisonTable": [{"aspect": "specific dimension", "sideA": "value", "sideB": "value"}],
  "codeExamples": ["concrete code showing the difference"],
  "commonMistake": "the #1 mistake developers make when choosing between these",
  "recommendation": "when to use which, with specific scenario",
  "faqs": [{"question": "exact comparison question developers Google", "answer": "direct answer with technical detail"}],
  "searchIntent": "informational"
}`;

    case "finance_concept":
      return base + `You are researching a finance/investment concept.
Extract specific, factual financial information.

Return JSON:
{
  "keyword": "${keyword}",
  "intent": "${intent}",
  "primaryDefinition": "Precise 2-3 sentence financial definition.",
  "howItWorks": "step-by-step explanation of the financial mechanism",
  "formula": "mathematical formula if applicable with variable definitions",
  "workedExample": "concrete numeric example — e.g. If you invest $10,000 at 7% for 10 years...",
  "types": ["specific type or variant: brief description"],
  "advantages": ["specific, concrete advantage"],
  "disadvantages": ["specific, concrete risk or downside"],
  "taxImplications": "relevant tax treatment if applicable",
  "regulations": "relevant regulations or limits (e.g. IRS contribution limits)",
  "faqs": [{"question": "exact question investors search", "answer": "direct answer with numbers where possible"}],
  "targetAudience": "investors/savers considering this option",
  "searchIntent": "informational"
}`;

    case "finance_product":
      return base + `You are researching a financial product (credit card, mortgage, loan, etc.).

Return JSON:
{
  "keyword": "${keyword}",
  "intent": "${intent}",
  "primaryDefinition": "What this financial product is and its primary purpose.",
  "howItWorks": "step-by-step: how you get it, how it works, how you pay/earn",
  "keyTerms": [{"term": "", "definition": ""}],
  "typicalRates": "current typical rates/fees/limits (be specific)",
  "eligibilityRequirements": ["specific requirement"],
  "prosAndCons": {"pros": ["specific pro"], "cons": ["specific con"]},
  "comparisonWithAlternatives": "how it compares to similar products",
  "howToChoose": "specific criteria for choosing this product",
  "warnings": ["specific warning or gotcha"],
  "faqs": [{"question": "exact question consumers search", "answer": "direct answer"}],
  "searchIntent": "informational"
}`;

    case "finance_calculator":
      return base + `You are researching a financial calculator or formula topic.

Return JSON:
{
  "keyword": "${keyword}",
  "intent": "${intent}",
  "primaryDefinition": "What this calculation is used for.",
  "formula": "exact mathematical formula with all variables defined",
  "workedExamples": ["complete step-by-step numeric example — show all math"],
  "variables": [{"name": "", "definition": "", "typicalValues": ""}],
  "howToUse": "step-by-step guide to using this calculation",
  "commonScenarios": ["specific real-world scenario with numbers"],
  "limitations": ["specific limitation of this formula/calculator"],
  "faqs": [{"question": "exact calculation question people search", "answer": "direct answer with example"}],
  "searchIntent": "informational"
}`;

    case "health_condition":
      return base + `You are researching a medical condition or health topic.
Extract clinically accurate information.

Return JSON:
{
  "keyword": "${keyword}",
  "intent": "${intent}",
  "primaryDefinition": "Medical definition: what it is, who it affects, prevalence.",
  "symptoms": ["specific symptom with description"],
  "causes": ["specific cause or risk factor"],
  "riskFactors": ["specific demographic or lifestyle risk factor"],
  "diagnosis": "how it is diagnosed — tests, criteria, who diagnoses",
  "treatments": ["evidence-based treatment: medication/therapy/lifestyle — be specific"],
  "complications": ["potential complication if untreated"],
  "normalRanges": "normal vs abnormal values/ranges if applicable (e.g. blood glucose)",
  "whenToSeeDoctor": ["specific red flag symptom"],
  "lifestyle": ["specific evidence-based lifestyle change"],
  "faqs": [{"question": "exact health question people Google", "answer": "direct, accurate answer"}],
  "disclaimer": "This article is for educational purposes only. Consult a healthcare professional for medical advice.",
  "searchIntent": "informational"
}`;

    case "health_nutrition":
      return base + `You are researching a nutrition or fitness topic.

Return JSON:
{
  "keyword": "${keyword}",
  "intent": "${intent}",
  "primaryDefinition": "What this is and its primary health role.",
  "nutritionalFacts": "specific nutritional data — macros, calories, key nutrients",
  "healthBenefits": ["specific evidence-based health benefit with mechanism"],
  "dosageOrAmount": "recommended daily amounts or serving sizes",
  "foodSources": ["specific food source with approximate amount"],
  "deficiencySymptoms": ["specific symptom of deficiency"],
  "risks": ["specific risk from excess or deficiency"],
  "interactions": ["interaction with medication or condition"],
  "faqs": [{"question": "exact nutrition question people search", "answer": "direct answer with data"}],
  "searchIntent": "informational"
}`;

    case "movie_tv":
      return base + `You are researching a movie, TV show, or miniseries.
Extract ONLY factual entertainment information.

Return JSON:
{
  "keyword": "${keyword}",
  "intent": "${intent}",
  "primaryDefinition": "One sentence: what it is, genre, release year, platform.",
  "type": "movie | TV series | miniseries | documentary | anime",
  "genre": ["genre"],
  "releaseInfo": {"year": "", "platform": "", "network": "", "country": ""},
  "creator": "director, showrunner, or creator name",
  "cast": [{"name": "actor name", "role": "character name"}],
  "plot": "2-3 sentence non-spoiler plot summary",
  "episodes": "number of episodes/seasons if series",
  "basedOn": "source material if adapted from book/comic/etc",
  "criticalReception": "Rotten Tomatoes score or critical consensus if available",
  "awards": ["notable award or nomination"],
  "whereToWatch": ["streaming platform or availability"],
  "faqs": [{"question": "exact question fans search", "answer": "direct factual answer"}],
  "searchIntent": "informational"
}`;

    case "person_celebrity":
      return base + `You are researching a person (celebrity, politician, athlete, etc.).

Return JSON:
{
  "keyword": "${keyword}",
  "intent": "${intent}",
  "primaryDefinition": "Who they are in one sentence: profession, nationality, known for.",
  "fullName": "",
  "born": "birth date and place",
  "nationality": "",
  "profession": ["specific profession/role"],
  "knownFor": ["specific achievement or work"],
  "career": "career timeline — key milestones",
  "notableWorks": ["specific work, film, book, achievement"],
  "awards": ["specific award"],
  "personalLife": "brief factual personal life info if widely known",
  "faqs": [{"question": "exact question people search about this person", "answer": "direct factual answer"}],
  "searchIntent": "informational"
}`;

    case "place_travel":
      return base + `You are researching a place or travel destination.

Return JSON:
{
  "keyword": "${keyword}",
  "intent": "${intent}",
  "primaryDefinition": "What and where it is in one sentence.",
  "location": "city, country, coordinates",
  "type": "landmark | city | country | region | natural wonder",
  "history": "brief factual history — when built/founded, by whom, why",
  "keyFacts": ["specific fact: height, size, age, visitor count"],
  "thingsToSee": ["specific attraction with description"],
  "practicalInfo": {"openingHours": "", "entryFee": "", "bestTimeToVisit": ""},
  "howToGet": "how to reach — nearest airport, transport",
  "nearbyAttractions": ["nearby attraction"],
  "faqs": [{"question": "exact travel question people search", "answer": "direct practical answer"}],
  "searchIntent": "informational"
}`;

    case "product_review":
      return base + `You are researching a product.

Return JSON:
{
  "keyword": "${keyword}",
  "intent": "${intent}",
  "primaryDefinition": "What this product is in one sentence — maker, category, purpose.",
  "keySpecs": [{"spec": "", "value": ""}],
  "price": "starting price and variants",
  "pros": ["specific, concrete advantage"],
  "cons": ["specific, concrete disadvantage"],
  "whoItIsFor": "specific ideal buyer description",
  "competitors": [{"name": "", "keyDifference": ""}],
  "verdict": "one paragraph honest assessment",
  "faqs": [{"question": "exact question buyers search", "answer": "direct answer"}],
  "searchIntent": "commercial"
}`;

    case "historical_event":
      return base + `You are researching a historical event.

Return JSON:
{
  "keyword": "${keyword}",
  "intent": "${intent}",
  "primaryDefinition": "What happened, when, where — one precise sentence.",
  "dates": "start and end dates",
  "location": "",
  "causes": ["specific historical cause"],
  "keyFigures": [{"name": "", "role": ""}],
  "keyEvents": [{"date": "", "event": "what happened"}],
  "consequences": ["specific short-term and long-term consequence"],
  "significance": "why this event matters historically",
  "casualties": "if applicable — factual numbers",
  "faqs": [{"question": "exact history question people search", "answer": "direct factual answer"}],
  "searchIntent": "informational"
}`;

    case "news_current":
      return base + `You are researching a current event or recent news topic.

Return JSON:
{
  "keyword": "${keyword}",
  "intent": "${intent}",
  "primaryDefinition": "What this event is — in one precise sentence.",
  "when": "dates and timeline",
  "where": "location",
  "keyFacts": ["specific factual detail"],
  "keyFigures": [{"name": "", "role": ""}],
  "background": "context — why this event is happening",
  "currentStatus": "current state as of your knowledge cutoff",
  "significance": "why it matters",
  "faqs": [{"question": "exact question people are searching right now", "answer": "direct factual answer"}],
  "searchIntent": "informational"
}`;

    case "educational_concept":
      return base + `You are researching an educational or civics concept.

Return JSON:
{
  "keyword": "${keyword}",
  "intent": "${intent}",
  "primaryDefinition": "Precise 2-3 sentence definition.",
  "origin": "when and how this concept originated",
  "howItWorks": "step-by-step explanation",
  "realWorldExamples": ["specific real-world example with context"],
  "types": ["specific type or variant"],
  "pros": ["specific advantage"],
  "cons": ["specific disadvantage or criticism"],
  "significance": "why this concept matters in practice",
  "faqs": [{"question": "exact question students/citizens search", "answer": "direct answer"}],
  "searchIntent": "informational"
}`;

    case "scientific_concept":
      return base + `You are researching a scientific concept.

Return JSON:
{
  "keyword": "${keyword}",
  "intent": "${intent}",
  "primaryDefinition": "Scientific definition: precise, accurate.",
  "formula": "mathematical formula if applicable",
  "howItWorks": "mechanistic explanation — the science behind it",
  "keyPrinciples": ["specific scientific principle"],
  "realWorldApplications": ["specific application in everyday life or technology"],
  "experiments": ["notable experiment that demonstrated this concept"],
  "faqs": [{"question": "exact science question people search", "answer": "direct accurate answer"}],
  "searchIntent": "informational"
}`;

    default:
      return base + `Research this topic and return a comprehensive Knowledge Pack.

Return JSON:
{
  "keyword": "${keyword}",
  "intent": "${intent}",
  "primaryDefinition": "Precise 2-3 sentence definition of what this topic is.",
  "coreConcepts": ["specific concept"],
  "keyFacts": ["specific factual detail"],
  "realWorldExamples": ["concrete example"],
  "faqs": [{"question": "exact question people search", "answer": "direct answer"}],
  "searchIntent": "informational"
}`;
  }
}

function buildOutlinePromptForIntent(keyword: string, intent: TopicIntent): string {
  const intentOutlineRules: Record<string, string> = {
    programming_concept: `Sections MUST include: What Is X, How It Works (with code), Syntax/Usage, Common Errors, Best Practices, FAQ, Conclusion. NO generic sections like "Core Principles" or "Advantages".`,
    programming_tutorial: `Sections MUST include: Prerequisites, Step-by-Step Guide (numbered), Code Examples, Common Errors & Fixes, Next Steps, FAQ. NO theory sections — this is a hands-on tutorial.`,
    programming_comparison: `Sections MUST include: Quick Summary Table, What Is X, What Is Y, Key Differences (with comparison table), When to Use X vs Y, Code Examples, FAQ. Do NOT pick a winner without clear reasoning.`,
    finance_concept: `Sections MUST include: What Is X, How It Works, Formula & Calculation (with worked example), Types, Pros & Cons, Tax Implications (if relevant), FAQ. Include REAL numbers.`,
    finance_product: `Sections MUST include: What Is X, How It Works, Key Terms Explained, Typical Rates/Fees, Who Should Get It, How to Apply, Warnings, FAQ.`,
    finance_calculator: `Sections MUST include: What This Calculates, The Formula (with all variables), Step-by-Step Example (with real numbers), How to Use It, Common Scenarios, Limitations, FAQ.`,
    health_condition: `Sections MUST include: What Is X (medical definition), Symptoms, Causes & Risk Factors, Diagnosis, Treatment Options, When to See a Doctor, Living With X (if chronic), FAQ, Disclaimer.`,
    health_nutrition: `Sections MUST include: What Is X, Nutritional Profile, Health Benefits (evidence-based), Recommended Daily Amount, Best Food Sources, Deficiency Signs, Risks of Excess, FAQ.`,
    movie_tv: `Sections MUST include: What Is [Title] (type/genre/year/platform), Plot Overview, Cast & Characters, Episodes/Seasons (if series), Creator & Production, Critical Reception, Where to Watch, FAQ. NO sections like "Core Principles" or "Advantages".`,
    person_celebrity: `Sections MUST include: Who Is X (brief bio), Early Life & Background, Career Highlights, Notable Works/Achievements, Awards, Personal Life (brief), FAQ.`,
    place_travel: `Sections MUST include: What Is X & Where Is It, History & Background, Key Attractions, Practical Visit Info (hours, fees, best time), How to Get There, Nearby Attractions, FAQ.`,
    product_review: `Sections MUST include: Overview (what it is), Key Specs, Pros, Cons, Who It Is For, How It Compares to Competitors, Verdict, FAQ.`,
    historical_event: `Sections MUST include: What Was X & When Did It Happen, Background & Causes, Key Events Timeline, Key Figures, Consequences & Impact, Historical Significance, FAQ.`,
    news_current: `Sections MUST include: What Is Happening, Key Facts, Background & Context, Key People/Organizations Involved, Current Status, Why It Matters, FAQ.`,
    educational_concept: `Sections MUST include: What Is X, How It Works (with real example), Historical Origin, Real-World Examples, Pros & Cons, Why It Matters Today, FAQ.`,
    scientific_concept: `Sections MUST include: What Is X (scientific definition), The Science Behind It (mechanism), Formula/Laws (if applicable), Real-World Applications, Notable Experiments, FAQ.`,
  };

  const rules = intentOutlineRules[intent] ?? `Create sections that directly answer what a user searching "${keyword}" wants to know.`;

  return `Topic: "${keyword}"
Intent: ${intent}

OUTLINE RULES FOR THIS INTENT:
${rules}

Knowledge Pack:
{{KNOWLEDGE_PACK}}

Generate the article outline JSON:
{
  "title": "SEO-optimized title under 65 chars — specific to the topic",
  "articleType": "guide|explainer|how-to|comparison|reference|review|profile",
  "targetWordCount": 1800,
  "sections": [
    {
      "order": 1,
      "heading": "SPECIFIC heading — not generic",
      "type": "introduction|definition|how_it_works|code|comparison|review|timeline|cast|plot|symptoms|treatment|formula|faq|conclusion",
      "purpose": "exactly what user question this section answers",
      "keyPoints": ["specific point from Knowledge Pack to include"],
      "estimatedWords": 250
    }
  ],
  "mustInclude": ["specific content item from Knowledge Pack that MUST appear in the article"],
  "mustAvoid": ["Core Principles", "Advantages", "Limitations", "Beginner Guide", "generic filler that does not apply to this topic"]
}`;
}

// ─── Agent 1: Research Agent ──────────────────────────────────────────────────

const RESEARCH_SYSTEM_BASE = `You are a domain-expert Research Agent. Your job is to extract ONLY factual, specific information about the given topic.

CRITICAL RULES:
- Return ONLY what you actually know about this specific topic — no generic filler.
- Every field must contain SPECIFIC facts a writer can use directly.
- Do NOT hallucinate statistics, scores, or claims you are not certain about.
- FAQs must be EXACT questions real users type into Google.
- Return ONLY valid JSON. No markdown. No explanation outside the JSON.`;

export async function runResearchAgent(
  keyword: string,
  category: string
): Promise<{ pack: AgentKnowledgePack; intent: TopicIntent; durationMs: number }> {
  const intent = classifyIntent(keyword);
  console.log(`[AgentPipeline] Intent classified: "${keyword}" → ${intent}`);
  const userPrompt = buildResearchPromptForIntent(keyword, intent);
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
  return { pack, intent, durationMs };
}

// ─── Agent 2: Outline Agent ───────────────────────────────────────────────────

const OUTLINE_SYSTEM = `You are an Outline Agent. Generate a specific, intent-matched article structure.
Return ONLY valid JSON. No markdown. No explanation.`;

export async function runOutlineAgent(
  pack: AgentKnowledgePack,
  intent: TopicIntent
): Promise<{ structure: AgentArticleStructure; durationMs: number }> {
  const promptTemplate = buildOutlinePromptForIntent(pack.keyword, intent);
  const userPrompt = promptTemplate.replace("{{KNOWLEDGE_PACK}}", JSON.stringify(pack, null, 2));
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

function buildWriterSystemForIntent(intent: TopicIntent): string {
  const intentStyle: Record<string, string> = {
    programming_concept:    "You are a senior software engineer writing a technical reference article. Be precise. Include real code. Explain the 'why', not just 'what'.",
    programming_tutorial:   "You are a senior developer writing a hands-on tutorial. Use numbered steps. Every step must have a code example. Include expected output.",
    programming_comparison: "You are a senior developer writing a technical comparison article. Be balanced and objective. Use a comparison table. Show concrete code examples for each option.",
    finance_concept:        "You are a certified financial analyst writing for educated non-experts. Use real numbers. Explain the formula. Show a worked example. Be precise about risks.",
    finance_product:        "You are a consumer finance expert writing an honest product guide. Explain exactly how it works, the real costs, and who should or should not get it.",
    finance_calculator:     "You are a financial educator. Show the exact formula, define every variable, then walk through a complete numeric example step by step.",
    health_condition:       "You are a medical writer working with clinical accuracy. Describe symptoms precisely. List evidence-based treatments. Always include a disclaimer that this is not medical advice.",
    health_nutrition:       "You are a registered dietitian writing an evidence-based nutrition guide. Use specific numbers (grams, percentages). Cite recommended daily amounts.",
    movie_tv:               "You are an entertainment journalist writing a factual guide to this title. Describe the plot without major spoilers. Cover cast, creator, platform, reception. Write naturally — not like a textbook.",
    person_celebrity:       "You are a biographical writer. Focus on facts: career timeline, achievements, notable works. Write in an engaging but factual tone.",
    place_travel:           "You are a travel writer. Be specific: real opening hours, prices, best times to visit. Write as if giving advice to a friend planning a trip.",
    product_review:         "You are a consumer technology reviewer. Be honest about pros and cons. Include real specs. Compare to alternatives. Give a clear recommendation.",
    historical_event:       "You are a historian. Focus on facts: dates, causes, key figures, consequences. Use a timeline structure. Explain why it matters today.",
    news_current:           "You are a journalist writing a factual explainer. Cover what is happening, who is involved, why it matters. Stay strictly factual.",
    educational_concept:    "You are an educator explaining a complex concept to an intelligent non-expert. Use real-world examples. Explain both sides fairly.",
    scientific_concept:     "You are a science communicator. Explain the mechanism clearly. Use analogies for complex ideas. Include real-world applications.",
  };

  const style = intentStyle[intent] ?? "You are an expert writer. Write a factual, useful article that directly answers what a user searching this topic wants to know.";

  return `${style}

WRITING RULES (ALL INTENTS):
- Write for an intelligent reader. Clear, direct, no padding.
- Every claim must come from the provided Knowledge Pack.
- Use **bold** for key terms on first use.
- Use tables where comparison or structured data exists.
- FAQ answers: answer directly in the first sentence, then elaborate.
- Vary sentence length — mix short and long.
- DO NOT use: "game-changing", "revolutionary", "In today's world", "It is important to note", "Delve into", "unlock your potential".
- DO NOT write placeholder text.
- DO NOT repeat information across sections.
- DO NOT add a # title at the top — start directly with the first ## section.

OUTPUT: Return ONLY the article Markdown. No JSON, no preamble.`;
}

export async function runWriterAgent(
  pack: AgentKnowledgePack,
  structure: AgentArticleStructure,
  intent: TopicIntent
): Promise<{ content: string; durationMs: number }> {
  const writerSystem = buildWriterSystemForIntent(intent);

  const sectionsGuide = structure.sections
    .map(s => `## ${s.heading}\nPurpose: ${s.purpose}\nMust cover: ${s.keyPoints.join("; ") || "see knowledge pack"}\nTarget: ~${s.estimatedWords} words`)
    .join("\n\n");

  const userPrompt = `TOPIC: ${pack.keyword}
INTENT: ${intent}

KNOWLEDGE PACK (use ONLY this — do not invent facts):
${JSON.stringify(pack, null, 2)}

ARTICLE STRUCTURE:
Title: ${structure.title}
Type: ${structure.articleType}
Must include: ${structure.mustInclude.join(" | ")}
Must avoid writing: ${structure.mustAvoid.join(" | ")}

SECTIONS:
${sectionsGuide}

Write the complete article now. Start with the first ## heading.`;

  const { content, durationMs } = await callAgent("WriterAgent", writerSystem, userPrompt, 0.4, 8192);
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

  // Generic template detection — penalise hard
  const GENERIC_TEMPLATES = [
    /^##\s+(core principles|advantages and disadvantages|limitations|beginner.?s guide|common mistakes and how to avoid)/im,
    /in today.?s (world|digital age|fast.?paced)/i,
    /this (comprehensive|ultimate|complete) guide will (teach|show|help)/i,
    /whether you are a beginner or an expert/i,
  ];
  for (const p of GENERIC_TEMPLATES) {
    if (p.test(content)) { issues.push(`Generic template language detected: ${p.source}`); score -= 25; break; }
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
  const { pack, intent, durationMs: d1 } = await runResearchAgent(keyword, category);
  durations["research"] = d1;

  // Call 2: Outline (always once — reuse on retries)
  const { structure, durationMs: d2 } = await runOutlineAgent(pack, intent);
  durations["outline"] = d2;

  let content: string;
  let editorialReview: EditorialReviewResult;
  let seoFields: AgentSEOFields;

  // Retry loop: Write → Editorial Review → Rewrite if needed
  while (true) {
    // Call 3: Write
    const writeStart = Date.now();
    const writeResult = await runWriterAgent(pack, structure, intent);
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
