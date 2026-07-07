/**
 * Run Autonomous Pipeline LIVE with Real Sources
 * Demonstrates actual end-to-end execution
 */

import { createAdminClient } from "../lib/supabase/admin";
import { processAllRSSFeeds } from "../services/discovery/rssDiscoveryService";
import { processPendingDeduplication } from "../services/discovery/deduplicationService";
import { processPendingExtraction } from "../services/discovery/knowledgeExtractionService";
import { analyzeAllTopicGaps } from "../services/discovery/gapAnalysisService";
import { processRegenerationQueue } from "../services/regeneration/contentRegenerationQueue";
import { regenerateAllInternalLinks } from "../services/discovery/internalLinkService";
import { runHealthCheck } from "../services/monitoring/selfMonitoringService";

const supabase = createAdminClient();

async function runLivePipeline() {
  console.log("=".repeat(80));
  console.log("AUTONOMOUS DISCOVERY PIPELINE - LIVE EXECUTION");
  console.log("=".repeat(80));
  console.log();

  // Step 1: Health Check
  console.log("STEP 1: HEALTH CHECK");
  console.log("-".repeat(80));
  const health = await runHealthCheck();
  console.log("System Health:");
  health.forEach(h => {
    console.log(`  ${h.componentName}: ${h.status} (${h.healthScore}%)`);
  });
  console.log();

  // Step 2: Discovery
  console.log("STEP 2: DISCOVERY FROM RSS FEEDS");
  console.log("-".repeat(80));
  const discoveryResult = await processAllRSSFeeds();
  console.log(`✓ Discovered ${discoveryResult.discovered} articles from ${discoveryResult.processed} sources`);
  console.log();

  // Step 3: Deduplication
  console.log("STEP 3: DEDUPLICATION");
  console.log("-".repeat(80));
  const dedupResult = await processPendingDeduplication();
  console.log(`✓ Processed ${dedupResult.processed} items, merged ${dedupResult.merged} duplicates`);
  console.log();

  // Step 4: Knowledge Extraction
  console.log("STEP 4: KNOWLEDGE EXTRACTION");
  console.log("-".repeat(80));
  const extractionResult = await processPendingExtraction();
  console.log(`✓ Extracted knowledge from ${extractionResult.processed} items`);
  console.log(`✓ Created ${extractionResult.nodesCreated} knowledge graph nodes`);
  console.log(`✓ Created ${extractionResult.edgesCreated} knowledge graph edges`);
  console.log();

  // Step 5: Gap Analysis
  console.log("STEP 5: GAP ANALYSIS");
  console.log("-".repeat(80));
  const gapResult = await analyzeAllTopicGaps();
  console.log(`✓ Analyzed ${gapResult.analyzed} topics for gaps`);
  console.log(`✓ Queued ${gapResult.regenerationQueued} regenerations`);
  console.log();

  // Step 6: Regeneration Queue Processing
  console.log("STEP 6: REGENERATION QUEUE");
  console.log("-".repeat(80));
  await processRegenerationQueue();
  console.log(`✓ Processed regeneration queue`);
  console.log();

  // Step 7: Internal Links
  console.log("STEP 7: INTERNAL LINKS");
  console.log("-".repeat(80));
  const linksResult = await regenerateAllInternalLinks();
  console.log(`✓ Regenerated internal links for ${linksResult.processed} topics`);
  console.log(`✓ Created ${linksResult.linksCreated} new links`);
  console.log();

  // Step 8: Final Health Check
  console.log("STEP 8: FINAL HEALTH CHECK");
  console.log("-".repeat(80));
  const finalHealth = await runHealthCheck();
  console.log("Final System Health:");
  finalHealth.forEach(h => {
    console.log(`  ${h.componentName}: ${h.status} (${h.healthScore}%)`);
  });
  console.log();

  // Step 9: Database Evidence
  console.log("STEP 9: DATABASE EVIDENCE");
  console.log("-".repeat(80));
  
  const { count: sourcesCount } = await supabase
    .from("discovery_sources")
    .select("id", { count: "exact", head: true });
  
  const { count: contentCount } = await supabase
    .from("discovered_content")
    .select("id", { count: "exact", head: true });
  
  const { count: nodesCount } = await supabase
    .from("knowledge_graph_nodes")
    .select("id", { count: "exact", head: true });
  
  const { count: edgesCount } = await supabase
    .from("knowledge_graph_edges")
    .select("id", { count: "exact", head: true });
  
  const { count: queueCount } = await supabase
    .from("discovery_queue")
    .select("id", { count: "exact", head: true });

  console.log(`✓ Discovery Sources: ${sourcesCount || 0}`);
  console.log(`✓ Discovered Content: ${contentCount || 0}`);
  console.log(`✓ Knowledge Graph Nodes: ${nodesCount || 0}`);
  console.log(`✓ Knowledge Graph Edges: ${edgesCount || 0}`);
  console.log(`✓ Discovery Queue Jobs: ${queueCount || 0}`);
  console.log();

  console.log("=".repeat(80));
  console.log("PIPELINE EXECUTION COMPLETE");
  console.log("=".repeat(80));
}

runLivePipeline()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Pipeline execution failed:", error);
    process.exit(1);
  });
