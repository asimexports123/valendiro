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

const validationTopics = JSON.parse(readFileSync(resolve(__dirname, "phase20-validation-topics.json"), "utf-8"));

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkFactTags() {
  console.log("=== Checking Fact Tags ===\n");
  
  const { data: packages } = await supabase
    .from("knowledge_packages")
    .select("id, slug")
    .eq("slug", "python-programming-fundamentals")
    .eq("status", "ready")
    .limit(1);
  
  if (!packages || packages.length === 0) {
    console.log("No package found");
    return;
  }
  
  const packageId = packages[0].id;
  
  const { data: facts } = await supabase
    .from("knowledge_facts")
    .select("id, statement, tags, fact_type, created_at")
    .eq("package_id", packageId)
    .order("created_at", { ascending: false })
    .limit(10);
  
  console.log(`Package: ${packages[0].slug}`);
  console.log(`Package ID: ${packageId}`);
  console.log(`Total facts shown: ${facts?.length || 0}\n`);
  
  for (const fact of facts || []) {
    console.log(`Fact ID: ${fact.id}`);
    console.log(`Type: ${fact.fact_type}`);
    console.log(`Tags: ${JSON.stringify(fact.tags)}`);
    console.log(`Statement: ${fact.statement.substring(0, 100)}...`);
    console.log();
  }
}

checkFactTags().catch(console.error);
