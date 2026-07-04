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

const rerenderSummary = JSON.parse(readFileSync(resolve(__dirname, "phase20-rerender-summary.json"), "utf-8"));

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDiagnostics() {
  console.log("=== Checking Render Diagnostics ===\n");
  
  for (const result of rerenderSummary.results.slice(0, 3)) {
    if (result.error) continue;
    
    const { data: output } = await supabase
      .from("rendered_outputs")
      .select("diagnostics, quality_score")
      .eq("id", result.outputId)
      .single();
    
    console.log(`${result.topic}:`);
    console.log(`  Quality Score: ${result.qualityScore}`);
    console.log(`  Facts Total: ${output.diagnostics.factsTotal}`);
    console.log(`  Facts Used: ${output.diagnostics.factsUsed}`);
    console.log(`  Missing Knowledge: ${output.diagnostics.missingKnowledge.length}`);
    if (output.diagnostics.missingKnowledge.length > 0) {
      console.log(`  Missing Types: ${output.diagnostics.missingKnowledge.map((m: any) => m.factType).join(", ")}`);
    }
    console.log(`  Warnings: ${output.diagnostics.warnings.join(", ") || "None"}`);
    console.log();
  }
}

checkDiagnostics().catch(console.error);
