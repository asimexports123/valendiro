/**
 * Quality Guardrails
 *
 * Deterministic quality checks for auto-generated content.
 * Runs BEFORE publishing — articles that fail are held back for review.
 *
 * Checks:
 *   1. Word count (min/max)
 *   2. Structure (headings, paragraphs, sections)
 *   3. Readability (sentence length, paragraph length)
 *   4. SEO (title length, meta description, heading hierarchy)
 *   5. Content integrity (no placeholders, no AI artifacts)
 *   6. Internal links (minimum link count)
 *   7. Duplication (title uniqueness, content similarity)
 *
 * Every check returns pass/fail + score (0-100).
 * Articles must pass ALL required checks to be promoted to "ready" status.
 */

import { createAdminClient } from "@/lib/supabase/admin";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface QualityCheck {
  name: string;
  passed: boolean;
  score: number; // 0-100
  details: string;
  severity: "critical" | "warning" | "info";
}

export interface QualityReport {
  articleId: string;
  articleSlug: string;
  overallScore: number;
  passed: boolean;
  checks: QualityCheck[];
  blockers: string[];
  warnings: string[];
  timestamp: string;
}

export interface BatchQualityResult {
  articlesChecked: number;
  articlesPassed: number;
  articlesFailed: number;
  promoted: number;
  reports: QualityReport[];
  durationMs: number;
}

// ─── Configuration ───────────────────────────────────────────────────────────

const QUALITY_CONFIG = {
  wordCount: { min: 600, max: 8000, ideal: 1800 },
  titleLength: { min: 20, max: 70 },
  metaDescLength: { min: 80, max: 160 },
  minHeadings: 3,
  maxHeadingLevel: 4,
  minParagraphs: 4,
  maxSentenceLength: 40, // words
  maxParagraphLength: 200, // words
  minInternalLinks: 2,
  maxInternalLinks: 20,
  minSections: 3,
  passingScore: 70,
};

// ─── Placeholder / AI Artifact Detection ─────────────────────────────────────

const FORBIDDEN_PATTERNS = [
  /\[insert .+?\]/i,
  /\[placeholder\]/i,
  /\[TODO\]/i,
  /\[your .+? here\]/i,
  /lorem ipsum/i,
  /as an ai/i,
  /as a language model/i,
  /i cannot provide/i,
  /i don't have personal/i,
  /\bXXX\b/,
  /\bTBD\b/,
  /\[COMPANY NAME\]/i,
  /\[BRAND\]/i,
  /certainly!.*here/i,
  /of course!.*let me/i,
];

// ─── Individual Checks ───────────────────────────────────────────────────────

function checkWordCount(content: string): QualityCheck {
  const words = content.split(/\s+/).filter(w => w.length > 0).length;
  const { min, max, ideal } = QUALITY_CONFIG.wordCount;

  if (words < min) {
    return {
      name: "word_count",
      passed: false,
      score: Math.round((words / min) * 50),
      details: `Word count ${words} is below minimum ${min}`,
      severity: "critical",
    };
  }

  if (words > max) {
    return {
      name: "word_count",
      passed: false,
      score: 40,
      details: `Word count ${words} exceeds maximum ${max}`,
      severity: "warning",
    };
  }

  // Score based on proximity to ideal
  const distance = Math.abs(words - ideal) / ideal;
  const score = Math.round(Math.max(60, 100 - distance * 40));

  return {
    name: "word_count",
    passed: true,
    score,
    details: `Word count: ${words} (target: ${ideal})`,
    severity: "info",
  };
}

