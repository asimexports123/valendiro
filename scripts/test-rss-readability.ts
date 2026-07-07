/**
 * Test RSS Extraction with Readability
 * Verifies extraction of full article content from RSS article URLs
 */

import { createAdminClient } from "../lib/supabase/admin";
import { addRSSFeed, discoverFromRSSFeed } from "../services/discovery/rssDiscoveryService";

const supabase = createAdminClient();

async function testRSSReadability() {
  console.log("=" + "=".repeat(79));
  console.log("RSS EXTRACTION WITH READABILITY TEST");
  console.log("=".repeat(80));
  console.log();

  // Clear old data
  console.log("Clearing old data...");
  await supabase.from("discovered_content").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  console.log("✓ Cleared old discovered content");
  console.log();

  // Test with GitHub Blog (shorter feed, easier to test)
  const testSource = {
    url: "https://github.blog/feed/",
    name: "GitHub Blog",
    description: "Official GitHub blog",
    domain: "github.com",
  };

  console.log("=".repeat(80));
  console.log(`TESTING: ${testSource.name}`);
  console.log(`URL: ${testSource.url}`);
  console.log("=".repeat(80));
  console.log();

  try {
    // Add RSS source
    console.log("[1] Adding RSS source...");
    let sourceId: string;
    try {
      sourceId = await addRSSFeed(testSource);
    } catch (e: any) {
      // Source may already exist, fetch its ID
      const { data: existingSource } = await supabase
        .from("discovery_sources")
        .select("id")
        .eq("name", testSource.name)
        .single();
      sourceId = existingSource?.id || "";
    }
    console.log(`✓ RSS source added (ID: ${sourceId})`);
    console.log();

    // Discover from RSS (this will use Readability to extract content)
    console.log("[2] Discovering from RSS (using Readability for content extraction)...");
    const discoveredCount = await discoverFromRSSFeed(sourceId);
    console.log(`✓ Discovered ${discoveredCount} articles with full content`);
    console.log();

    // Check extracted content
    console.log("[3] Checking extracted content metrics...");
    const { data: discoveredContent } = await supabase
      .from("discovered_content")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5);

    if (discoveredContent && discoveredContent.length > 0) {
      console.log();
      console.log("EXTRACTION RESULTS:");
      console.log("-".repeat(80));
      
      discoveredContent.forEach((item, index) => {
        const chars = (item.content_full || '').length;
        const words = (item.content_full || '').split(/\s+/).length;
        console.log(`\nArticle ${index + 1}:`);
        console.log(`  URL: ${item.url}`);
        console.log(`  Title: ${item.title}`);
        console.log(`  Characters extracted: ${chars}`);
        console.log(`  Words extracted: ${words}`);
        console.log(`  Content preview: ${(item.content_full || '').substring(0, 200)}...`);
      });
    } else {
      console.log("✗ No content extracted");
    }

    console.log();
    console.log("=".repeat(80));
    console.log("TEST COMPLETE");
    console.log("=".repeat(80));

  } catch (error: any) {
    console.error(`\n✗ ERROR: ${error.message}`);
    console.error(error.stack);
  }
}

testRSSReadability()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
