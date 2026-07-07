/**
 * Re-process discovered content with improved knowledge extraction
 */

import { createAdminClient } from "../lib/supabase/admin";
import { processPendingExtraction } from "../services/discovery/knowledgeExtractionService";

const supabase = createAdminClient();

async function reprocessContent() {
  console.log("Re-processing discovered content with improved knowledge extraction...");

  // Update all pending content to processing status so they get re-processed
  const { data: pendingContent } = await supabase
    .from("discovered_content")
    .select("*")
    .eq("status", "pending")
    .limit(100);

  if (pendingContent && pendingContent.length > 0) {
    console.log(`Found ${pendingContent.length} pending items to re-process`);
    
    for (const content of pendingContent) {
      await supabase
        .from("discovered_content")
        .update({ status: "deduplicated" })
        .eq("id", content.id);
    }
  }

  // Run knowledge extraction
  const result = await processPendingExtraction();
  
  console.log(`\nExtraction Results:`);
  console.log(`✓ Processed: ${result.processed}`);
  console.log(`✓ Nodes Created: ${result.nodesCreated}`);
  console.log(`✓ Edges Created: ${result.edgesCreated}`);

  // Check database for evidence
  const { count: nodesCount } = await supabase
    .from("knowledge_graph_nodes")
    .select("id", { count: "exact", head: true });
  
  const { count: edgesCount } = await supabase
    .from("knowledge_graph_edges")
    .select("id", { count: "exact", head: true });

  console.log(`\nDatabase Evidence:`);
  console.log(`✓ Knowledge Graph Nodes: ${nodesCount || 0}`);
  console.log(`✓ Knowledge Graph Edges: ${edgesCount || 0}`);
}

reprocessContent()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
