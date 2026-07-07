/**
 * Check entities for current article
 */

import { createAdminClient } from "../lib/supabase/admin";

const supabase = createAdminClient();

async function checkArticleEntities() {
  const topicId = "6e0c7adb-be18-4dbc-9c46-86b0e59cf89e";
  
  console.log("Checking entities for topic:", topicId);
  console.log();

  // Check knowledge package
  const { data: knowledgePackage, error: kpError } = await supabase
    .from("knowledge_packages")
    .select("*")
    .eq("topic_id", topicId)
    .single();

  if (kpError) {
    console.log("Knowledge package error:", kpError.message);
    return;
  }

  console.log("Knowledge Package:");
  console.log(`  ID: ${knowledgePackage.id}`);
  console.log(`  Fact Count: ${knowledgePackage.fact_count}`);
  console.log(`  Relationship Count: ${knowledgePackage.relationship_count}`);
  console.log();

  // Check entities
  const { data: entities, error: entitiesError } = await supabase
    .from("entities")
    .select("*")
    .limit(20);

  if (entitiesError) {
    console.log("Entities table error:", entitiesError.message);
    return;
  }

  console.log("Entities in database:");
  if (entities && entities.length > 0) {
    entities.forEach((e, i) => {
      console.log(`  ${i + 1}. ${e.name || e.canonical_name || 'Unknown'} (${e.type || 'Unknown'})`);
    });
  }
  console.log();

  // Check knowledge graph nodes
  const { data: nodes, error: nodesError } = await supabase
    .from("knowledge_graph_nodes")
    .select("*")
    .limit(20);

  if (nodesError) {
    console.log("Knowledge graph nodes error:", nodesError.message);
    return;
  }

  console.log("Knowledge Graph Nodes:");
  if (nodes && nodes.length > 0) {
    nodes.forEach((n, i) => {
      console.log(`  ${i + 1}. ${n.name} (${n.node_type}) - ${n.article_count} articles`);
    });
  }
  console.log();

  // Check knowledge graph edges
  const { data: edges, error: edgesError } = await supabase
    .from("knowledge_graph_edges")
    .select("*")
    .limit(20);

  if (edgesError) {
    console.log("Knowledge graph edges error:", edgesError.message);
    return;
  }

  console.log("Knowledge Graph Edges:");
  if (edges && edges.length > 0) {
    edges.forEach((e, i) => {
      console.log(`  ${i + 1}. ${e.source_id} → ${e.target_id} (${e.edge_type})`);
    });
  }
}

checkArticleEntities()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
