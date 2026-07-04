/**
 * Debug script to check database schema and facts
 */

import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

import { createAdminClient } from "../lib/supabase/admin";

async function main() {
  const supabase = createAdminClient();

  console.log("=== CHECKING ARTICLES TABLE ===");
  const { data: articles, error: articlesError } = await supabase
    .from("articles")
    .select("*")
    .limit(1);

  if (articlesError) {
    console.log(`Error: ${articlesError.message}`);
  } else if (articles && articles.length > 0) {
    console.log(`Articles table columns: ${Object.keys(articles[0]).join(", ")}`);
  } else {
    console.log("No articles found");
  }

  console.log("\n=== CHECKING KNOWLEDGE FACTS TABLE ===");
  const { data: facts, error: factsError } = await supabase
    .from("knowledge_facts")
    .select("*")
    .limit(1);

  if (factsError) {
    console.log(`Error: ${factsError.message}`);
  } else if (facts && facts.length > 0) {
    console.log(`Knowledge facts table columns: ${Object.keys(facts[0]).join(", ")}`);
  } else {
    console.log("No facts found");
  }

  console.log("\n=== CHECKING PYTHON PACKAGE FACTS ===");
  const { data: pythonPkg } = await supabase
    .from("knowledge_packages")
    .select("*")
    .ilike("slug", "%python%")
    .single();

  if (pythonPkg) {
    console.log(`Python package ID: ${pythonPkg.id}`);
    const { data: pythonFacts } = await supabase
      .from("knowledge_facts")
      .select("*")
      .eq("package_id", pythonPkg.id);
    console.log(`Python facts count: ${pythonFacts?.length || 0}`);
  }
}

main().catch(console.error);