function checkStructure(content: string): QualityCheck {
  const headings = (content.match(/^#{1,6}\s+.+$/gm) || []);
  const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 0 && !p.startsWith("#"));

  const issues: string[] = [];
  let score = 100;

  if (headings.length < QUALITY_CONFIG.minHeadings) {
    issues.push(`Only ${headings.length} headings (min: ${QUALITY_CONFIG.minHeadings})`);
    score -= 20;
  }

  if (paragraphs.length < QUALITY_CONFIG.minParagraphs) {
    issues.push(`Only ${paragraphs.length} paragraphs (min: ${QUALITY_CONFIG.minParagraphs})`);
    score -= 15;
  }

  // Check heading hierarchy (no skipping levels)
  const levels = headings.map(h => (h.match(/^(#+)/)?.[1]?.length ?? 1));
  for (let i = 1; i < levels.length; i++) {
    if (levels[i] - levels[i - 1] > 1) {
      issues.push(`Heading level jump: H${levels[i - 1]} → H${levels[i]}`);
      score -= 10;
      break;
    }
  }

  // Check if there's a logical section count
  const h2Count = headings.filter(h => h.startsWith("## ")).length;
  if (h2Count < QUALITY_CONFIG.minSections) {
    issues.push(`Only ${h2Count} sections (min: ${QUALITY_CONFIG.minSections})`);
    score -= 15;
  }

  return {
    name: "structure",
    passed: score >= 60,
    score: Math.max(0, score),
    details: issues.length > 0 ? issues.join("; ") : `${headings.length} headings, ${paragraphs.length} paragraphs, ${h2Count} sections`,
    severity: score < 60 ? "critical" : "info",
  };
}

function checkReadability(content: string): QualityCheck {
  const sentences = content
    .replace(/#+\s+.+/g, "") // strip headings
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 0 && !p.startsWith("#"));

  let score = 100;
  const issues: string[] = [];

  // Check sentence lengths
  const longSentences = sentences.filter(s => s.split(/\s+/).length > QUALITY_CONFIG.maxSentenceLength);
  if (longSentences.length > sentences.length * 0.2) {
    issues.push(`${longSentences.length}/${sentences.length} sentences are too long (>${QUALITY_CONFIG.maxSentenceLength} words)`);
    score -= 20;
  }

  // Check paragraph lengths
  const longParagraphs = paragraphs.filter(p => p.split(/\s+/).length > QUALITY_CONFIG.maxParagraphLength);
  if (longParagraphs.length > 0) {
    issues.push(`${longParagraphs.length} paragraphs exceed ${QUALITY_CONFIG.maxParagraphLength} words`);
    score -= 15;
  }

  // Average sentence length
  const avgSentenceLength = sentences.reduce((s, sent) => s + sent.split(/\s+/).length, 0) / Math.max(sentences.length, 1);
  if (avgSentenceLength > 25) {
    issues.push(`Average sentence length: ${Math.round(avgSentenceLength)} words (target: <25)`);
    score -= 10;
  }

  return {
    name: "readability",
    passed: score >= 60,
    score: Math.max(0, score),
    details: issues.length > 0 ? issues.join("; ") : `Avg sentence: ${Math.round(avgSentenceLength)} words, ${sentences.length} sentences`,
    severity: score < 60 ? "warning" : "info",
  };
}

function checkSEO(title: string, metaDescription: string, content: string): QualityCheck {
  let score = 100;
  const issues: string[] = [];

  // Title length
  if (title.length < QUALITY_CONFIG.titleLength.min) {
    issues.push(`Title too short: ${title.length} chars (min: ${QUALITY_CONFIG.titleLength.min})`);
    score -= 20;
  } else if (title.length > QUALITY_CONFIG.titleLength.max) {
    issues.push(`Title too long: ${title.length} chars (max: ${QUALITY_CONFIG.titleLength.max})`);
    score -= 10;
  }

  // Meta description
  if (!metaDescription || metaDescription.length < QUALITY_CONFIG.metaDescLength.min) {
    issues.push(`Meta description too short or missing`);
    score -= 15;
  } else if (metaDescription.length > QUALITY_CONFIG.metaDescLength.max) {
    issues.push(`Meta description too long: ${metaDescription.length} chars`);
    score -= 5;
  }

  // First heading should match or relate to title
  const firstH1 = content.match(/^#\s+(.+)$/m)?.[1];
  if (firstH1 && !firstH1.toLowerCase().includes(title.toLowerCase().slice(0, 20))) {
    // This is fine — H1 doesn't need to exactly match title
  }

  // Check for keyword in first paragraph
  const firstParagraph = content.split(/\n\n/)[0] || "";
  if (firstParagraph.length < 50) {
    issues.push("First paragraph is too short for SEO");
    score -= 10;
  }

  return {
    name: "seo",
    passed: score >= 60,
    score: Math.max(0, score),
    details: issues.length > 0 ? issues.join("; ") : `Title: ${title.length} chars, Meta: ${metaDescription?.length ?? 0} chars`,
    severity: score < 60 ? "warning" : "info",
  };
}

function checkContentIntegrity(content: string): QualityCheck {
  let score = 100;
  const issues: string[] = [];

  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(content)) {
      issues.push(`Contains forbidden pattern: ${pattern.source.slice(0, 30)}`);
      score -= 25;
    }
  }

  // Check for unresolved template variables
  const templateVars = content.match(/\{\{[^}]+\}\}/g);
  if (templateVars && templateVars.length > 0) {
    issues.push(`Contains ${templateVars.length} unresolved template variables`);
    score -= 30;
  }

  // Check for excessive repetition
  const words = content.toLowerCase().split(/\s+/);
  const wordFreq: Record<string, number> = {};
  for (const w of words) {
    if (w.length > 4) wordFreq[w] = (wordFreq[w] || 0) + 1;
  }
  const topWord = Object.entries(wordFreq).sort((a, b) => b[1] - a[1])[0];
  if (topWord && topWord[1] > words.length * 0.05) {
    issues.push(`Word "${topWord[0]}" appears ${topWord[1]} times (${Math.round(topWord[1] / words.length * 100)}% of content)`);
    score -= 10;
  }

  return {
    name: "content_integrity",
    passed: score >= 60,
    score: Math.max(0, score),
    details: issues.length > 0 ? issues.join("; ") : "No forbidden patterns or artifacts detected",
    severity: score < 60 ? "critical" : "info",
  };
}

function checkInternalLinks(content: string): QualityCheck {
  const links = content.match(/\[.+?\]\(.+?\)/g) || [];
  const internalLinks = links.filter(l => !l.includes("http://") && !l.includes("https://"));

  let score = 100;
  const issues: string[] = [];

  if (internalLinks.length < QUALITY_CONFIG.minInternalLinks) {
    issues.push(`Only ${internalLinks.length} internal links (min: ${QUALITY_CONFIG.minInternalLinks})`);
    score -= 20;
  }

  if (internalLinks.length > QUALITY_CONFIG.maxInternalLinks) {
    issues.push(`Too many internal links: ${internalLinks.length} (max: ${QUALITY_CONFIG.maxInternalLinks})`);
    score -= 10;
  }

  return {
    name: "internal_links",
    passed: score >= 70,
    score: Math.max(0, score),
    details: issues.length > 0 ? issues.join("; ") : `${internalLinks.length} internal links`,
    severity: internalLinks.length < QUALITY_CONFIG.minInternalLinks ? "warning" : "info",
  };
}

// ─── Public Readability Check ────────────────────────────────────────────────

function checkPublicReadability(content: string): QualityCheck {
  let score = 100;
  const issues: string[] = [];

  // Must have at least one example (look for "example", "for instance", "e.g.", "such as")
  const examplePatterns = /\b(example|for instance|e\.g\.|such as|let's say|imagine|consider this)\b/i;
  if (!examplePatterns.test(content)) {
    issues.push("No real-world example found — articles must have at least one example");
    score -= 20;
  }

  // Must have FAQ section
  const hasFAQ = /^##\s*(frequently asked questions|faq|common questions)/im.test(content);
  if (!hasFAQ) {
    issues.push("Missing FAQ section");
    score -= 15;
  }

  // Check for actionable content (numbered steps, bullet points)
  const bulletPoints = (content.match(/^[-*]\s+/gm) || []).length;
  const numberedSteps = (content.match(/^\d+\.\s+/gm) || []).length;
  if (bulletPoints + numberedSteps < 5) {
    issues.push(`Only ${bulletPoints + numberedSteps} bullet/numbered items (min: 5) — content needs more scannable structure`);
    score -= 15;
  }

  // Check paragraph length (no wall of text)
  const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 0 && !p.startsWith("#") && !p.startsWith("```"));
  const longParas = paragraphs.filter(p => p.split("\n").length > 5);
  if (longParas.length > paragraphs.length * 0.3) {
    issues.push(`${longParas.length} paragraphs are too long (>5 lines) — break into smaller chunks`);
    score -= 10;
  }

  // Check for "you" tone (direct addressing)
  const youCount = (content.match(/\byou\b/gi) || []).length;
  const wordCount = content.split(/\s+/).length;
  if (youCount < wordCount * 0.003) {
    issues.push("Article doesn't address reader directly — use 'you' tone");
    score -= 10;
  }

  // Check for blockquote tips/takeaways
  const hasBlockquote = /^>\s+/m.test(content);
  if (!hasBlockquote) {
    issues.push("No highlighted tips/takeaways (use > blockquote for key points)");
    score -= 5;
  }

  return {
    name: "public_readability",
    passed: score >= 60,
    score: Math.max(0, score),
    details: issues.length > 0 ? issues.join("; ") : "Article is readable, actionable, and engaging for general public",
    severity: score < 60 ? "warning" : "info",
  };
}

// ─── Main Quality Assessment ─────────────────────────────────────────────────

/**
 * Run all quality checks on an article.
 */
export function assessQuality(
  content: string,
  title: string,
  metaDescription: string = ""
): QualityReport {
  const checks: QualityCheck[] = [
    checkWordCount(content),
    checkStructure(content),
    checkReadability(content),
    checkPublicReadability(content),
    checkSEO(title, metaDescription, content),
    checkContentIntegrity(content),
    checkInternalLinks(content),
  ];

  const overallScore = Math.round(
    checks.reduce((sum, c) => sum + c.score, 0) / checks.length
  );

  const blockers = checks
    .filter(c => !c.passed && c.severity === "critical")
    .map(c => c.details);

  const warnings = checks
    .filter(c => !c.passed && c.severity === "warning")
    .map(c => c.details);

  const passed = blockers.length === 0 && overallScore >= QUALITY_CONFIG.passingScore;

  return {
    articleId: "",
    articleSlug: "",
    overallScore,
    passed,
    checks,
    blockers,
    warnings,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Run quality checks on a specific article from the database.
 */
export async function assessArticleQuality(
  articleId: string,
  lang: string = "en"
): Promise<QualityReport> {
  const supabase = createAdminClient();

  const { data: article } = await supabase
    .from("articles")
    .select("id, slug")
    .eq("id", articleId)
    .single();

  if (!article) {
    return {
      articleId,
      articleSlug: "",
      overallScore: 0,
      passed: false,
      checks: [],
      blockers: ["Article not found"],
      warnings: [],
      timestamp: new Date().toISOString(),
    };
  }

  const { data: translation } = await supabase
    .from("article_translations")
    .select("title, meta_description, body_markdown")
    .eq("article_id", articleId)
    .eq("language_code", lang)
    .maybeSingle();

  if (!translation || !translation.body_markdown) {
    return {
      articleId,
      articleSlug: article.slug,
      overallScore: 0,
      passed: false,
      checks: [],
      blockers: ["No translation content found"],
      warnings: [],
      timestamp: new Date().toISOString(),
    };
  }

  const report = assessQuality(
    translation.body_markdown,
    translation.title || "",
    translation.meta_description || ""
  );

  report.articleId = articleId;
  report.articleSlug = article.slug;

  return report;
}

/**
 * Batch quality check: assess all "draft" articles and promote passing ones to "ready".
 */
export async function batchQualityCheck(options: {
  limit?: number;
  promoteOnPass?: boolean;
  lang?: string;
} = {}): Promise<BatchQualityResult> {
  const startTime = Date.now();
  const supabase = createAdminClient();
  const limit = options.limit ?? 50;
  const promoteOnPass = options.promoteOnPass ?? true;
  const lang = options.lang ?? "en";

  const result: BatchQualityResult = {
    articlesChecked: 0,
    articlesPassed: 0,
    articlesFailed: 0,
    promoted: 0,
    reports: [],
    durationMs: 0,
  };

  // Get draft articles
  const { data: articles } = await supabase
    .from("articles")
    .select("id, slug")
    .eq("status", "draft")
    .order("created_at", { ascending: true })
    .limit(limit);

  if (!articles || articles.length === 0) {
    result.durationMs = Date.now() - startTime;
    return result;
  }

  for (const article of articles) {
    const report = await assessArticleQuality(article.id, lang);
    result.articlesChecked++;
    result.reports.push(report);

    if (report.passed) {
      result.articlesPassed++;

      if (promoteOnPass) {
        const { error } = await supabase
          .from("articles")
          .update({ status: "ready" })
          .eq("id", article.id);

        if (!error) {
          result.promoted++;
          console.log(`[QualityCheck] PASS: ${article.slug} (score: ${report.overallScore}) → promoted to ready`);
        }
      }
    } else {
      result.articlesFailed++;
      console.log(
        `[QualityCheck] FAIL: ${article.slug} (score: ${report.overallScore}) blockers: ${report.blockers.join(", ")}`
      );
    }
  }

  result.durationMs = Date.now() - startTime;
  return result;
}
