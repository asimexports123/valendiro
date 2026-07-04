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
  console.log("=== Checking Rendered Outputs ===\n");

  const { data: outputs, error } = await supabase
    .from("rendered_outputs")
    .select("id, package_id, status, output_format")
    .limit(10);

  if (error) {
    console.error("Error:", error);
    return;
  }

  console.log(`Found ${outputs?.length || 0} rendered outputs`);
  (outputs || []).forEach((o: any) => {
    console.log(`  ID: ${o.id}, Package: ${o.package_id}, Status: ${o.status}, Format: ${o.output_format}`);
  });

  // Check knowledge packages
  const { data: packages } = await supabase
    .from("knowledge_packages")
    .select("id, slug")
    .limit(10);

  console.log(`\nFound ${packages?.length || 0} knowledge packages`);
  (packages || []).forEach((p: any) => {
    console.log(`  ID: ${p.id}, Slug: ${p.slug}`);
  });
}

checkOutputs().catch(console.error);
