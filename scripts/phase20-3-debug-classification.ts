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

async function debugClassification() {
  console.log("=== Debug Classification ===\n");

  const { data: outputs } = await supabase
    .from("rendered_outputs")
    .select(`
      id,
      package_id,
      knowledge_packages!inner (
        id,
        slug,
        subcategory_slug
      )
    `)
    .neq("status", "failed")
    .eq("output_format", "html")
    .limit(20);

  const { classifyIntent } = await import("../services/renderer/intentClassifier.ts");

  console.log("Sample classifications:\n");
  for (const output of outputs || []) {
    const pkg = Array.isArray(output.knowledge_packages) 
      ? output.knowledge_packages[0] 
      : output.knowledge_packages;
    
    const classification = classifyIntent(
      pkg.slug || "", 
      pkg.subcategory_slug
    );
    
    console.log(`Slug: ${pkg.slug}`);
    console.log(`  Category: ${classification.category}`);
    console.log(`  Intent: ${classification.primaryIntent}`);
    console.log(`  Confidence: ${classification.confidence}`);
    console.log();
  }
}

debugClassification().catch(console.error);
