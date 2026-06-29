import { createAdminClient } from "@/lib/supabase/admin";
import { checkDuplicateContentBeforePublish, DuplicateCheckInput } from "./duplicateContentDetector";

export interface QualityGateResult {
  passed: boolean;
  checks: {
    duplicate: { passed: boolean; reason: string | null };
    readability: { passed: boolean; score: number; reason: string | null };
    internalSimilarity: { passed: boolean; score: number; reason: string | null };
  };
}

function normalizeText(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3);
}

function jaccardSimilarity(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setA = new Set(a);
  const setB = new Set(b);
  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return intersection.size / union.size;
}

function checkReadability(content: string): { passed: boolean; score: number; reason: string | null } {
  const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const words = content.split(/\s+/).filter((w) => w.length > 0);
  if (words.length === 0) return { passed: false, score: 0, reason: "No readable content found" };

  const avgSentenceLength = words.length / Math.max(1, sentences.length);
  const longWords = words.filter((w) => w.length > 6).length;
  const syllableEstimate = Math.max(1, words.length + longWords);
  const score = Math.max(0, 206.835 - 1.015 * avgSentenceLength - 84.6 * (syllableEstimate / words.length));

  if (score < 30) return { passed: false, score, reason: `Readability score ${Math.round(score)} is too low (very difficult)` };
  if (score > 90) return { passed: false, score, reason: `Readability score ${Math.round(score)} is too high (overly simple)` };
  return { passed: true, score, reason: null };
}

async function checkInternalSimilarity(content: string, topicId: string | null): Promise<{ passed: boolean; score: number; reason: string | null }> {
  const supabase = createAdminClient();
  const words = normalizeText(content);
  if (words.length === 0) return { passed: true, score: 0, reason: null };

  let query = supabase
    .from("articles")
    .select("id, topic_id, article_translations(content)")
    .eq("status", "published")
    .eq("article_translations.language_code", "en");

  if (topicId) {
    query = query.eq("topic_id", topicId);
  }

  const { data } = await query.limit(50);
  let bestScore = 0;
  for (const article of data || []) {
    const candidate = article.article_translations?.[0]?.content as string | undefined;
    if (!candidate) continue;
    const candidateWords = normalizeText(candidate);
    const similarity = jaccardSimilarity(words, candidateWords);
    if (similarity > bestScore) bestScore = similarity;
  }

  if (bestScore >= 0.65) {
    return { passed: false, score: bestScore, reason: `Internal similarity ${Math.round(bestScore * 100)}% exceeds 65% threshold` };
  }
  return { passed: true, score: bestScore, reason: null };
}

export async function runQualityGate(input: DuplicateCheckInput): Promise<QualityGateResult> {
  const duplicate = await checkDuplicateContentBeforePublish(input);
  const readability = checkReadability(input.content);
  const internalSimilarity = await checkInternalSimilarity(input.content, input.topicId ?? null);

  const passed = !duplicate.isDuplicate && readability.passed && internalSimilarity.passed;

  return {
    passed,
    checks: {
      duplicate: { passed: !duplicate.isDuplicate, reason: duplicate.isDuplicate ? duplicate.reason : null },
      readability,
      internalSimilarity,
    },
  };
}
