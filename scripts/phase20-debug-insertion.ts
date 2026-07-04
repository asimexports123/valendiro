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

async function testFactInsertion() {
  console.log("=== Testing Fact Insertion ===\n");
  
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
  console.log("Package ID:", packageId);
  
  const testFact = {
    package_id: packageId,
    statement: "Test core concept: Python is a high-level programming language",
    fact_type: "core_concept",
    confidence: 0.95,
    domain: "educational",
    scope: "topic",
    tags: ["test"],
  };
  
  console.log("\nInserting test fact:");
  console.log(JSON.stringify(testFact, null, 2));
  
  const { data, error } = await supabase
    .from("knowledge_facts")
    .insert(testFact)
    .select();
  
  if (error) {
    console.error("\nInsertion failed:", error);
  } else {
    console.log("\nInsertion successful!");
    console.log("Inserted fact:", data);
  }
}

testFactInsertion().catch(console.error);
