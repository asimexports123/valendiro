/**
 * Genuinely connected topics — graph relationships first, subcategory overlap fallback.
 * Never returns random same-category listings or news-like slugs.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { scoreNewsSignals } from "@/services/admission/admissionRules";
import { getSemanticRecommendations, type SemanticRecommendation } from "./knowledgeGraph";

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

/** Related topics that are actually connected — not random category neighbors. */
export async function getConnectedTopics(
  topicId: string,
  topicSlug: string,
  subcategoryId: string | null,
  limit = 6
): Promise<ConnectedTopic[]> {
  const semantic = await getSemanticRecommendations(topicId, null, 12);
  const pool: ConnectedTopic[] = [];

  for (const rec of [
    ...semantic.nextTopics,
    ...semantic.prerequisites,
    ...semantic.applications,
    ...semantic.related,
  ]) {
    if (rec.topicSlug === topicSlug) continue;
    if (looksLikeNewsOrJunk(rec.topicTitle, rec.topicSlug)) continue;
    pool.push(fromSemantic(rec));
  }

  // Dedupe by slug
  const seen = new Set<string>();
  const graphLinks = pool.filter((t) => {
    if (seen.has(t.slug)) return false;
    seen.add(t.slug);
    return true;
  });

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
      .filter((t) => t.overlap >= 0.25 && !looksLikeNewsOrJunk(t.title, t.slug))
      .sort((a, b) => b.overlap - a.overlap);

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

  return graphLinks.slice(0, limit);
}
