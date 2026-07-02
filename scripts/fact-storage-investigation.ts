/**
 * Fact Storage Investigation
 * 
 * Determine where facts are actually stored since:
 * - Package says fact_count: 12
 * - Facts table count: null
 * - Package JSON has no facts array
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://diwwvkbztvhwouttajha.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function investigate() {
  console.log("=" .repeat(80));
  console.log("FACT STORAGE INVESTIGATION");
  console.log("=" .repeat(80));

  // Get the ML Basics package
  const { data: pkg } = await supabase
    .from("knowledge_packages")
    .select("*")
    .eq("slug", "machine-learning-basics")
    .single();

  console.log("\nPackage ID:", pkg.id);
  console.log("Fact Count (package field):", pkg.fact_count);
  console.log("Package keys:", Object.keys(pkg));

  // Check all possible fact storage locations
  console.log("\n" + "-".repeat(80));
  console.log("CHECKING POSSIBLE FACT STORAGE LOCATIONS");
  console.log("-".repeat(80));

  // 1. Check if facts are in a nested field
  console.log("\n1. Checking nested fields in package:");
  for (const key of Object.keys(pkg)) {
    const value = pkg[key];
    if (Array.isArray(value)) {
      console.log(`   ${key}: Array with ${value.length} items`);
      if (value.length > 0 && value.length < 20) {
        console.log(`   First item type: ${typeof value[0]}`);
        if (typeof value[0] === 'object') {
          console.log(`   First item keys: ${Object.keys(value[0])}`);
        }
      }
    }
  }

  // 2. Check facts table with different filters
  console.log("\n2. Checking facts table:");
  
  const { data: factsByPackage, error: factsError } = await supabase
    .from("facts")
    .select("*")
    .eq("package_id", pkg.id);

  if (factsError) {
    console.log(`   Error querying facts by package_id: ${factsError.message}`);
  } else {
    console.log(`   Facts by package_id: ${factsByPackage?.length || 0}`);
    if (factsByPackage && factsByPackage.length > 0) {
      console.log(`   Sample fact: ${JSON.stringify(factsByPackage[0], null, 2)}`);
    }
  }

  // 3. Check if facts table uses a different column name
  console.log("\n3. Checking facts table by topic_id:");
  
  const { data: factsByTopic, error: topicError } = await supabase
    .from("facts")
    .select("*")
    .eq("topic_id", pkg.topic_id);

  if (topicError) {
    console.log(`   Error querying facts by topic_id: ${topicError.message}`);
  } else {
    console.log(`   Facts by topic_id: ${factsByTopic?.length || 0}`);
  }

  // 4. Check if there's a different table name
  console.log("\n4. Checking for alternative fact tables:");
  
  const possibleTables = [
    "knowledge_facts",
    "package_facts",
    "topic_facts",
    "fact_records",
    "discovery_facts"
  ];

  for (const tableName of possibleTables) {
    try {
      const { count, error } = await supabase
        .from(tableName)
        .select("*", { count: "exact", head: true });
      
      if (!error) {
        console.log(`   ${tableName}: ${count} records`);
      }
    } catch (e) {
      // Table doesn't exist
    }
  }

  // 5. Check the rendered output document tree
  console.log("\n5. Checking rendered output document_tree:");
  
  const { data: rendered } = await supabase
    .from("rendered_outputs")
    .select("document_tree")
    .eq("package_id", pkg.id)
    .single();

  if (rendered && rendered.document_tree) {
    console.log(`   Document tree exists: YES`);
    console.log(`   Document tree type: ${typeof rendered.document_tree}`);
    console.log(`   Document tree length: ${JSON.stringify(rendered.document_tree).length}`);
    
    // Check if facts are embedded in the document tree
    const treeStr = JSON.stringify(rendered.document_tree);
    if (treeStr.includes("fact") || treeStr.includes("Fact")) {
      console.log(`   Contains 'fact' in document tree: YES`);
    }
  }

  // 6. Check the knowledge_hash to understand data structure
  console.log("\n6. Knowledge Package Analysis:");
  console.log(`   Full package structure:`);
  console.log(JSON.stringify(pkg, null, 2));
}

investigate().catch(console.error);
