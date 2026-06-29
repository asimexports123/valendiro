import { createAdminClient } from "@/lib/supabase/admin";
import { TopicGapScore, SupportedLanguage } from "@/lib/types";

export interface GapDetectionResult {
  calculated: number;
  highOpportunities: { topic_id: string; opportunity_score: number; gap_score: number; coverage_score: number }[];
  error: string | null;
}

export async function runTopicGapDetection(languageCode: SupportedLanguage = "en"): Promise<GapDetectionResult> {
  const supabase = createAdminClient();

  const { error: calcError } = await supabase.rpc("calculate_topic_gap_scores", {
    language_code: languageCode,
  });

  if (calcError) {
    return { calculated: 0, highOpportunities: [], error: calcError.message };
  }

  const { data: highOpps, error: fetchError } = await supabase.rpc("find_high_opportunity_topics", {
    language_code: languageCode,
    limit_count: 20,
  });

  if (fetchError) {
    return { calculated: 0, highOpportunities: [], error: fetchError.message };
  }

  const highOpportunities = (highOpps || []).map((row: Record<string, unknown>) => ({
    topic_id: row.topic_id as string,
    opportunity_score: Number(row.opportunity_score),
    gap_score: Number(row.gap_score),
    coverage_score: Number(row.coverage_score),
  }));

  const { data: allScores, error: countError } = await supabase
    .from("topic_gap_scores")
    .select("id", { count: "exact" })
    .eq("language_code", languageCode);

  return {
    calculated: allScores?.length ?? 0,
    highOpportunities,
    error: countError?.message ?? null,
  };
}

export async function getTopicGapScores(
  languageCode: SupportedLanguage = "en",
  minOpportunity = 0,
  limit = 50
) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("topic_gap_scores")
    .select("*")
    .eq("language_code", languageCode)
    .gte("opportunity_score", minOpportunity)
    .order("opportunity_score", { ascending: false })
    .limit(limit);

  return { data: (data || []) as TopicGapScore[], error: error?.message ?? null };
}

export async function findHighIntentUnansweredQuestions(languageCode: SupportedLanguage = "en", limit = 20) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("find_high_intent_unanswered_questions", {
    language_code: languageCode,
    limit_count: limit,
  });

  return {
    data: (data || []) as { question_id: string; intent_type: string; topic_id: string }[],
    error: error?.message ?? null,
  };
}

export async function findUnderdevelopedClusters(limit = 20) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("find_underdeveloped_clusters", {
    limit_count: limit,
  });

  return {
    data: (data || []) as { topic_id: string; relationship_count: number }[],
    error: error?.message ?? null,
  };
}
