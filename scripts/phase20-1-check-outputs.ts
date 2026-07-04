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

async function checkOutputs() {
  console.log("=== Checking rendered_outputs structure ===\n");
  
  const { data: outputs } = await supabase
    .from("rendered_outputs")
    .select("*")
    .eq("output_format", "html")
    .neq("status", "failed")
    .order("created_at", { ascending: false })
    .limit(1);
  
  if (!outputs || outputs.length === 0) {
    console.log("No outputs found");
    return;
  }
  
  const output = outputs[0];
  console.log("Output keys:", Object.keys(output));
  console.log("\nquality_score type:", typeof output.quality_score);
  console.log("quality_score value:", JSON.stringify(output.quality_score, null, 2));
}

checkOutputs().catch(console.error);
