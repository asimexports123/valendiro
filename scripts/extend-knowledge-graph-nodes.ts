/**
 * Extend knowledge_graph_nodes table with entity knowledge fields
 */

import { createAdminClient } from "../lib/supabase/admin";

const supabase = createAdminClient();

async function extendKnowledgeGraphNodes() {
  console.log("=" + "=".repeat(79));
  console.log("EXTEND knowledge_graph_nodes WITH ENTITY KNOWLEDGE FIELDS");
  console.log("=".repeat(80));
  console.log();

  const alterStatements = [
    // Add entity knowledge JSONB column
    `ALTER TABLE knowledge_graph_nodes ADD COLUMN IF NOT EXISTS entity_knowledge JSONB DEFAULT '{}'::jsonb;`,
    // Add knowledge version
    `ALTER TABLE knowledge_graph_nodes ADD COLUMN IF NOT EXISTS knowledge_version INTEGER DEFAULT 1;`,
    // Add entity facts count
    `ALTER TABLE knowledge_graph_nodes ADD COLUMN IF NOT EXISTS entity_fact_count INTEGER DEFAULT 0;`,
    // Add entity sources count
    `ALTER TABLE knowledge_graph_nodes ADD COLUMN IF NOT EXISTS entity_source_count INTEGER DEFAULT 0;`,
    // Add last knowledge update timestamp
    `ALTER TABLE knowledge_graph_nodes ADD COLUMN IF NOT EXISTS last_knowledge_update TIMESTAMPTZ DEFAULT NOW();`,
  ];

  console.log("STEP 1: Execute ALTER TABLE statements");
  console.log("-".repeat(80));
  console.log("Execute these statements in Supabase SQL Editor:");
  console.log();

  for (const sql of alterStatements) {
    console.log(sql);
    console.log();
  }

  console.log("STEP 2: Check current knowledge_graph_nodes structure");
  console.log("-".repeat(80));

  const { data: nodes, error } = await supabase
    .from("knowledge_graph_nodes")
    .select("*")
    .limit(1);

  if (error) {
    console.log("Error:", error.message);
  } else if (nodes && nodes.length > 0) {
    const columns = Object.keys(nodes[0]);
    console.log("Current columns:", columns);
    console.log();
    console.log("Sample row:", JSON.stringify(nodes[0], null, 2));
  }

  console.log();
  console.log("After applying the ALTER statements, the entity knowledge service will use");
  console.log("the extended knowledge_graph_nodes table to store entity knowledge packages.");
}

extendKnowledgeGraphNodes()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
