/**
 * Internal Linking Service
 * 
 * Automatically inserts contextual internal links in article content.
 * Links are added naturally based on topic mentions and semantic relationships.
 */

import { createAdminClient } from "@/lib/supabase/admin";

export interface TopicMatch {
  topicId: string;
  topicSlug: string;
  topicTitle: string;
  position: number;
  context: string;
}

const MAX_LINKS_PER_ARTICLE = 8;
const MIN_LINK_DISTANCE = 200; // characters between links

/**
 * Get published topics for internal linking
 */
async function getPublishedTopics(): Promise<Map<string, { id: string; slug: string; title: string }>> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("topics")
    .select("id, slug, topic_translations(title)")
    .eq("status", "published")
    .eq("topic_translations.language_code", "en");

  const topicMap = new Map<string, { id: string; slug: string; title: string }>();
  for (const topic of data || []) {
    const translation = topic.topic_translations?.[0];
    if (translation) {
      topicMap.set(translation.title.toLowerCase(), {
        id: topic.id,
        slug: topic.slug,
        title: translation.title,
      });
    }
  }
  return topicMap;
}

/**
 * Find topic mentions in content
 */
function findTopicMentions(
  content: string,
  topicMap: Map<string, { id: string; slug: string; title: string }>
): TopicMatch[] {
  const matches: TopicMatch[] = [];
  const words = content.toLowerCase().split(/\s+/);

  for (const [topicTitle, topicInfo] of topicMap) {
    const topicWords = topicTitle.split(/\s+/);
    
    // Find all occurrences of the topic title
    for (let i = 0; i <= words.length - topicWords.length; i++) {
      const phrase = words.slice(i, i + topicWords.length).join(' ');
      if (phrase === topicTitle) {
        // Calculate position in original content
        const beforeText = words.slice(0, i).join(' ');
        const position = beforeText.length;
        
        // Get context around the match
        const contextStart = Math.max(0, position - 50);
        const contextEnd = Math.min(content.length, position + topicTitle.length + 50);
        const context = content.substring(contextStart, contextEnd);

        matches.push({
          topicId: topicInfo.id,
          topicSlug: topicInfo.slug,
          topicTitle: topicInfo.title,
          position,
          context,
        });
      }
    }
  }

  return matches;
}

/**
 * Select best matches for linking (avoid over-linking)
 */
function selectBestMatches(matches: TopicMatch[]): TopicMatch[] {
  // Sort by position
  matches.sort((a, b) => a.position - b.position);

  const selected: TopicMatch[] = [];
  let lastPosition = -MIN_LINK_DISTANCE;

  for (const match of matches) {
    if (selected.length >= MAX_LINKS_PER_ARTICLE) break;
    if (match.position - lastPosition >= MIN_LINK_DISTANCE) {
      selected.push(match);
      lastPosition = match.position;
    }
  }

  return selected;
}

/**
 * Insert internal links into content
 */
export async function insertInternalLinks(
  content: string,
  currentTopicId?: string
): Promise<{ content: string; linksInserted: number }> {
  const topicMap = await getPublishedTopics();
  
  // Remove current topic from map to avoid self-linking
  if (currentTopicId) {
    for (const [title, topic] of topicMap) {
      if (topic.id === currentTopicId) {
        topicMap.delete(title);
        break;
      }
    }
  }

  const matches = findTopicMentions(content, topicMap);
  const selectedMatches = selectBestMatches(matches);

  // Insert links from end to beginning to preserve positions
  let modifiedContent = content;
  for (const match of [...selectedMatches].reverse()) {
    const linkStart = match.position;
    const linkEnd = match.position + match.topicTitle.length;
    const before = modifiedContent.substring(0, linkStart);
    const after = modifiedContent.substring(linkEnd);
    const link = `<a href="/en/topics/${match.topicSlug}" class="text-primary hover:underline font-medium">${match.topicTitle}</a>`;
    modifiedContent = before + link + after;
  }

  return {
    content: modifiedContent,
    linksInserted: selectedMatches.length,
  };
}

/**
 * Get internal linking report
 */
export async function getInternalLinkReport(content: string, currentTopicId?: string): Promise<{
  potentialLinks: number;
  selectedLinks: number;
  links: TopicMatch[];
}> {
  const topicMap = await getPublishedTopics();
  
  if (currentTopicId) {
    for (const [title, topic] of topicMap) {
      if (topic.id === currentTopicId) {
        topicMap.delete(title);
        break;
      }
    }
  }

  const matches = findTopicMentions(content, topicMap);
  const selected = selectBestMatches(matches);

  return {
    potentialLinks: matches.length,
    selectedLinks: selected.length,
    links: selected,
  };
}
