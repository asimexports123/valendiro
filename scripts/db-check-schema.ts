import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

const envPath = resolve(__dirname, "../.env.local");
const envContent = readFileSync(envPath, "utf-8");
envContent.split("\n").forEach((line) => {
  const [key, ...values] = line.split("=");
  if (key && values.length > 0) {
    process.env[key] = values.join("=");
  }
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchemas() {
  console.log("=== Database Schema Investigation ===\n");

  // Check what tables exist
  console.log("=== CHECKING TABLE STRUCTURES ===\n");

  // Topics
  console.log("--- TOPICS table ---");
  const { data: topicsColumns, error: topicsError } = await supabase
    .from("topics")
    .select("*")
    .limit(1);
  
  if (topicsError) {
    console.error("Error:", topicsError);
  } else if (topicsColumns && topicsColumns.length > 0) {
    console.log("Columns:", Object.keys(topicsColumns[0]));
    console.log("Sample:", topicsColumns[0]);
  } else {
    console.log("No data in topics table");
  }

  // Knowledge Packages
  console.log("\n--- KNOWLEDGE_PACKAGES table ---");
  const { data: packageColumns, error: packageError } = await supabase
    .from("knowledge_packages")
    .select("*")
    .limit(1);
  
  if (packageError) {
    console.error("Error:", packageError);
  } else if (packageColumns && packageColumns.length > 0) {
    console.log("Columns:", Object.keys(packageColumns[0]));
    console.log("Sample:", packageColumns[0]);
  }

  // Rendered Outputs
  console.log("\n--- RENDERED_OUTPUTS table ---");
  const { data: renderedColumns, error: renderedError } = await supabase
    .from("rendered_outputs")
    .select("*")
    .limit(1);
  
  if (renderedError) {
    console.error("Error:", renderedError);
  } else if (renderedColumns && renderedColumns.length > 0) {
    console.log("Columns:", Object.keys(renderedColumns[0]));
  }

  // Get actual counts
  console.log("\n=== TABLE COUNTS ===");
  const { count: topicsCount } = await supabase.from("topics").select("*", { count: "exact", head: true });
  const { count: packagesCount } = await supabase.from("knowledge_packages").select("*", { count: "exact", head: true });
  const { count: factsCount } = await supabase.from("knowledge_facts").select("*", { count: "exact", head: true });
  const { count: renderedCount } = await supabase.from("rendered_outputs").select("*", { count: "exact", head: true });
  
  console.log(`Topics: ${topicsCount || 0}`);
  console.log(`Knowledge Packages: ${packagesCount || 0}`);
  console.log(`Knowledge Facts: ${factsCount || 0}`);
  console.log(`Rendered Outputs: ${renderedCount || 0}`);

  // Check which rendered outputs have null package_ids
  console.log("\n=== CHECKING NULL PACKAGE_IDS IN RENDERED_OUTPUTS ===");
  const { data: nullPackageIds } = await supabase
    .from("rendered_outputs")
    .select("id, package_id")
    .is("package_id", null)
    .limit(10);
  
  console.log(`Rendered outputs with null package_id: ${nullPackageIds?.length || 0}`);
  (nullPackageIds || []).forEach((r: any) => {
    console.log(`  ID: ${r.id}, Package ID: ${r.package_id}`);
  });

  // Check all package_ids in rendered outputs
  console.log("\n=== ALL PACKAGE_IDS IN RENDERED_OUTPUTS ===");
  const { data: allRendered } = await supabase
    .from("rendered_outputs")
    .select("package_id");
  
  const uniquePackageIds = new Set((allRendered || []).map((r: any) => r.package_id).filter(Boolean));
  console.log(`Unique package_ids in rendered_outputs: ${uniquePackageIds.size}`);

  // Check all package_ids in knowledge_packages
  console.log("\n=== ALL PACKAGE_IDS IN KNOWLEDGE_PACKAGES ===");
  const { data: allPackages } = await supabase
    .from("knowledge_packages")
    .select("id, slug");
  
  const knowledgePackageIds = new Set((allPackages || []).map((p: any) => p.id));
  console.log(`Unique package_ids in knowledge_packages: ${knowledgePackageIds.size}`);

  // Find the mismatch
  console.log("\n=== PACKAGE_ID MISMATCH ANALYSIS ===");
  const missingInPackages = Array.from(uniquePackageIds).filter((id: any) => !knowledgePackageIds.has(id));
  console.log(`Package_ids in rendered_outputs but NOT in knowledge_packages: ${missingInPackages.length}`);
  missingInPackages.slice(0, 10).forEach((id: any) => {
    console.log(`  ${id}`);
  });

  const missingInRendered = Array.from(knowledgePackageIds).filter((id: any) => !uniquePackageIds.has(id));
  console.log(`\nPackage_ids in knowledge_packages but NOT in rendered_outputs: ${missingInRendered.length}`);
  missingInRendered.slice(0, 10).forEach((id: any) => {
    const pkg = (allPackages || []).find((p: any) => p.id === id);
    console.log(`  ${id} (${pkg?.slug})`);
  });
}

checkSchemas().catch(console.error);
