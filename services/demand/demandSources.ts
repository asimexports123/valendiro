import { createAdminClient } from "@/lib/supabase/admin";
import { DemandSignal, DemandSignalType, IntentType, KnowledgeObjectType, SupportedLanguage } from "@/lib/types";
import { isPublishable, scoreDemandKeyword } from "./topicQualityEngine";

export interface ExternalTrendInput {
  keyword: string;
  volumeScore: number;
  trendScore: number;
  seasonalScore: number;
  affiliatePotentialScore: number;
  competitionScore: number;
  source: string;
  signalType: DemandSignalType;
  languageCode?: SupportedLanguage;
}

export interface DemandSourceResult {
  inserted: number;
  error: string | null;
}

/**
 * Simulate internal search intent demand by analyzing the questions table.
 * Commercial/transactional questions get higher volume scores.
 */
export async function captureInternalSearchIntentDemand(languageCode: SupportedLanguage = "en"): Promise<DemandSourceResult> {
  const supabase = createAdminClient();

  const { data: questions, error } = await supabase
    .from("questions")
    .select("id, intent_type, question_translations(question_text), question_topics(topic_id)")
    .eq("question_translations.language_code", languageCode)
    .not("intent_type", "is", null);

  if (error || !questions) {
    return { inserted: 0, error: error?.message ?? null };
  }

  let inserted = 0;
  for (const question of questions) {
    const intent = question.intent_type as IntentType | null;
    const volume = intent === "transactional" ? 90 : intent === "commercial" ? 80 : intent === "navigational" ? 60 : 50;
    const affiliate = intent === "commercial" || intent === "transactional" ? 85 : 30;
    const competition = intent === "informational" ? 70 : 60;
    const translations = (question.question_translations as { question_text: string }[]) || [];
    const text = translations[0]?.question_text ?? "";
    const topics = (question.question_topics as { topic_id: string }[]) || [];

    const { error: insertError } = await supabase.from("demand_signals").insert({
      signal_type: "search_intent",
      source: "internal_question_analysis",
      keyword: text.slice(0, 200),
      object_id: question.id,
      object_type: "question" as KnowledgeObjectType,
      language_code: languageCode,
      volume_score: volume,
      trend_score: 50,
      seasonal_score: 50,
      affiliate_potential_score: affiliate,
      competition_score: competition,
      metadata: { topic_ids: topics.map((t) => t.topic_id) },
    });

    if (!insertError) inserted++;
  }

  return { inserted, error: null };
}

/**
 * Capture an external trend input. This is the hook for future Google Trends,
 * Search Console, affiliate APIs, etc.
 */
export async function captureExternalTrend(input: ExternalTrendInput): Promise<DemandSourceResult> {
  const supabase = createAdminClient();

  const { error } = await supabase.from("demand_signals").insert({
    signal_type: input.signalType,
    source: input.source,
    keyword: input.keyword,
    language_code: input.languageCode ?? "en",
    volume_score: input.volumeScore,
    trend_score: input.trendScore,
    seasonal_score: input.seasonalScore,
    affiliate_potential_score: input.affiliatePotentialScore,
    competition_score: input.competitionScore,
  });

  return { inserted: error ? 0 : 1, error: error?.message ?? null };
}

/**
 * Apply hardcoded seasonal trends. Replace with real data source later.
 */
export async function captureSeasonalTrends(languageCode: SupportedLanguage = "en"): Promise<DemandSourceResult> {
  // V1 category-aligned seasonal seeds only
  const seasonalKeywords = [
    // Personal Finance
    { keyword: "tax filing guide", month: 3, score: 85 },
    { keyword: "tax deduction tips", month: 2, score: 80 },
    { keyword: "year end financial review", month: 12, score: 75 },
    { keyword: "new year budget planning", month: 1, score: 90 },
    // Education
    { keyword: "back to school study tips", month: 8, score: 85 },
    { keyword: "how to prepare for exams", month: 5, score: 80 },
    { keyword: "online learning guide", month: 9, score: 75 },
    // Health & Wellness
    { keyword: "summer fitness guide", month: 6, score: 80 },
    { keyword: "winter immune system tips", month: 11, score: 75 },
    { keyword: "new year workout routine", month: 1, score: 85 },
    // Home & Lifestyle
    { keyword: "spring home cleaning tips", month: 3, score: 80 },
    { keyword: "holiday meal prep guide", month: 12, score: 85 },
    // Travel
    { keyword: "summer travel tips", month: 5, score: 85 },
    { keyword: "budget travel guide", month: 6, score: 80 },
  ];

  const supabase = createAdminClient();
  const currentMonth = new Date().getMonth() + 1;
  let inserted = 0;

  for (const item of seasonalKeywords) {
    const quality = scoreDemandKeyword(item.keyword);
    if (!isPublishable(quality)) continue;

    const distance = Math.abs(currentMonth - item.month);
    const relevance = distance <= 1 ? item.score : Math.max(0, item.score - distance * 15);
    if (relevance <= 0) continue;

    const { error } = await supabase.from("demand_signals").insert({
      signal_type: "seasonal",
      source: "seasonal_calendar",
      keyword: quality.knowledgeTopic || quality.normalizedKeyword,
      language_code: languageCode,
      volume_score: relevance,
      trend_score: relevance,
      seasonal_score: relevance,
      affiliate_potential_score: 40,
      competition_score: 60,
      search_intent: quality.intent,
      metadata: { target_month: item.month, quality: quality },
    });

    if (!error) inserted++;
  }

  return { inserted, error: null };
}

export async function getDemandSignals(
  signalType?: DemandSignalType,
  languageCode: SupportedLanguage = "en",
  limit = 100
) {
  const supabase = createAdminClient();
  let query = supabase
    .from("demand_signals")
    .select("*")
    .eq("language_code", languageCode)
    .order("volume_score", { ascending: false })
    .limit(limit);

  if (signalType) query = query.eq("signal_type", signalType);

  const { data, error } = await query;
  return { data: (data || []) as DemandSignal[], error: error?.message ?? null };
}
