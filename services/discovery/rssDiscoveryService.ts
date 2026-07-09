/**
 * RSS Feed Discovery Service
 * 
 * Discovers and ingests content from RSS feeds
 * Part of the autonomous discovery pipeline
 */

import Parser from 'rss-parser';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import { createAdminClient } from "@/lib/supabase/admin";

const parser = new Parser();

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
 * Discover content from an RSS feed (max 20 articles per run)
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
    
    // Parse RSS feed using rss-parser
    const articles = await parseRSSFeed(feedXML, source.url);
    
    console.log(`[RSSDiscovery] Found ${articles.length} articles in feed`);
    
    // Limit to 20 articles per run
    const articlesToProcess = articles.slice(0, 20);
    console.log(`[RSSDiscovery] Processing ${articlesToProcess.length} articles (max 20 per run)`);

    // Store discovered articles
    let discoveredCount = 0;
    for (const article of articlesToProcess) {
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
 * Parse RSS feed using rss-parser library and extract full article content using Readability
 */
async function parseRSSFeed(xml: string, sourceUrl: string): Promise<DiscoveredArticle[]> {
  const articles: DiscoveredArticle[] = [];
  
  try {
    const feed = await parser.parseString(xml);
    
    for (const item of feed.items) {
      if (item.title && item.link) {
        console.log(`[RSSDiscovery] Extracting content from: ${item.link}`);
        
        // Download article URL and extract main content using Readability
        const { content, wordCount, extractionAccuracy } = await extractFullArticleContent(item.link);
        
        console.log(`[RSSDiscovery] Extracted ${wordCount} words from ${item.link} (accuracy: ${extractionAccuracy})`);
        
        // Remove HTML tags for summary
        const summaryText = content.replace(/<[^>]*>/g, '').trim();
        
        articles.push({
          title: item.title,
          url: item.link,
          content: content,
          publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
          summary: summaryText.substring(0, 200),
        });
      }
    }
  } catch (error: any) {
    console.error(`[RSSDiscovery] Error parsing RSS feed: ${error.message}`);
  }

  return articles;
}

/**
 * Extract full article content from article URL using Readability
 * Returns object with content, wordCount, and extractionAccuracy
 */
async function extractFullArticleContent(url: string): Promise<{ content: string; wordCount: number; extractionAccuracy: number }> {
  try {
    const response = await fetch(url);
    const html = await response.text();
    
    const dom = new JSDOM(html, { url });
    const document = dom.window.document;
    const reader = new Readability(document);
    const article = reader.parse();

    if (article && article.textContent) {
      const wordCount = article.textContent.split(/\s+/).length;
      const extractionAccuracy = 0.95; // Readability is highly accurate
      console.log(`[RSSDiscovery] Extracted ${article.textContent.length} characters, ${wordCount} words from ${url}`);
      return {
        content: article.textContent,
        wordCount,
        extractionAccuracy,
      };
    }

    // Fallback to body content if Readability fails
    const bodyText = document.body?.textContent || '';
    const wordCount = bodyText.split(/\s+/).length;
    const extractionAccuracy = 0.7; // Lower accuracy for fallback
    console.log(`[RSSDiscovery] Fallback: extracted ${bodyText.length} characters, ${wordCount} words from body`);
    return {
      content: bodyText,
      wordCount,
      extractionAccuracy,
    };
  } catch (error: any) {
    console.error(`[RSSDiscovery] Error extracting content from ${url}: ${error.message}`);
    return {
      content: '',
      wordCount: 0,
      extractionAccuracy: 0,
    };
  }
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
 * Process all active RSS feeds via the canonical discovery_system_sources path.
 * Legacy discovery_sources rows are no longer the primary ingest path.
 */
export async function processAllRSSFeeds(): Promise<{ processed: number; discovered: number }> {
  console.log(`[RSSDiscovery] Delegating to canonical DiscoveryScheduler (discovery_system_sources)`);

  const { createDiscoveryScheduler } = await import("@/jobs/schedulers/discoveryScheduler");
  const scheduler = await createDiscoveryScheduler();

  const discoveryResults = await scheduler.runScheduledDiscoveries();
  const discovered = discoveryResults.reduce((sum, r) => sum + r.articlesSaved, 0);

  const pipelineResult = await scheduler.processDiscoveredArticles(10);
  console.log(
    `[RSSDiscovery] Pipeline: processed=${pipelineResult.processed}, published=${pipelineResult.published}, failed=${pipelineResult.failed}`
  );

  return { processed: discoveryResults.length, discovered };
}
