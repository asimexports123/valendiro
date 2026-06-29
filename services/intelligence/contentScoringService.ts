import { createAdminClient } from "@/lib/supabase/admin";
import {
  ContentScore,
  KnowledgeObjectType,
  SupportedLanguage,
} from "@/lib/types";

export interface ScoreInput {
  objectId: string;
  objectType: KnowledgeObjectType;
  languageCode: SupportedLanguage;
  searchVolumeScore?: number;
  competitionScore?: number;
  affiliatePotentialScore?: number;
  ctrEstimateScore?: number;
  freshnessScore?: number;
  metadata?: Record<string, unknown>;
}

function calculateOverallPriority(input: Omit<ScoreInput, "objectId" | "objectType" | "languageCode" | "metadata">): number {
  const scores = {
    searchVolume: input.searchVolumeScore ?? 0,
    competition: input.competitionScore ?? 0,
    affiliatePotential: input.affiliatePotentialScore ?? 0,
    ctrEstimate: input.ctrEstimateScore ?? 0,
    freshness: input.freshnessScore ?? 0,
  };

  const weights = {
    searchVolume: 0.30,
    competition: 0.15,
    affiliatePotential: 0.25,
    ctrEstimate: 0.15,
    freshness: 0.15,
  };

  const weightedSum =
    scores.searchVolume * weights.searchVolume +
    scores.competition * weights.competition +
    scores.affiliatePotential * weights.affiliatePotential +
    scores.ctrEstimate * weights.ctrEstimate +
    scores.freshness * weights.freshness;

  return Math.min(100, Math.max(0, parseFloat(weightedSum.toFixed(2))));
}

export async function calculateAndSaveScore(input: ScoreInput) {
  const supabase = createAdminClient();

  const overallPriority = calculateOverallPriority({
    searchVolumeScore: input.searchVolumeScore,
    competitionScore: input.competitionScore,
    affiliatePotentialScore: input.affiliatePotentialScore,
    ctrEstimateScore: input.ctrEstimateScore,
    freshnessScore: input.freshnessScore,
  });

  const payload = {
    object_id: input.objectId,
    object_type: input.objectType,
    language_code: input.languageCode,
    search_volume_score: input.searchVolumeScore ?? 0,
    competition_score: input.competitionScore ?? 0,
    affiliate_potential_score: input.affiliatePotentialScore ?? 0,
    ctr_estimate_score: input.ctrEstimateScore ?? 0,
    freshness_score: input.freshnessScore ?? 0,
    overall_priority_score: overallPriority,
    score_metadata: input.metadata ?? {},
    calculated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("content_scores")
    .upsert(payload, { onConflict: "object_id,object_type,language_code" })
    .select()
    .single<ContentScore>();

  return { data, error: error?.message ?? null, overallPriority };
}

export async function getScoreForObject(
  objectId: string,
  objectType: KnowledgeObjectType,
  languageCode: SupportedLanguage
) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("content_scores")
    .select("*")
    .eq("object_id", objectId)
    .eq("object_type", objectType)
    .eq("language_code", languageCode)
    .single<ContentScore>();

  return { data: data as ContentScore | null, error: error?.message ?? null };
}

export async function getTopPriorityObjects(
  objectType?: KnowledgeObjectType,
  languageCode?: SupportedLanguage,
  limit = 20
) {
  const supabase = createAdminClient();
  let query = supabase
    .from("content_scores")
    .select("*")
    .order("overall_priority_score", { ascending: false })
    .limit(limit);

  if (objectType) query = query.eq("object_type", objectType);
  if (languageCode) query = query.eq("language_code", languageCode);

  const { data, error } = await query;
  return { data: (data || []) as ContentScore[], error: error?.message ?? null };
}

export async function deleteScore(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("content_scores").delete().eq("id", id);
  return { error: error?.message ?? null };
}
