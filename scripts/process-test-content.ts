/**
 * Process test content for knowledge extraction
 */

import { createAdminClient } from "../lib/supabase/admin";
import { processPendingExtraction } from "../services/discovery/knowledgeExtractionService";

const supabase = createAdminClient();

async function processTestContent() {
  console.log("Processing test content for knowledge extraction...");

  // Update test content to deduplicated status
  const { data: testContent } = await supabase
    .from("discovered_content")
    .select("*")
    .in("title", [
      "JavaScript Async/Await: A Complete Guide",
      "React Hooks: useState and useEffect Explained",
      "Node.js Event Loop Explained",
      "Docker Containerization for Developers",
      "TypeScript for JavaScript Developers"
    ]);

  if (!testContent || testContent.length === 0) {
    console.log("Test content not found");
    return;
  }

  console.log(`Found ${testContent.length} test articles`);

  for (const content of testContent) {
    await supabase
      .from("discovered_content")
      .update({ status: "deduplicated" })
      .eq("id", content.id);
    console.log(`✓ Updated status for: ${content.title}`);
  }

  // Run knowledge extraction
  console.log("\nRunning knowledge extraction...");
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

  // Show sample nodes
  const { data: sampleNodes } = await supabase
    .from("knowledge_graph_nodes")
    .select("*")
    .limit(10);

  if (sampleNodes && sampleNodes.length > 0) {
    console.log(`\nSample Knowledge Graph Nodes:`);
    sampleNodes.forEach(node => {
      console.log(`  - ${node.name} (${node.node_type})`);
    });
  }
}

processTestContent()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
