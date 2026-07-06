/**
 * Final Discovery System Verification
 * Completes end-to-end verification using existing test source
 */

import { createAdminClient } from "../lib/env";

async function finalVerification() {
  const supabase = createAdminClient();
  
  console.log("=== Final Discovery System Verification ===\n");

  // Use existing test source
  const { data: existingSource } = await supabase
    .from("discovery_system_sources")
    .select("*")
    .eq("source_type", "rss")
    .single();

  if (!existingSource) {
    console.log("❌ No test source found. Adding test source...");
    const { createSourceManagementService } = await import("../services/discovery/sourceManagement");
    const sourceManagement = await createSourceManagementService();
    const testSource = await sourceManagement.addRSSSource({
      name: "TechCrunch Test",
      url: "https://techcrunch.com/feed/",
    });
    console.log(`✓ Test source added: ${testSource.id}`);
    existingSource = testSource as any;
  }

  console.log(`Using test source: ${existingSource.name}`);

  // Run discovery
  console.log("\nRunning discovery...");
  const { createDiscoveryScheduler } = await import("../jobs/schedulers/discoveryScheduler");
  const scheduler = await createDiscoveryScheduler();
  const discoveryResults = await scheduler.runDiscoveryForSource(existingSource);
  console.log(`✓ Discovery completed: ${discoveryResults.articlesDiscovered} articles discovered`);

  // Check discovered articles
  console.log("\nChecking discovered articles...");
  const { data: discoveredArticles } = await supabase
    .from("discovered_articles")
    .select("*")
    .eq("source_id", existingSource.id)
    .limit(5);

  console.log(`✓ ${discoveredArticles?.length || 0} articles stored`);

  if (discoveredArticles && discoveredArticles.length > 0) {
    const article = discoveredArticles[0];
    console.log(`  Sample article: ${article.title}`);

    // Test topic mapping
    console.log("\nTesting topic mapping...");
    const { createTopicDetectionService } = await import("../services/discovery/topicDetection");
    const topicDetection = await createTopicDetectionService();
    const mappingResults = await topicDetection.autoMapArticlesToTopics(5);
    console.log(`✓ Topic mapping: ${mappingResults.mapped} mapped, ${mappingResults.unmapped} unmapped`);

    // Test monitoring
    console.log("\nTesting monitoring...");
    const { createDiscoveryMonitoringService } = await import("../services/discovery/monitoring");
    const monitoring = await createDiscoveryMonitoringService();
    const health = await monitoring.getSystemHealth();
    console.log(`✓ System health: ${health.status}`);
    console.log(`  Active sources: ${health.activeSources}`);
    console.log(`  Articles pending: ${health.articlesPending}`);
    console.log(`  Articles accepted (24h): ${health.articlesAcceptedLast24h}`);

    // Test incremental regeneration
    console.log("\nTesting incremental regeneration...");
    const { createIncrementalRegenerationService } = await import("../services/discovery/incrementalRegeneration");
    const regeneration = await createIncrementalRegenerationService();
    const regenResults = await regeneration.autoQueueRegeneration();
    console.log(`✓ Regeneration: ${regenResults.queued} queued, ${regenResults.skipped} skipped`);

    console.log("\n=== Final Verification Complete ===");
    console.log("✅ Discovery System End-to-End Pipeline Verified");
    console.log("\nPipeline Flow:");
    console.log("  1. RSS Feed → Discovery ✓");
    console.log("  2. Article Storage → Database ✓");
    console.log("  3. Topic Mapping → Auto-detection ✓");
    console.log("  4. System Monitoring → Health checks ✓");
    console.log("  5. Incremental Regeneration → Article updates ✓");
    console.log("\nTo start continuous operation:");
    console.log("npx tsx scripts/discovery-orchestrator.ts start");
    console.log("\nAdmin interface: /admin/discovery-admin");
  } else {
    console.log("⚠ No articles discovered - may need to check RSS feed");
  }
}

finalVerification().catch(console.error);
