/**
 * Process Extracted Articles Through Complete Pipeline
 * Extracted Article → Knowledge Facts → Entities → Relationships → Knowledge Package → Knowledge Graph → Gap Analysis → Regeneration Queue → QA → Publish → Homepage Update
 */

import { createAdminClient } from "../lib/supabase/admin";
import { processPendingDeduplication } from "../services/discovery/deduplicationService";
import { processPendingExtraction } from "../services/discovery/knowledgeExtractionService";
import { analyzeAllTopicGaps } from "../services/discovery/gapAnalysisService";
import { processRegenerationQueue } from "../services/regeneration/contentRegenerationQueue";

const supabase = createAdminClient();

async function processExtractedPipeline() {
  console.log("=" + "=".repeat(79));
  console.log("PROCESS EXTRACTED ARTICLES THROUGH COMPLETE PIPELINE");
  console.log("=".repeat(80));
  console.log();

  // Step 1: Check extracted content
  console.log("STEP 1: CHECK EXTRACTED CONTENT");
  console.log("-".repeat(80));
  const { data: extractedContent } = await supabase
    .from("discovered_content")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(10);

  if (!extractedContent || extractedContent.length === 0) {
    console.log("No extracted content found");
    return;
  }

  console.log(`✓ Found ${extractedContent.length} extracted articles`);
  console.log();

  // Show article details
  console.log("Extracted Articles:");
  extractedContent.forEach((article, index) => {
    console.log(`  ${index + 1}. ${article.title}`);
    console.log(`     URL: ${article.url}`);
    console.log(`     Content length: ${(article.content_full || '').length} characters`);
  });
  console.log();

  // Step 2: Deduplication
  console.log("STEP 2: DEDUPLICATION");
  console.log("-".repeat(80));
  const dedupResult = await processPendingDeduplication();
  console.log(`✓ Processed ${dedupResult.processed} items`);
  console.log(`✓ Merged ${dedupResult.merged} duplicates`);
  console.log();

  // Step 3: Knowledge Extraction
  console.log("STEP 3: KNOWLEDGE EXTRACTION");
  console.log("-".repeat(80));
  const extractionResult = await processPendingExtraction();
  console.log(`✓ Processed ${extractionResult.processed} items`);
  console.log(`✓ Created ${extractionResult.nodesCreated} knowledge graph nodes`);
  console.log(`✓ Created ${extractionResult.edgesCreated} knowledge graph edges`);
  console.log();

  // Step 4: Check Knowledge Graph
  console.log("STEP 4: KNOWLEDGE GRAPH");
  console.log("-".repeat(80));
  const { count: nodesCount } = await supabase
    .from("knowledge_graph_nodes")
    .select("id", { count: "exact", head: true });
  
  const { count: edgesCount } = await supabase
    .from("knowledge_graph_edges")
    .select("id", { count: "exact", head: true });

  console.log(`✓ Knowledge graph nodes: ${nodesCount || 0}`);
  console.log(`✓ Knowledge graph edges: ${edgesCount || 0}`);

  // Show sample nodes
  const { data: sampleNodes } = await supabase
    .from("knowledge_graph_nodes")
    .select("*")
    .limit(10);

  if (sampleNodes && sampleNodes.length > 0) {
    console.log("\nSample Knowledge Graph Nodes:");
    sampleNodes.forEach(node => {
      console.log(`  - ${node.name} (${node.node_type})`);
    });
  }
  console.log();

  // Step 5: Gap Analysis
  console.log("STEP 5: GAP ANALYSIS");
  console.log("-".repeat(80));
  const gapResult = await analyzeAllTopicGaps();
  console.log(`✓ Analyzed ${gapResult.analyzed} topics for gaps`);
  console.log(`✓ Queued ${gapResult.regenerationQueued} regenerations`);
  console.log();

  // Step 6: Check Regeneration Queue
  console.log("STEP 6: REGENERATION QUEUE");
  console.log("-".repeat(80));
  const { count: queuedCount } = await supabase
    .from("content_regeneration_queue")
    .select("id", { count: "exact", head: true })
    .eq("status", "queued");

  const { count: runningCount } = await supabase
    .from("content_regeneration_queue")
    .select("id", { count: "exact", head: true })
    .eq("status", "running");

  console.log(`✓ Queued jobs: ${queuedCount || 0}`);
  console.log(`✓ Running jobs: ${runningCount || 0}`);
  console.log();

  // Step 7: Process Regeneration Queue
  console.log("STEP 7: PROCESS REGENERATION QUEUE (QA & PUBLISH)");
  console.log("-".repeat(80));
  await processRegenerationQueue();
  console.log(`✓ Regeneration queue processed`);
  console.log();

  // Step 8: Check Published Articles
  console.log("STEP 8: CHECK PUBLISHED ARTICLES");
  console.log("-".repeat(80));
  const { count: publishedCount } = await supabase
    .from("content_regeneration_queue")
    .select("id", { count: "exact", head: true })
    .eq("status", "published");

  console.log(`✓ Published articles: ${publishedCount || 0}`);

  // Show recent published jobs
  const { data: publishedJobs } = await supabase
    .from("content_regeneration_queue")
    .select("*")
    .eq("status", "published")
    .order("completed_at", { ascending: false })
    .limit(5);

  if (publishedJobs && publishedJobs.length > 0) {
    console.log("\nRecent Published Articles:");
    publishedJobs.forEach(job => {
      console.log(`  - ${(job as any).topic_slug} (completed: ${job.completed_at})`);
    });
  }
  console.log();

  // Final Summary
  console.log("=" + "=".repeat(79));
  console.log("PIPELINE SUMMARY");
  console.log("=".repeat(80));
  console.log(`Extracted Articles: ${extractedContent.length}`);
  console.log(`Knowledge Graph Nodes: ${nodesCount || 0}`);
  console.log(`Knowledge Graph Edges: ${edgesCount || 0}`);
  console.log(`Regeneration Jobs Queued: ${queuedCount || 0}`);
  console.log(`Articles Published: ${publishedCount || 0}`);
  console.log("=".repeat(80));
}

processExtractedPipeline()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
