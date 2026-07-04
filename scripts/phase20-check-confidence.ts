import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

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

async function checkConfidenceRange() {
  console.log("=== Checking Confidence Range ===\n");
  
  const { data: facts } = await supabase
    .from("knowledge_facts")
    .select("confidence")
    .limit(10);
  
  if (!facts || facts.length === 0) {
    console.log("No facts found");
    return;
  }
  
  const confidences = facts.map((f: any) => f.confidence);
  console.log("Sample confidence values:", confidences);
  console.log("Min:", Math.min(...confidences));
  console.log("Max:", Math.max(...confidences));
}

checkConfidenceRange().catch(console.error);
