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

async function analyzeRenderedOutputs() {
  console.log("=== Phase 20: Analyzing Rendered Outputs ===\n");
  
  const { data: rendered, error } = await supabase
    .from("rendered_outputs")
    .select("*")
    .limit(3);
  
  if (error) {
    console.error("Error fetching rendered outputs:", error);
    return;
  }
  
  console.log(`Fetched ${rendered.length} sample rendered outputs\n`);
  
  rendered.forEach((item: any, i: number) => {
    console.log(`--- Rendered Output ${i + 1} ---`);
    console.log("ID:", item.id);
    console.log("Topic ID:", item.topic_id);
    console.log("Fields:", Object.keys(item).join(", "));
    console.log("Content length:", (item.content || "").length);
    console.log("Content preview:", (item.content || "").substring(0, 300));
    console.log("");
  });
  
  const fs = require("fs");
  fs.writeFileSync(
    resolve(__dirname, "phase20-rendered-analysis.json"),
    JSON.stringify({
      timestamp: new Date().toISOString(),
      sampleRendered: rendered,
    }, null, 2)
  );
  
  console.log("Analysis saved to: phase20-rendered-analysis.json");
}

analyzeRenderedOutputs().catch(console.error);
