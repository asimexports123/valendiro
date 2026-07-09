/**
 * Knowledge Graph Service
 * 
 * Provides semantic topic recommendations based on knowledge relationships.
 * Maps relationship types to reader-friendly categories.
 */

import { createAdminClient } from "@/lib/supabase/admin";

function slugToTitle(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export interface KnowledgeRelationship {
  id: string;
  sourceId: string;
  sourceLevel: string;
  targetId: string;
  targetLevel: string;
  relationshipType: string;
  strength: string;
  explanation: string | null;
  bidirectional: boolean;
}

export interface SemanticRecommendation {
  topicId: string;
  topicSlug: string;
  topicTitle: string;
  relationshipReason: string;
  strength: string;
}

/**
 * Map relationship types to reader-friendly categories
 */
function mapRelationshipToReason(relationshipType: string, direction: 'incoming' | 'outgoing'): string {
  const mappings: Record<string, { incoming: string; outgoing: string }> = {
    'requires': { incoming: 'Prerequisite', outgoing: 'Prerequisite' },
    'depends_on': { incoming: 'Required for', outgoing: 'Depends on' },
    'extends': { incoming: 'Extended by', outgoing: 'Extends' },
    'precedes': { incoming: 'Follows', outgoing: 'Precedes' },
    'specializes': { incoming: 'Specialized by', outgoing: 'Specializes' },
    'generalizes': { incoming: 'Generalized by', outgoing: 'Generalizes' },
    'part_of': { incoming: 'Contains', outgoing: 'Part of' },
    'causes': { incoming: 'Caused by', outgoing: 'Causes' },
    'prevents': { incoming: 'Prevented by', outgoing: 'Prevents' },
    'related_to': { incoming: 'Related to', outgoing: 'Related to' },
    'contradicts': { incoming: 'Contradicts', outgoing: 'Contradicts' },
    'replaces': { incoming: 'Replaced by', outgoing: 'Replaces' },
  };

  return mappings[relationshipType]?.[direction] || 'Related to';
}

/**
 * Get semantic recommendations for a topic based on Knowledge Graph relationships
 */
export async function getSemanticRecommendations(
  topicId: string,
  categoryId: string | null,
  limit = 9
): Promise<{
  prerequisites: SemanticRecommendation[];
  nextTopics: SemanticRecommendation[];
  applications: SemanticRecommendation[];
  related: SemanticRecommendation[];
}> {
  const supabase = createAdminClient();

  // Fetch relationships where this topic is the source (outgoing)
  const { data: outgoing } = await supabase
    .from("knowledge_relationships")
    .select("*")
    .eq("source_id", topicId)
    .eq("source_level", "topic")
    .eq("target_level", "topic")
    .limit(limit * 2);

  // Fetch relationships where this topic is the target (incoming)
  const { data: incoming } = await supabase
    .from("knowledge_relationships")
    .select("*")
    .eq("target_id", topicId)
    .eq("target_level", "topic")
    .eq("source_level", "topic")
    .limit(limit * 2);

  // Fetch all topic IDs involved in relationships
  const topicIds = new Set<string>();
  outgoing?.forEach(rel => topicIds.add(rel.target_id));
  incoming?.forEach(rel => topicIds.add(rel.source_id));

  // Fetch topic details separately
  const { data: topics } = await supabase
    .from("topics")
    .select("id, slug, topic_translations(title)")
    .eq("status", "published")
    .in("id", Array.from(topicIds));

  const topicMap = new Map();
  topics?.forEach(t => {
    topicMap.set(t.id, {
      slug: t.slug,
      title: t.topic_translations?.[0]?.title || t.slug,
    });
  });

  const recommendations = {
    prerequisites: [] as SemanticRecommendation[],
    nextTopics: [] as SemanticRecommendation[],
    applications: [] as SemanticRecommendation[],
    related: [] as SemanticRecommendation[],
  };

  // Process outgoing relationships (this topic → other topics)
  for (const rel of outgoing || []) {
    const topicInfo = topicMap.get(rel.target_id);
    if (!topicInfo) continue;

    const rec: SemanticRecommendation = {
      topicId: rel.target_id,
      topicSlug: topicInfo.slug,
      topicTitle: topicInfo.title,
      relationshipReason: mapRelationshipToReason(rel.relationship_type, 'outgoing'),
      strength: rel.strength,
    };

    // Categorize by relationship type
    if (['requires', 'depends_on'].includes(rel.relationship_type)) {
      recommendations.prerequisites.push(rec);
    } else if (['extends', 'precedes', 'specializes'].includes(rel.relationship_type)) {
      recommendations.nextTopics.push(rec);
    } else if (['part_of', 'causes', 'related_to'].includes(rel.relationship_type)) {
      recommendations.applications.push(rec);
    } else {
      recommendations.related.push(rec);
    }
  }

  // Process incoming relationships (other topics → this topic)
  for (const rel of incoming || []) {
    const topicInfo = topicMap.get(rel.source_id);
    if (!topicInfo) continue;

    const rec: SemanticRecommendation = {
      topicId: rel.source_id,
      topicSlug: topicInfo.slug,
      topicTitle: topicInfo.title,
      relationshipReason: mapRelationshipToReason(rel.relationship_type, 'incoming'),
      strength: rel.strength,
    };

    // Categorize by relationship type
    if (['requires', 'depends_on'].includes(rel.relationship_type)) {
      // If something requires this topic, this is a next topic for that thing
      recommendations.nextTopics.push(rec);
    } else if (['extends', 'precedes', 'specializes'].includes(rel.relationship_type)) {
      recommendations.prerequisites.push(rec);
    } else if (['part_of', 'causes', 'related_to'].includes(rel.relationship_type)) {
      recommendations.applications.push(rec);
    } else {
      recommendations.related.push(rec);
    }
  }

  // Remove duplicates and limit results
  const seen = new Set<string>();
  const dedupe = (list: SemanticRecommendation[]) => {
    return list
      .filter(rec => {
        const key = rec.topicId;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, Math.ceil(limit / 3));
  };

  recommendations.prerequisites = dedupe(recommendations.prerequisites);
  recommendations.nextTopics = dedupe(recommendations.nextTopics);
  recommendations.applications = dedupe(recommendations.applications);
  recommendations.related = dedupe(recommendations.related);

  return recommendations;
}

/**
 * Get learning journey for a topic (ordered path through knowledge)
 */
export async function getLearningJourney(topicId: string, maxDepth = 5): Promise<{
  completed: { slug: string; title: string }[];
  continueWith: { slug: string; title: string }[];
}> {
  const supabase = createAdminClient();

  // Get current topic
  const { data: currentTopic } = await supabase
    .from("topics")
    .select("slug, topic_translations(title)")
    .eq("id", topicId)
    .eq("topic_translations.language_code", "en")
    .single();

  if (!currentTopic) {
    return { completed: [], continueWith: [] };
  }

  const currentTitle =
    currentTopic.topic_translations?.[0]?.title || slugToTitle(currentTopic.slug);

  const completed = [{ slug: currentTopic.slug, title: currentTitle }];

  // Get prerequisites (what should come before)
  const { data: prerequisites } = await supabase
    .from("knowledge_relationships")
    .select("target_id")
    .eq("source_id", topicId)
    .eq("source_level", "topic")
    .eq("target_level", "topic")
    .eq("relationship_type", "requires")
    .limit(3);

  // Get next topics (what should come after)
  const { data: nextTopics } = await supabase
    .from("knowledge_relationships")
    .select("target_id")
    .eq("source_id", topicId)
    .eq("source_level", "topic")
    .eq("target_level", "topic")
    .in("relationship_type", ["precedes", "extends", "specializes"])
    .limit(5);

  // Fetch topic slugs for all related topic IDs
  const allTopicIds = [
    ...(prerequisites || []).map((r: any) => r.target_id),
    ...(nextTopics || []).map((r: any) => r.target_id),
  ];

  let continueWith: { slug: string; title: string }[] = [];
  if (allTopicIds.length > 0) {
    const { data: relatedTopics } = await supabase
      .from("topics")
      .select("id, slug, topic_translations(title)")
      .eq("status", "published")
      .eq("topic_translations.language_code", "en")
      .in("id", allTopicIds);

    const topicMap = new Map<string, { slug: string; title: string }>();
    relatedTopics?.forEach((t) => {
      topicMap.set(t.id, {
        slug: t.slug,
        title: t.topic_translations?.[0]?.title || t.slug,
      });
    });

    continueWith = [
      ...(prerequisites || []).map((r: { target_id: string }) => topicMap.get(r.target_id)).filter(Boolean),
      ...(nextTopics || []).map((r: { target_id: string }) => topicMap.get(r.target_id)).filter(Boolean),
    ] as { slug: string; title: string }[];
  }

  const seen = new Set<string>();
  const deduped = continueWith.filter((item) => {
    if (seen.has(item.slug)) return false;
    seen.add(item.slug);
    return true;
  });

  return {
    completed,
    continueWith: deduped.slice(0, maxDepth),
  };
}
