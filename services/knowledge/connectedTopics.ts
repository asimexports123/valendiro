/**
 * Genuinely connected topics — graph relationships first, subcategory overlap fallback.
 * Never returns random same-category listings or news-like slugs.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { scoreNewsSignals } from "@/services/admission/admissionRules";
import { getSemanticRecommendations, type SemanticRecommendation } from "./knowledgeGraph";
import { dedupeBySlug, isUsefulTopicLabel, topicRelevanceScore } from "./navigationTopicFilters";

export interface ConnectedTopic {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  connection: string;
}

function looksLikeNewsOrJunk(title: string, slug: string): boolean {
  if (scoreNewsSignals(title) >= 0.35) return true;
  if (title.length > 70) return true;
  if (/\d{4}|battlefield|zuckerberg|chevy|startup|layoff|hacked/i.test(title + slug)) return true;
  return false;
}

function slugKeywords(slug: string): string[] {
  return slug.split("-").filter((w) => w.length > 2);
}

function titleOverlap(aSlug: string, bSlug: string, bTitle: string): number {
  const keys = slugKeywords(aSlug);
  if (keys.length === 0) return 0;
  const hay = `${bSlug} ${bTitle}`.toLowerCase();
  let hits = 0;
  for (const k of keys) {
    if (hay.includes(k)) hits++;
  }
  return hits / keys.length;
}

function fromSemantic(rec: SemanticRecommendation): ConnectedTopic {
  return {
    id: rec.topicId,
    slug: rec.topicSlug,
    title: rec.topicTitle,
    subtitle: rec.relationshipReason,
    connection: rec.relationshipReason,
  };
}

function rankConnectedTopic(topicTitle: string, title: string, connection: string, semanticWeight: number): number {
  const titleScore = topicRelevanceScore(topicTitle, title, title, semanticWeight);
  const connectionBias =
    /Prerequisite/i.test(connection) ? 6 :
    /Related/i.test(connection) ? 4 :
    /Part of|Contains|Specializes|Extends/i.test(connection) ? 5 :
    0;
  return titleScore + connectionBias;
}

/** Related topics that are actually connected — not random category neighbors. */
export async function getConnectedTopics(
  topicId: string,
  topicSlug: string,
  topicTitle: string,
  categoryId: string | null,
  subcategoryId: string | null,
  limit = 6
): Promise<ConnectedTopic[]> {
  const semantic = await getSemanticRecommendations(topicId, null, 12, topicTitle);
  const pool: ConnectedTopic[] = [];

  for (const rec of [
    ...semantic.nextTopics,
    ...semantic.prerequisites,
    ...semantic.applications,
    ...semantic.related,
  ]) {
    if (rec.topicSlug === topicSlug) continue;
    if (looksLikeNewsOrJunk(rec.topicTitle, rec.topicSlug)) continue;
    if (!isUsefulTopicLabel(rec.topicTitle, rec.topicSlug)) continue;
    pool.push(fromSemantic(rec));
  }

  const graphLinks = dedupeBySlug(pool)
    .sort((a, b) => rankConnectedTopic(topicTitle || topicSlug, b.title, b.connection, 8) - rankConnectedTopic(topicTitle || topicSlug, a.title, a.connection, 8));

  if (graphLinks.length >= 3) {
    return graphLinks.slice(0, limit);
  }

  // Fallback: same subcategory with slug/title overlap (not random)
  if (subcategoryId) {
    const sb = createAdminClient();
    const { data } = await sb
      .from("topics")
      .select("id, slug, topic_translations(title, subtitle)")
      .eq("subcategory_id", subcategoryId)
      .eq("status", "published")
      .neq("id", topicId)
      .eq("topic_translations.language_code", "en")
      .limit(30);

    const siblings = (data ?? [])
      .map((t) => ({
        id: t.id,
        slug: t.slug,
        title: t.topic_translations?.[0]?.title ?? t.slug,
        subtitle: t.topic_translations?.[0]?.subtitle ?? null,
        overlap: titleOverlap(topicSlug, t.slug, t.topic_translations?.[0]?.title ?? ""),
      }))
      .filter((t) => t.overlap >= 0.25 && !looksLikeNewsOrJunk(t.title, t.slug) && isUsefulTopicLabel(t.title, t.slug))
      .sort((a, b) => b.overlap - a.overlap);

    const seen = new Set(graphLinks.map((t) => t.slug));
    for (const s of siblings) {
      if (seen.has(s.slug)) continue;
      seen.add(s.slug);
      graphLinks.push({
        id: s.id,
        slug: s.slug,
        title: s.title,
        subtitle: s.subtitle,
        connection: "Same collection",
      });
      if (graphLinks.length >= limit) break;
    }
  }

  if (graphLinks.length < limit && categoryId) {
    const sb = createAdminClient();
    const { data } = await sb
      .from("topics")
      .select("id, slug, topic_translations(title, subtitle)")
      .eq("category_id", categoryId)
      .eq("status", "published")
      .neq("id", topicId)
      .eq("topic_translations.language_code", "en")
      .limit(60);

    const categoryLinks = (data ?? [])
      .map((t) => ({
        id: t.id,
        slug: t.slug,
        title: t.topic_translations?.[0]?.title ?? t.slug,
        subtitle: t.topic_translations?.[0]?.subtitle ?? null,
        score: topicRelevanceScore(topicTitle || topicSlug, t.topic_translations?.[0]?.title ?? t.slug, t.slug, 5),
      }))
      .filter((t) => !looksLikeNewsOrJunk(t.title, t.slug) && isUsefulTopicLabel(t.title, t.slug))
      .sort((a, b) => b.score - a.score);

    const seen = new Set(graphLinks.map((t) => t.slug));
    for (const t of categoryLinks) {
      if (seen.has(t.slug)) continue;
      seen.add(t.slug);
      graphLinks.push({
        id: t.id,
        slug: t.slug,
        title: t.title,
        subtitle: t.subtitle,
        connection: "Likely next topic",
      });
      if (graphLinks.length >= limit) break;
    }
  }

  return graphLinks.slice(0, limit);
}
