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

async function checkCitations() {
  console.log("=== Checking Citations for Validation Topics ===\n");
  
  let withCitations = 0;
  let withoutCitations = 0;
  
  for (const topic of validationTopics.selectedTopics.slice(0, 5)) {
    const { data: packages } = await supabase
      .from("knowledge_packages")
      .select("id")
      .eq("topic_id", topic.id)
      .eq("status", "ready")
      .limit(1);
    
    if (!packages || packages.length === 0) {
      console.log(`${topic.slug}: No package`);
      continue;
    }
    
    const packageId = packages[0].id;
    
    const { data: facts } = await supabase
      .from("knowledge_facts")
      .select("id")
      .eq("package_id", packageId);
    
    const { data: citations } = await supabase
      .from("knowledge_citations")
      .select("id")
      .eq("package_id", packageId);
    
    console.log(`${topic.slug}:`);
    console.log(`  Facts: ${facts?.length || 0}`);
    console.log(`  Citations: ${citations?.length || 0}`);
    
    if (citations && citations.length > 0) {
      withCitations++;
    } else {
      withoutCitations++;
    }
  }
  
  console.log(`\n=== SUMMARY ===`);
  console.log(`With citations: ${withCitations}`);
  console.log(`Without citations: ${withoutCitations}`);
}

checkCitations().catch(console.error);
