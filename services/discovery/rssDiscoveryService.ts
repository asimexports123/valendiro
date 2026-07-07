/**
 * RSS Feed Discovery Service
 * 
 * Discovers and ingests content from RSS feeds
 * Part of the autonomous discovery pipeline
 */

import { createAdminClient } from "@/lib/supabase/admin";

const supabase = createAdminClient();

export interface RSSFeed {
  url: string;
  name: string;
  description?: string;
  domain: string;
}

export interface DiscoveredArticle {
  title: string;
  url: string;
  content: string;
  publishedAt: Date;
  summary?: string;
}

export interface SourceScores {
  trustScore: number;
  freshnessScore: number;
  authorityScore: number;
  originalityScore: number;
  spamScore: number;
}

/**
 * Add a new RSS feed as a discovery source
 */
export async function addRSSFeed(feed: RSSFeed): Promise<string> {
  console.log(`[RSSDiscovery] Adding RSS feed: ${feed.name}`);

  const { data, error } = await supabase
    .from("discovery_sources")
    .insert({
      source_type: "rss",
      name: feed.name,
      url: feed.url,
      description: feed.description,
      domain: feed.domain,
      status: "active",
      config: {
        feed_type: "rss",
        update_frequency: "hourly",
      },
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to add RSS feed: ${error?.message}`);
  }

  console.log(`[RSSDiscovery] RSS feed added: ${data.id}`);
  return data.id;
}

/**
 * Discover content from an RSS feed
 */
export async function discoverFromRSSFeed(sourceId: string): Promise<number> {
  console.log(`[RSSDiscovery] Discovering content from source: ${sourceId}`);

  // Fetch source details
  const { data: source, error: sourceError } = await supabase
    .from("discovery_sources")
    .select("*")
    .eq("id", sourceId)
    .single();

  if (sourceError || !source) {
    throw new Error(`Source not found: ${sourceError?.message}`);
  }

  try {
    // Fetch RSS feed
    const response = await fetch(source.url);
    const feedXML = await response.text();
    
    // Parse RSS feed (simplified - in production use proper RSS parser)
    const articles = parseRSSFeed(feedXML, source.url);
    
    console.log(`[RSSDiscovery] Found ${articles.length} articles in feed`);

    // Store discovered articles
    let discoveredCount = 0;
    for (const article of articles) {
      const existing = await checkDuplicateArticle(article.url);
      if (!existing) {
        await storeDiscoveredArticle(sourceId, article, source);
        discoveredCount++;
      }
    }

    // Update source stats
    await updateSourceStats(sourceId, discoveredCount, null);

    console.log(`[RSSDiscovery] Discovered ${discoveredCount} new articles`);
    return discoveredCount;

  } catch (error: any) {
    console.error(`[RSSDiscovery] Error discovering from RSS: ${error.message}`);
    await updateSourceStats(sourceId, 0, error.message);
    throw error;
  }
}

/**
 * Parse RSS feed XML (simplified implementation)
 */
function parseRSSFeed(xml: string, sourceUrl: string): DiscoveredArticle[] {
  const articles: DiscoveredArticle[] = [];
  
  // Remove CDATA sections and decode HTML entities
  const cleanXml = xml.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
                      .replace(/&lt;/g, '<')
                      .replace(/&gt;/g, '>')
                      .replace(/&amp;/g, '&')
                      .replace(/&quot;/g, '"')
                      .replace(/&#39;/g, "'");
  
  // Simple regex-based parsing (in production use proper RSS parser like rss-parser)
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  const titleRegex = /<title[^>]*>(.*?)<\/title>/i;
  const linkRegex = /<link[^>]*>(.*?)<\/link>/i;
  const descriptionRegex = /<description[^>]*>(.*?)<\/description>/i;
  const contentRegex = /<content:encoded[^>]*>(.*?)<\/content:encoded>/i;
  const pubDateRegex = /<pubDate[^>]*>(.*?)<\/pubDate>/i;

  let match;
  while ((match = itemRegex.exec(cleanXml)) !== null) {
    const item = match[1];
    const titleMatch = item.match(titleRegex);
    const linkMatch = item.match(linkRegex);
    const descriptionMatch = item.match(descriptionRegex);
    const contentMatch = item.match(contentRegex);
    const pubDateMatch = item.match(pubDateRegex);

    if (titleMatch && linkMatch) {
      const title = titleMatch[1].replace(/<[^>]*>/g, '').trim();
      const url = linkMatch[1].trim();
      const description = descriptionMatch?.[1] || contentMatch?.[1] || '';
      const content = descriptionMatch?.[1] || contentMatch?.[1] || '';
      
      if (title && url) {
        articles.push({
          title: title,
          url: url,
          content: content,
          publishedAt: pubDateMatch ? new Date(pubDateMatch[1]) : new Date(),
          summary: description.replace(/<[^>]*>/g, '').substring(0, 200),
        });
      }
    }
  }

  return articles;
}

/**
 * Check if article already exists
 */
async function checkDuplicateArticle(url: string): Promise<boolean> {
  const { data } = await supabase
    .from("discovered_content")
    .select("id")
    .eq("url", url)
    .maybeSingle();

  return !!data;
}

/**
 * Store discovered article
 */
async function storeDiscoveredArticle(
  sourceId: string,
  article: DiscoveredArticle,
  source: any
): Promise<void> {
  const contentHash = generateContentHash(article.title + article.content);

  const { error } = await supabase
    .from("discovered_content")
    .insert({
      source_id: sourceId,
      title: article.title,
      url: article.url,
      content_summary: article.summary,
      content_full: article.content,
      published_at: article.publishedAt.toISOString(),
      status: "pending",
      content_hash: contentHash,
      trust_score: source.trust_score,
      freshness_score: source.freshness_score,
      authority_score: source.authority_score,
      originality_score: source.originality_score,
      spam_score: source.spam_score,
    });

  if (error) {
    throw new Error(`Failed to store discovered article: ${error.message}`);
  }
}

/**
 * Generate content hash for deduplication
 */
function generateContentHash(content: string): string {
  // Simple hash function (in production use proper hashing)
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

/**
 * Update source statistics
 */
async function updateSourceStats(sourceId: string, discoveredCount: number, error: string | null): Promise<void> {
  const updates: any = {
    last_checked_at: new Date().toISOString(),
    discovery_count: (await supabase
      .from("discovery_sources")
      .select("discovery_count")
      .eq("id", sourceId)
      .single()
    ).data?.discovery_count || 0 + discoveredCount,
  };

  if (discoveredCount > 0) {
    updates.last_discovered_at = new Date().toISOString();
    updates.error_count = 0;
    updates.last_error = null;
    updates.status = "active";
  } else if (error) {
    updates.error_count = (await supabase
      .from("discovery_sources")
      .select("error_count")
      .eq("id", sourceId)
      .single()
    ).data?.error_count || 0 + 1;
    updates.last_error = error;
    
    // Mark as failed if too many errors
    const source = await supabase
      .from("discovery_sources")
      .select("error_count")
      .eq("id", sourceId)
      .single();
    
    if (source && source.data && source.data.error_count > 5) {
      updates.status = "failed";
    }
  }

  await supabase
    .from("discovery_sources")
    .update(updates)
    .eq("id", sourceId);
}

/**
 * Process all active RSS feeds
 */
export async function processAllRSSFeeds(): Promise<{ processed: number; discovered: number }> {
  console.log(`[RSSDiscovery] Processing all active RSS feeds`);

  const { data: sources, error } = await supabase
    .from("discovery_sources")
    .select("*")
    .eq("source_type", "rss")
    .eq("status", "active");

  if (error || !sources) {
    throw new Error(`Failed to fetch RSS sources: ${error?.message}`);
  }

  let totalDiscovered = 0;
  for (const source of sources) {
    try {
      const discovered = await discoverFromRSSFeed(source.id);
      totalDiscovered += discovered;
    } catch (error) {
      console.error(`[RSSDiscovery] Failed to process source ${source.id}:`, error);
    }
  }

  console.log(`[RSSDiscovery] Processed ${sources.length} sources, discovered ${totalDiscovered} articles`);
  return { processed: sources.length, discovered: totalDiscovered };
}
