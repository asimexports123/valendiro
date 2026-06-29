import { createClient } from "@/lib/supabase/server";
import { KnowledgeObjectType, SupportedLanguage } from "@/lib/types";

export interface DuplicateCheckInput {
  objectId: string | null;
  objectType: KnowledgeObjectType;
  languageCode: SupportedLanguage;
  content: string;
  topicId?: string | null;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  reason: string | null;
  similarityScore: number;
  matchedObjectId: string | null;
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function generateHash(text: string): string {
  const normalized = normalizeText(text);
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

function calculateJaccardSimilarity(a: string, b: string): number {
  const setA = new Set(normalizeText(a).split(" ").filter((w) => w.length > 3));
  const setB = new Set(normalizeText(b).split(" ").filter((w) => w.length > 3));
  if (setA.size === 0 || setB.size === 0) return 0;
  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return intersection.size / union.size;
}

export async function checkDuplicateContentBeforePublish(input: DuplicateCheckInput): Promise<DuplicateCheckResult> {
  const supabase = await createClient();
  const contentHash = generateHash(input.content);

  // 1. Hash-based exact duplicate check
  const { data: hashMatches } = await supabase
    .from("duplicate_content_detections")
    .select("source_object_id, target_object_id")
    .eq("content_hash", contentHash)
    .neq("status", "ignored")
    .limit(1);

  if (hashMatches && hashMatches.length > 0) {
    return {
      isDuplicate: true,
      reason: "Exact hash match found in duplicate detection table",
      similarityScore: 1,
      matchedObjectId: hashMatches[0].source_object_id,
    };
  }

  // 2. Semantic similarity check against published content
  const { data: candidates } = await supabase.rpc("get_content_for_duplicate_check", {
    p_object_id: input.objectId,
    p_object_type: input.objectType,
    p_language_code: input.languageCode,
    p_topic_id: input.topicId ?? null,
  });

  let bestMatch: { id: string; similarity: number } | null = null;
  for (const candidate of candidates || []) {
    const candidateId = candidate.id as string;
    const candidateContent = candidate.content as string;
    if (input.objectId && candidateId === input.objectId) continue;

    const similarity = calculateJaccardSimilarity(input.content, candidateContent);
    if (similarity >= 0.75 && (!bestMatch || similarity > bestMatch.similarity)) {
      bestMatch = { id: candidateId, similarity };
    }
  }

  if (bestMatch) {
    // Record duplicate detection
    await supabase.from("duplicate_content_detections").insert({
      source_object_id: input.objectId || bestMatch.id,
      source_object_type: input.objectType,
      target_object_id: bestMatch.id,
      target_object_type: input.objectType,
      language_code: input.languageCode,
      content_hash: contentHash,
      similarity_score: bestMatch.similarity,
      status: "pending",
    });

    return {
      isDuplicate: true,
      reason: `Semantic similarity ${Math.round(bestMatch.similarity * 100)}% exceeds 75% threshold`,
      similarityScore: bestMatch.similarity,
      matchedObjectId: bestMatch.id,
    };
  }

  return { isDuplicate: false, reason: null, similarityScore: 0, matchedObjectId: null };
}

export async function runDuplicateContentScan(limit = 50): Promise<{ scanned: number; duplicates: number; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_content_for_duplicate_check", {
    p_object_id: null,
    p_object_type: "article",
    p_language_code: "en",
    p_topic_id: null,
  });

  if (error) return { scanned: 0, duplicates: 0, error: error.message };
  const items = data || [];

  let duplicates = 0;
  for (let i = 0; i < Math.min(items.length, limit); i++) {
    const item = items[i];
    const check = await checkDuplicateContentBeforePublish({
      objectId: item.id as string,
      objectType: item.object_type as KnowledgeObjectType,
      languageCode: item.language_code as SupportedLanguage,
      content: item.content as string,
      topicId: item.topic_id as string | null | undefined,
    });
    if (check.isDuplicate) duplicates++;
  }

  return { scanned: Math.min(items.length, limit), duplicates, error: null };
}
