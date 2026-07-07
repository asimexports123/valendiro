/**
 * Check knowledge graph database schema
 */

import { createAdminClient } from "../lib/supabase/admin";

const supabase = createAdminClient();

async function checkSchema() {
  console.log("Checking knowledge graph tables...");
  console.log();

  // Check knowledge graph nodes
  const { data: nodes, error: nodesError } = await supabase
    .from("knowledge_graph_nodes")
    .select("*")
    .limit(5);

  if (nodesError) {
    console.log("Knowledge graph nodes table error:", nodesError.message);
  } else {
    console.log("Knowledge graph nodes table exists");
    if (nodes && nodes.length > 0) {
      console.log("Sample node:", nodes[0]);
    }
  }
  console.log();

  // Check knowledge graph edges
  const { data: edges, error: edgesError } = await supabase
    .from("knowledge_graph_edges")
    .select("*")
    .limit(5);

  if (edgesError) {
    console.log("Knowledge graph edges table error:", edgesError.message);
  } else {
    console.log("Knowledge graph edges table exists");
    if (edges && edges.length > 0) {
      console.log("Sample edge:", edges[0]);
    }
  }
  console.log();

  // Check if we need to create entity tables
  console.log("Checking if entity tables exist...");
  const { data: entities, error: entitiesError } = await supabase
    .from("entities")
    .select("*")
    .limit(1);

  if (entitiesError) {
    console.log("Entities table does not exist - need to create");
  } else {
    console.log("Entities table exists");
    if (entities && entities.length > 0) {
      console.log("Sample entity:", entities[0]);
    }
  }
}

checkSchema()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
