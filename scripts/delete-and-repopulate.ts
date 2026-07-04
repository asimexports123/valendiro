/**
 * Delete existing packages and repopulate with fresh facts
 */

import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(supabaseUrl, supabaseKey);

const TOPICS = [
  "python-programming-fundamentals",
  "git-version-control",
  "investing-basics",
  "data-structures",
];

async function deleteAndRepopulate() {
  for (const slug of TOPICS) {
    console.log(`\n=== ${slug} ===`);
    
    // Get package ID
    const { data: pkg } = await supabase
      .from("knowledge_packages")
      .select("id, topic_id")
      .eq("slug", slug)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (!pkg) {
      console.log("No package found");
      continue;
    }
    
    console.log(`Deleting package ${pkg.id}`);
    
    // Delete facts first
    const { error: deleteFactsError } = await supabase
      .from("knowledge_facts")
      .delete()
      .eq("package_id", pkg.id);
    
    if (deleteFactsError) {
      console.log(`❌ Failed to delete facts: ${deleteFactsError.message}`);
    } else {
      console.log("✓ Deleted facts");
    }
    
    // Delete package
    const { error: deletePkgError } = await supabase
      .from("knowledge_packages")
      .delete()
      .eq("id", pkg.id);
    
    if (deletePkgError) {
      console.log(`❌ Failed to delete package: ${deletePkgError.message}`);
    } else {
      console.log("✓ Deleted package");
    }
  }
  
  console.log("\n=== Running population ===");
  
  // Run the population script
  const { execSync } = require("child_process");
  try {
    execSync("npx tsx scripts/direct-populate-packages.ts", { stdio: "inherit", cwd: process.cwd() });
  } catch (error) {
    console.error("Population failed:", error);
    process.exit(1);
  }
}

deleteAndRepopulate()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Failed:", error);
    process.exit(1);
  });
