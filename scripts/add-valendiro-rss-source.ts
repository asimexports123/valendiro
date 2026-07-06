/**
 * Add Valendiro RSS Feed as Discovery Source
 */

import { createAdminClient } from "../lib/env";
import { RSSConnector } from "../services/discovery/connectors/rssConnector";

async function addValendiroRSSSource() {
  const supabase = createAdminClient();
  const rssConnector = new RSSConnector();

  console.log("=== Adding Valendiro RSS Feed as Discovery Source ===\n");

  // Test the RSS feed first
  console.log("Step 1: Testing RSS feed...");
  try {
    const articles = await rssConnector.fetchFeed("https://rss.app/feeds/ttkOFf3GgYwCzcQU.xml");
    console.log(`✓ RSS feed is accessible`);
    console.log(`  Articles found: ${articles.length}`);
    if (articles.length > 0) {
      console.log(`  Sample article: ${articles[0].title}`);
    }
  } catch (error) {
    console.error(`✗ RSS feed test failed: ${error instanceof Error ? error.message : String(error)}`);
    return;
  }

  // Add the RSS feed as a discovery source
  console.log("\nStep 2: Adding RSS feed as discovery source...");
  const { data: sourceData, error: sourceError } = await supabase
    .from("discovery_system_sources")
    .insert({
      name: "Valendiro Category Feed",
      source_type: "rss",
      url: "https://rss.app/feeds/ttkOFf3GgYwCzcQU.xml",
      status: "active",
      config: {
        category: "valendiro",
        keyword_based: true,
        fetch_interval_minutes: 60,
      },
      last_fetched_at: null,
      error_count: 0,
      metadata: {
        added_at: new Date().toISOString(),
        description: "Valendiro category keyword-based RSS feed",
      },
    })
    .select("*")
    .single();

  if (sourceError) {
    // Check if it already exists
    if (sourceError.code === "23505") {
      console.log(`⚠ Source already exists. Updating existing source...`);
      const { data: existingSource } = await supabase
        .from("discovery_system_sources")
        .select("*")
        .eq("url", "https://rss.app/feeds/ttkOFf3GgYwCzcQU.xml")
        .single();

      if (existingSource) {
        console.log(`✓ Source ID: ${existingSource.id}`);
        console.log(`  Name: ${existingSource.name}`);
        console.log(`  Status: ${existingSource.status}`);
        console.log(`  Config: ${JSON.stringify(existingSource.config)}`);
      }
    } else {
      console.error(`✗ Failed to add source: ${sourceError.message}`);
      return;
    }
  } else {
    console.log(`✓ RSS feed added successfully`);
    console.log(`  Source ID: ${sourceData.id}`);
    console.log(`  Name: ${sourceData.name}`);
    console.log(`  URL: ${sourceData.url}`);
    console.log(`  Status: ${sourceData.status}`);
    console.log(`  Config: ${JSON.stringify(sourceData.config)}`);
  }

  // Test discovery from the new source
  console.log("\nStep 3: Testing discovery from new source...");
  try {
    const articles = await rssConnector.fetchFeed("https://rss.app/feeds/ttkOFf3GgYwCzcQU.xml");
    console.log(`✓ Discovery test successful`);
    console.log(`  Articles fetched: ${articles.length}`);
    
    if (articles.length > 0) {
      console.log(`\nSample articles:`);
      articles.slice(0, 3).forEach((article, index) => {
        console.log(`  ${index + 1}. ${article.title}`);
        console.log(`     URL: ${article.link}`);
        console.log(`     Content length: ${article.content?.length || 0} characters`);
      });
    }
  } catch (error) {
    console.error(`✗ Discovery test failed: ${error instanceof Error ? error.message : String(error)}`);
  }

  console.log("\n=== Valendiro RSS Feed Setup Complete ===");
  console.log(`✅ RSS feed https://rss.app/feeds/ttkOFf3GgYwCzcQU.xml is now configured for Valendiro category keyword-based discovery`);
}

addValendiroRSSSource().catch(console.error);
