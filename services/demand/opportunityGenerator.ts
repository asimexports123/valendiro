import { createClient } from "@/lib/supabase/server";
import {
  DemandSignal,
  KnowledgeObjectType,
  SupportedLanguage,
} from "@/lib/types";
import { calculateBoostedPriorityScore } from "./priorityBoosting";
import { enqueueContentGeneration } from "@/services/intelligence/contentDecisionEngine";

export interface GeneratedOpportunity {
  title: string;
  objectType: KnowledgeObjectType;
  priorityScore: number;
  reason: string;
  sourceSignalId: string;
}

export interface OpportunityGenerationResult {
  generated: number;
  opportunities: GeneratedOpportunity[];
  error: string | null;
}

export async function generateOpportunitiesFromDemandSignals(
  languageCode: SupportedLanguage = "en",
  limit = 20
): Promise<OpportunityGenerationResult> {
  const supabase = await createClient();

  const { data: signals, error } = await supabase
    .from("demand_signals")
    .select("*")
    .eq("language_code", languageCode)
    .order("volume_score", { ascending: false })
    .limit(limit);

  if (error || !signals) {
    return { generated: 0, opportunities: [], error: error?.message ?? null };
  }

  const opportunities: GeneratedOpportunity[] = [];
  for (const signal of signals as DemandSignal[]) {
    const boostedScore = calculateBoostedPriorityScore(signal, 50);
    const title = signal.keyword || `Content opportunity from ${signal.source}`;
    const objectType: KnowledgeObjectType = signal.object_type || "article";

    const opportunity: GeneratedOpportunity = {
      title,
      objectType,
      priorityScore: boostedScore,
      reason: `High demand signal: ${signal.signal_type} from ${signal.source} (volume=${signal.volume_score}, affiliate=${signal.affiliate_potential_score})`,
      sourceSignalId: signal.id,
    };

    opportunities.push(opportunity);
  }

  return { generated: opportunities.length, opportunities, error: null };
}

export async function generateOpportunitiesFromTopicGaps(
  languageCode: SupportedLanguage = "en",
  limit = 20
): Promise<OpportunityGenerationResult> {
  const supabase = await createClient();

  const { data: gaps, error } = await supabase
    .from("topic_gap_scores")
    .select("topic_id, opportunity_score, coverage_score, intent_score, topics(slug)")
    .eq("language_code", languageCode)
    .gt("opportunity_score", 60)
    .order("opportunity_score", { ascending: false })
    .limit(limit);

  if (error || !gaps) {
    return { generated: 0, opportunities: [], error: error?.message ?? null };
  }

  const opportunities: GeneratedOpportunity[] = [];
  for (const gap of gaps) {
    const topics = gap.topics as { slug: string }[] | null;
    const topicSlug = topics?.[0]?.slug;
    const title = topicSlug ? `Complete guide to ${topicSlug}` : "Topic coverage opportunity";

    opportunities.push({
      title,
      objectType: "article",
      priorityScore: Number(gap.opportunity_score),
      reason: `Topic gap: coverage=${gap.coverage_score}, intent=${gap.intent_score}, opportunity=${gap.opportunity_score}`,
      sourceSignalId: gap.topic_id as string,
    });
  }

  return { generated: opportunities.length, opportunities, error: null };
}

export async function pushOpportunitiesToQueue(
  opportunities: GeneratedOpportunity[],
  languageCode: SupportedLanguage = "en"
): Promise<{ queued: number; errors: string[] }> {
  const errors: string[] = [];
  let queued = 0;

  for (const opp of opportunities) {
    const result = await enqueueContentGeneration(
      opp.objectType,
      opp.title,
      opp.reason,
      opp.priorityScore,
      undefined,
      { source_signal_id: opp.sourceSignalId, language_code: languageCode }
    );

    if (result.error) {
      errors.push(result.error);
    } else {
      queued++;
    }
  }

  return { queued, errors };
}
