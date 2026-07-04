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

async function investigateDataFlow() {
  console.log("=== Database Integrity Investigation ===\n");
  console.log("Tracing: Topic → Knowledge Package → Knowledge Facts → Rendered Output → Topic Translation → Live Page\n");

  // Stage 1: Topics
  console.log("=== STAGE 1: TOPICS ===");
  const { data: topics, error: topicsError } = await supabase
    .from("topics")
    .select("id, slug, title")
    .limit(10);
  
  if (topicsError) console.error("Topics error:", topicsError);
  console.log(`Topics count: ${topics?.length || 0}`);
  (topics || []).slice(0, 5).forEach((t: any) => {
    console.log(`  ID: ${t.id}, Slug: ${t.slug}, Title: ${t.title}`);
  });

  // Stage 2: Knowledge Packages
  console.log("\n=== STAGE 2: KNOWLEDGE PACKAGES ===");
  const { data: packages, error: packagesError } = await supabase
    .from("knowledge_packages")
    .select("id, slug, topic_id, knowledge_hash")
    .limit(10);
  
  if (packagesError) console.error("Packages error:", packagesError);
  console.log(`Packages count: ${packages?.length || 0}`);
  (packages || []).slice(0, 5).forEach((p: any) => {
    console.log(`  ID: ${p.id}, Slug: ${p.slug}, Topic ID: ${p.topic_id}, Hash: ${p.knowledge_hash}`);
  });

  // Check foreign key: topics.id → knowledge_packages.topic_id
  console.log("\n--- Checking topics.id → knowledge_packages.topic_id ---");
  const topicIds = new Set((topics || []).map((t: any) => t.id));
  const packageTopicIds = new Set((packages || []).map((p: any) => p.topic_id));
  const orphanPackages = (packages || []).filter((p: any) => !topicIds.has(p.topic_id));
  console.log(`Orphan packages (topic_id not in topics): ${orphanPackages.length}`);
  orphanPackages.slice(0, 5).forEach((p: any) => {
    console.log(`  Package ${p.slug} references non-existent topic_id: ${p.topic_id}`);
  });

  // Stage 3: Knowledge Facts
  console.log("\n=== STAGE 3: KNOWLEDGE FACTS ===");
  const { data: facts, error: factsError } = await supabase
    .from("knowledge_facts")
    .select("id, package_id")
    .limit(10);
  
  if (factsError) console.error("Facts error:", factsError);
  console.log(`Facts count: ${facts?.length || 0}`);

  // Check foreign key: knowledge_packages.id → knowledge_facts.package_id
  console.log("--- Checking knowledge_packages.id → knowledge_facts.package_id ---");
  const packageIds = new Set((packages || []).map((p: any) => p.id));
  const orphanFacts = (facts || []).filter((f: any) => !packageIds.has(f.package_id));
  console.log(`Orphan facts (package_id not in knowledge_packages): ${orphanFacts.length}`);

  // Stage 4: Rendered Outputs
  console.log("\n=== STAGE 4: RENDERED OUTPUTS ===");
  const { data: renderedOutputs, error: renderedError } = await supabase
    .from("rendered_outputs")
    .select("id, package_id, status, output_format")
    .limit(10);
  
  if (renderedError) console.error("Rendered outputs error:", renderedError);
  console.log(`Rendered outputs count: ${renderedOutputs?.length || 0}`);
  (renderedOutputs || []).slice(0, 5).forEach((r: any) => {
    console.log(`  ID: ${r.id}, Package ID: ${r.package_id}, Status: ${r.status}, Format: ${r.output_format}`);
  });

  // Check foreign key: knowledge_packages.id → rendered_outputs.package_id (THE PROBLEM)
  console.log("\n--- Checking knowledge_packages.id → rendered_outputs.package_id ---");
  const renderedPackageIds = new Set((renderedOutputs || []).map((r: any) => r.package_id));
  const orphanRendered = (renderedOutputs || []).filter((r: any) => !packageIds.has(r.package_id));
  console.log(`Orphan rendered outputs (package_id not in knowledge_packages): ${orphanRendered.length}`);
  orphanRendered.slice(0, 10).forEach((r: any) => {
    console.log(`  Rendered output ${r.id} references non-existent package_id: ${r.package_id}`);
  });

  // Stage 5: Topic Translations
  console.log("\n=== STAGE 5: TOPIC TRANSLATIONS ===");
  const { data: translations, error: translationsError } = await supabase
    .from("topic_translations")
    .select("id, topic_id, slug")
    .limit(10);
  
  if (translationsError) console.error("Translations error:", translationsError);
  console.log(`Translations count: ${translations?.length || 0}`);

  // Check foreign key: topics.id → topic_translations.topic_id
  console.log("--- Checking topics.id → topic_translations.topic_id ---");
  const translationTopicIds = new Set((translations || []).map((t: any) => t.topic_id));
  const orphanTranslations = (translations || []).filter((t: any) => !topicIds.has(t.topic_id));
  console.log(`Orphan translations (topic_id not in topics): ${orphanTranslations.length}`);

  // Summary Statistics
  console.log("\n=== REFERENTIAL INTEGRITY SUMMARY ===");
  console.log(`Topics: ${topics?.length || 0}`);
  console.log(`Knowledge Packages: ${packages?.length || 0}`);
  console.log(`Knowledge Facts: ${facts?.length || 0}`);
  console.log(`Rendered Outputs: ${renderedOutputs?.length || 0}`);
  console.log(`Topic Translations: ${translations?.length || 0}`);
  console.log(`\nOrphan Records:`);
  console.log(`  Packages without valid topic_id: ${orphanPackages.length}`);
  console.log(`  Facts without valid package_id: ${orphanFacts.length}`);
  console.log(`  Rendered outputs without valid package_id: ${orphanRendered.length} ⚠️ CRITICAL`);
  console.log(`  Translations without valid topic_id: ${orphanTranslations.length}`);

  // Investigate the mismatched rendered outputs
  console.log("\n=== INVESTIGATING RENDERED OUTPUT MISMATCH ===");
  const allRenderedOutputs = await supabase
    .from("rendered_outputs")
    .select("id, package_id, created_at");
  
  const allPackages = await supabase
    .from("knowledge_packages")
    .select("id, slug, created_at");

  console.log(`\nTotal rendered outputs: ${allRenderedOutputs.data?.length || 0}`);
  console.log(`Total knowledge packages: ${allPackages.data?.length || 0}`);
  
  // Find which rendered outputs have matching packages
  const validRendered = (allRenderedOutputs.data || []).filter((r: any) => 
    packageIds.has(r.package_id)
  );
  console.log(`Valid rendered outputs: ${validRendered.length}`);
  console.log(`Invalid rendered outputs: ${orphanRendered.length}`);

  // Check if there's a pattern in the invalid package_ids
  console.log("\n--- Sample invalid package_ids from rendered outputs ---");
  const invalidPackageIds = new Set(orphanRendered.map((r: any) => r.package_id));
  console.log(`Unique invalid package_ids: ${invalidPackageIds.size}`);
  Array.from(invalidPackageIds).slice(0, 10).forEach((id: any) => {
    console.log(`  ${id}`);
  });

  // Check if any knowledge packages were deleted
  console.log("\n--- Checking for deleted packages ---");
  const packageSlugs = new Set((packages || []).map((p: any) => p.slug));
  console.log(`Current package slugs: ${packageSlugs.size}`);
}

investigateDataFlow().catch(console.error);
