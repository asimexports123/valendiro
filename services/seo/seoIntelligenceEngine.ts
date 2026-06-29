import { createAdminClient } from "@/lib/supabase/admin";
import { InternalLinkSuggestion, KnowledgeObjectType, SeoKeywordGap, SupportedLanguage } from "@/lib/types";

export interface SeoIntelligenceResult {
  keywordGaps: number;
  linkSuggestions: number;
  weakClusters: number;
  errors: string[];
}

export async function runSeoIntelligenceEngine(limit = 50): Promise<SeoIntelligenceResult> {
  const result: SeoIntelligenceResult = { keywordGaps: 0, linkSuggestions: 0, weakClusters: 0, errors: [] };

  const gaps = await identifyKeywordGaps(limit);
  result.keywordGaps = gaps.created;
  if (gaps.error) result.errors.push(gaps.error);

  const links = await suggestInternalLinks(limit);
  result.linkSuggestions = links.created;
  if (links.error) result.errors.push(links.error);

  const clusters = await identifyWeakClusters(limit);
  result.weakClusters = clusters.count;
  if (clusters.error) result.errors.push(clusters.error);

  return result;
}

async function identifyKeywordGaps(limit: number) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("identify_keyword_gaps", { limit_count: limit });
  if (error || !data) return { created: 0, error: error?.message ?? null };

  let created = 0;
  for (const row of data) {
    const { error: insertError } = await supabase.from("seo_keyword_gaps").insert({
      topic_id: row.topic_id,
      keyword: row.keyword,
      language_code: row.language_code,
      search_volume_score: row.search_volume_score ?? 0,
      competition_score: row.competition_score ?? 0,
      affiliate_potential_score: row.affiliate_potential_score ?? 0,
      opportunity_score: row.opportunity_score ?? 0,
    });
    if (!insertError) created++;
  }
  return { created, error: null };
}

async function suggestInternalLinks(limit: number) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("suggest_internal_links", { limit_count: limit });
  if (error || !data) return { created: 0, error: error?.message ?? null };

  let created = 0;
  for (const row of data) {
    const { data: existing } = await supabase
      .from("internal_link_suggestions")
      .select("id")
      .eq("source_object_id", row.source_object_id)
      .eq("target_object_id", row.target_object_id)
      .maybeSingle();

    if (existing) continue;

    const { error: insertError } = await supabase.from("internal_link_suggestions").insert({
      source_object_id: row.source_object_id,
      source_object_type: row.source_object_type,
      target_object_id: row.target_object_id,
      target_object_type: row.target_object_type,
      language_code: row.language_code,
      anchor_text: row.anchor_text,
      context_snippet: row.context_snippet,
      relevance_score: row.relevance_score,
      cluster_strength_score: row.cluster_strength_score,
      status: "pending",
    });
    if (!insertError) created++;
  }
  return { created, error: null };
}

async function identifyWeakClusters(limit: number) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("find_weak_topic_clusters", { limit_count: limit });
  if (error || !data) return { count: 0, error: error?.message ?? null };
  return { count: data.length, error: null };
}

export async function getSeoInsights(limit = 20): Promise<{
  keywordGaps: SeoKeywordGap[];
  linkSuggestions: InternalLinkSuggestion[];
  error: string | null;
}> {
  const supabase = createAdminClient();
  const [{ data: gaps }, { data: links }] = await Promise.all([
    supabase.from("seo_keyword_gaps").select("*").eq("status", "pending").order("opportunity_score", { ascending: false }).limit(limit),
    supabase.from("internal_link_suggestions").select("*").eq("status", "pending").order("relevance_score", { ascending: false }).limit(limit),
  ]);
  return {
    keywordGaps: (gaps || []) as SeoKeywordGap[],
    linkSuggestions: (links || []) as InternalLinkSuggestion[],
    error: null,
  };
}
