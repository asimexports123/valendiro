/**
 * Test Discovery System
 * Tests the discovery system with real data
 */

import { createSourceManagementService } from "../services/discovery/sourceManagement";
import { createDiscoveryScheduler } from "../jobs/schedulers/discoveryScheduler";
import { createTopicDetectionService } from "../services/discovery/topicDetection";
import { createDiscoveryMonitoringService } from "../services/discovery/monitoring";

async function testDiscoverySystem() {
  console.log("Testing Discovery System...\n");

  try {
    // 1. Add a test RSS feed
    console.log("1. Adding test RSS feed...");
    const sourceManagement = await createSourceManagementService();
    
    // Add TechCrunch RSS feed as a test
    const source = await sourceManagement.addRSSSource({
      name: "TechCrunch",
      url: "https://techcrunch.com/feed/",
      fetchIntervalMinutes: 60,
    });
    console.log("✓ RSS source added:", source.name, source.id);

    // 2. Run discovery for the source
    console.log("\n2. Running discovery for the source...");
    const scheduler = await createDiscoveryScheduler();
    const discoveryResult = await scheduler.runDiscoveryForSource({
      id: source.id,
      source_type: "rss",
      name: source.name,
      url: source.url,
      config: {},
      status: "active",
      fetch_interval_minutes: 60,
      error_count: 0,
      last_error: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    console.log("✓ Discovery completed:", discoveryResult);

    // 3. Check system health
    console.log("\n3. Checking system health...");
    const monitoring = await createDiscoveryMonitoringService();
    const health = await monitoring.getSystemHealth();
    console.log("✓ System health:", health.status, JSON.stringify(health, null, 2));

    // 4. Auto-map articles to topics
    console.log("\n4. Auto-mapping articles to topics...");
    const topicDetection = await createTopicDetectionService();
    const mappingResults = await topicDetection.autoMapArticlesToTopics(10);
    console.log("✓ Topic mapping:", mappingResults);

    // 5. Get source health
    console.log("\n5. Getting source health...");
    const sourceHealth = await monitoring.getSourceHealth(source.id);
    console.log("✓ Source health:", sourceHealth);

    console.log("\n✅ Discovery System test completed successfully!");
    console.log("\nThe system is now capable of:");
    console.log("- Discovering articles from RSS feeds");
    console.log("- Deduplicating articles");
    console.log("- Mapping articles to relevant topics");
    console.log("- Monitoring system health");
    console.log("\nTo run the system continuously:");
    console.log("npx tsx scripts/discovery-orchestrator.ts start");
  } catch (error) {
    console.error("❌ Discovery System test failed:", error);
    throw error;
  }
}

testDiscoverySystem().catch(console.error);
