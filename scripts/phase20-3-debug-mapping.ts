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

async function debugMapping() {
  console.log("=== Debug Package Mapping ===\n");

  const { data: outputs } = await supabase
    .from("rendered_outputs")
    .select("id, package_id")
    .neq("status", "failed")
    .eq("output_format", "html")
    .limit(5);

  const { data: packages } = await supabase
    .from("knowledge_packages")
    .select("id, slug")
    .limit(10);

  console.log("Rendered Outputs:");
  (outputs || []).forEach((o: any) => {
    console.log(`  Package ID: ${o.package_id}`);
  });

  console.log("\nKnowledge Packages:");
  (packages || []).forEach((p: any) => {
    console.log(`  ID: ${p.id}, Slug: ${p.slug}`);
  });

  // Check mapping
  const packageIds = new Set((packages || []).map((p: any) => p.id));
  console.log("\nMapping Check:");
  (outputs || []).forEach((o: any) => {
    console.log(`  Output package_id ${o.package_id} exists in packages: ${packageIds.has(o.package_id)}`);
  });
}

debugMapping().catch(console.error);
