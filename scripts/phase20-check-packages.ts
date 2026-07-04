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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function checkKnowledgePackages() {
  console.log("=== Phase 20: Checking Knowledge Packages ===\n");
  
  const { data: packages, error, count } = await supabase
    .from("knowledge_packages")
    .select("*", { count: "exact" });
  
  if (error) {
    console.error("Error:", error);
    return;
  }
  
  console.log(`Total packages: ${count}`);
  console.log(`Sample data: ${packages.length} records\n`);
  
  if (packages.length > 0) {
    console.log("=== SAMPLE PACKAGE ===");
    console.log("Fields:", Object.keys(packages[0]).join(", "));
    console.log("Status values:", [...new Set(packages.map((p: any) => p.status))]);
    console.log("\nSample record:");
    console.log(JSON.stringify(packages[0], null, 2));
  }
}

checkKnowledgePackages().catch(console.error);
