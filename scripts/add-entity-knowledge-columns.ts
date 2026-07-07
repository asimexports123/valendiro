/**
 * Add entity knowledge columns to knowledge_graph_nodes table
 */

import { createAdminClient } from "../lib/supabase/admin";

const supabase = createAdminClient();

async function addEntityKnowledgeColumns() {
  console.log("=" + "=".repeat(79));
  console.log("ADD ENTITY KNOWLEDGE COLUMNS TO knowledge_graph_nodes");
  console.log("=".repeat(80));
  console.log();

  // Since Supabase client doesn't support direct SQL execution,
  // we'll use the RPC function to execute the ALTER TABLE statements
  const alterSQL = `
    ALTER TABLE knowledge_graph_nodes 
    ADD COLUMN IF NOT EXISTS entity_knowledge JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS knowledge_version INTEGER DEFAULT 1,
    ADD COLUMN IF NOT EXISTS entity_fact_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS entity_source_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_knowledge_update TIMESTAMPTZ DEFAULT NOW();
  `;

  console.log("STEP 1: Execute ALTER TABLE via SQL Editor");
  console.log("-".repeat(80));
  console.log("Please execute this SQL in Supabase SQL Editor:");
  console.log();
  console.log(alterSQL);
  console.log();

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
    
    const hasEntityKnowledge = columns.includes('entity_knowledge');
    const hasKnowledgeVersion = columns.includes('knowledge_version');
    const hasEntityFactCount = columns.includes('entity_fact_count');
    const hasEntitySourceCount = columns.includes('entity_source_count');
    const hasLastKnowledgeUpdate = columns.includes('last_knowledge_update');
    
    console.log();
    console.log("Entity knowledge columns status:");
    console.log(`  entity_knowledge: ${hasEntityKnowledge ? '✓ EXISTS' : '✗ MISSING'}`);
    console.log(`  knowledge_version: ${hasKnowledgeVersion ? '✓ EXISTS' : '✗ MISSING'}`);
    console.log(`  entity_fact_count: ${hasEntityFactCount ? '✓ EXISTS' : '✗ MISSING'}`);
    console.log(`  entity_source_count: ${hasEntitySourceCount ? '✓ EXISTS' : '✗ MISSING'}`);
    console.log(`  last_knowledge_update: ${hasLastKnowledgeUpdate ? '✓ EXISTS' : '✗ MISSING'}`);
  }

  console.log();
  if (!nodes || nodes.length === 0) {
    console.log("No data in knowledge_graph_nodes table");
  }
}

addEntityKnowledgeColumns()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
