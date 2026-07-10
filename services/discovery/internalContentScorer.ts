/**
 * Internal content scorer — pre-publish quality gate (no LLM).
 *
 * Combines originality, helpful-content rules, readability, structure, and SEO basics.
 */

import { countWords } from "@/services/knowledge/contentQualityGate";
import { evaluateOriginality } from "./originalityGate";
import { auditParagraphQuality } from "./paragraphQualityGate";

export interface CategoryScore {
  score: number;
  pass: boolean;
  details: string;
}

export interface InternalContentScore {
  overallScore: number;
  passed: boolean;
  categories: {
    originality: CategoryScore;
    understanding: CategoryScore;
    helpfulContent: CategoryScore;
    readability: CategoryScore;
    structure: CategoryScore;
    seoBasics: CategoryScore;
  };
  failures: string[];
  criticalFail: boolean;
}

const PASS_THRESHOLD = 70;

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(n)));
}

function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (w.length <= 3) return 1;
  const vowels = w.match(/[aeiouy]+/g);
  let count = vowels ? vowels.length : 1;
  if (w.endsWith("e") && count > 1) count--;
  return Math.max(1, count);
}

function scoreReadability(content: string): CategoryScore {
  const sentences = content
    .replace(/^#+\s+/gm, "")
    .split(/[.!?]+\s+/)
    .map((s) => s.trim())
    .filter((s) => s.split(/\s+/).length >= 4);

  if (sentences.length < 3) {
    return { score: 30, pass: false, details: "too few sentences" };
  }

  const lengths = sentences.map((s) => s.split(/\s+/).filter(Boolean).length);
  const avgLen = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance =
    lengths.reduce((sum, l) => sum + (l - avgLen) ** 2, 0) / lengths.length;
  const stdDev = Math.sqrt(variance);

  const words = content.split(/\s+/).filter(Boolean);
  const syllables = words.reduce((s, w) => s + countSyllables(w), 0);
  const flesch = 206.835 - 1.015 * (words.length / sentences.length) - 84.6 * (syllables / words.length);

  let score = 50;
  if (avgLen >= 12 && avgLen <= 25) score += 20;
  else if (avgLen >= 8 && avgLen <= 32) score += 10;
  else score -= 10;

  if (stdDev >= 4 && stdDev <= 14) score += 15;
  else if (stdDev >= 2) score += 5;

  if (flesch >= 50 && flesch <= 75) score += 15;
  else if (flesch >= 35 && flesch <= 85) score += 8;
  else score -= 5;

  return {
    score: clamp(score),
    pass: score >= 55,
    details: `avg ${avgLen.toFixed(1)} words/sentence, flesch ${flesch.toFixed(0)}`,
  };
}

function scoreHelpfulContent(content: string): CategoryScore {
  const h2Count = (content.match(/^## /gm) ?? []).length;
  const h3Count = (content.match(/^### /gm) ?? []).length;
  const sections = content.split(/^## /m).slice(1);
  const sectionWords = sections.map((s) => countWords(s));
  const avgSectionWords =
    sectionWords.length > 0
      ? sectionWords.reduce((a, b) => a + b, 0) / sectionWords.length
      : 0;

  const listOnly = sections.filter((s) => {
    const lines = s.split("\n").filter((l) => l.trim().length > 0);
    const listLines = lines.filter((l) => /^[-*]\s/.test(l.trim()));
    return lines.length > 2 && listLines.length / lines.length > 0.7;
  }).length;

  const summarizeOnly =
    /^(in summary|to summarize|this article|this guide|overview)/im.test(content.slice(0, 400)) &&
    h2Count < 3;

  let score = 40;
  if (h2Count >= 4) score += 25;
  else if (h2Count >= 3) score += 15;
  if (h3Count >= 2) score += 10;
  if (avgSectionWords >= 80) score += 20;
  else if (avgSectionWords >= 50) score += 10;
  if (listOnly > 1) score -= 15;
  if (summarizeOnly) score -= 20;

  const pass = h2Count >= 3 && avgSectionWords >= 60 && !summarizeOnly;
  return {
    score: clamp(score),
    pass,
    details: `${h2Count} H2 sections, avg ${Math.round(avgSectionWords)} words/section`,
  };
}

function scoreStructure(content: string, minWords: number): CategoryScore {
  const words = countWords(content);
  const h2Count = (content.match(/^## /gm) ?? []).length;
  const intro = content.replace(/^#\s[^\n]+\n?/m, "").trim().slice(0, 300);
  const hasIntro = intro.length > 80 && !intro.startsWith("##");

  let score = 30;
  if (words >= minWords) score += 25;
  else score += Math.round((words / minWords) * 20);
  if (h2Count >= 5) score += 25;
  else if (h2Count >= 4) score += 18;
  else if (h2Count >= 3) score += 10;
  if (hasIntro) score += 15;

  const pass = words >= minWords * 0.85 && h2Count >= 4 && hasIntro;
  return {
    score: clamp(score),
    pass,
    details: `${words} words, ${h2Count} H2, intro=${hasIntro}`,
  };
}

function scoreUnderstanding(content: string): CategoryScore {
  let body = content.replace(/^#.+$/m, "").trim();
  const nextStepsIdx = body.search(/\n##\s+(?:Next Steps|What to do next)/i);
  if (nextStepsIdx >= 0) body = body.slice(0, nextStepsIdx);
  // Opening Composer already gated sentence 1–3 — skip first body paragraph
  const paragraphs = body
    .split(/\n{2,}/)
    .map((p) => p.replace(/^##\s+.+$/m, "").trim())
    .filter((p) => p.length > 30)
    .slice(1);

  if (paragraphs.length === 0) {
    return { score: 20, pass: false, details: "no body paragraphs" };
  }

  let passCount = 0;
  const allFailures: string[] = [];
  for (const para of paragraphs) {
    const audit = auditParagraphQuality(para);
    if (audit.pass) passCount++;
    else allFailures.push(...audit.failures);
  }

  const ratio = passCount / paragraphs.length;
  const score = clamp(ratio * 100);
  // Dense editorial: allow one weak body paragraph (≈93%+) without critical fail
  const pass = ratio >= 0.9;

  return {
    score,
    pass,
    details: `${passCount}/${paragraphs.length} paragraphs pass quality gate`,
  };
}

function scoreSeoBasics(content: string, title: string, isSeed: boolean): CategoryScore {
  const words = countWords(content);
  const minWords = isSeed ? 320 : 300;
  const titleLower = title.toLowerCase();
  const titleWords = titleLower.split(/\W+/).filter((w) => w.length > 3);
  const contentLower = content.toLowerCase().slice(0, 2000);
  const titleInContent =
    contentLower.includes(titleLower) ||
    titleWords.filter((w) => contentLower.includes(w)).length >= Math.ceil(titleWords.length * 0.6);

  let score = 40;
  if (titleInContent) score += 30;
  if (words >= minWords) score += 30;
  else score += Math.round((words / minWords) * 25);

  const pass = titleInContent && words >= minWords * 0.9;
  return {
    score: clamp(score),
    pass,
    details: `title match=${titleInContent}, ${words}/${minWords} words`,
  };
}

/** Score rendered content before publish. Originality failure is critical. */
export function scoreInternalContent(input: {
  content: string;
  sourceTexts: string[];
  title?: string;
  topicTitle?: string;
  isSeed?: boolean;
  wordsBefore?: number;
  ignoreRegression?: boolean;
}): InternalContentScore & { wordCount: number } {
  const title = input.title ?? input.topicTitle ?? "";
  const { content, sourceTexts, isSeed = false } = input;
  const minWords = isSeed ? 320 : 300;
  const wordCount = countWords(content);
  const failures: string[] = [];

  const originalityResult = evaluateOriginality(content, sourceTexts);
  const originalityScore = originalityResult.pass
    ? clamp(100 - originalityResult.maxOverlap * 200)
    : clamp(40 - originalityResult.maxOverlap * 100);
  const originality: CategoryScore = {
    score: originalityScore,
    pass: originalityResult.pass,
    details: originalityResult.reason,
  };
  if (!originality.pass) failures.push(`originality: ${originalityResult.reason}`);

  const understanding = scoreUnderstanding(content);
  if (!understanding.pass) failures.push(`understanding: ${understanding.details}`);

  const helpfulContent = scoreHelpfulContent(content);
  if (!helpfulContent.pass) failures.push(`helpful content: ${helpfulContent.details}`);

  const readability = scoreReadability(content);
  if (!readability.pass) failures.push(`readability: ${readability.details}`);

  const structure = scoreStructure(content, minWords);
  if (!structure.pass) failures.push(`structure: ${structure.details}`);

  const seoBasics = scoreSeoBasics(content, title, isSeed);
  if (!seoBasics.pass) failures.push(`seo: ${seoBasics.details}`);

  if (wordCount < minWords * 0.85) {
    failures.push(`word count ${wordCount} below ${Math.round(minWords * 0.85)}`);
  }

  if (
    input.wordsBefore != null &&
    input.wordsBefore >= minWords &&
    !input.ignoreRegression &&
    wordCount < input.wordsBefore * 0.85
  ) {
    failures.push(`regression: ${input.wordsBefore} → ${wordCount} words`);
  }

  const overallScore = clamp(
    originality.score * 0.2 +
      understanding.score * 0.2 +
      helpfulContent.score * 0.15 +
      readability.score * 0.15 +
      structure.score * 0.15 +
      seoBasics.score * 0.15
  );

  const criticalFail = !originality.pass || !understanding.pass;
  const passed = !criticalFail && overallScore >= PASS_THRESHOLD && wordCount >= minWords * 0.85;

  if (!passed && !criticalFail && overallScore < PASS_THRESHOLD) {
    failures.push(`overall score ${overallScore} below ${PASS_THRESHOLD}`);
  }

  return {
    overallScore,
    passed,
    categories: { originality, understanding, helpfulContent, readability, structure, seoBasics },
    failures,
    criticalFail,
    wordCount,
  };
}
