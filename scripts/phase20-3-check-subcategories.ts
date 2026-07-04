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

async function checkSubcategories() {
  console.log("=== Checking Subcategory Values ===\n");

  const { data: packages } = await supabase
    .from("knowledge_packages")
    .select("slug, subcategory_slug")
    .limit(30);

  const subcategories = new Set<string>();
  (packages || []).forEach((p: any) => {
    if (p.subcategory_slug) {
      subcategories.add(p.subcategory_slug);
    }
  });

  console.log("Unique subcategories found:");
  subcategories.forEach(s => console.log(`  - ${s}`));

  console.log(`\nTotal unique subcategories: ${subcategories.size}`);
}

checkSubcategories().catch(console.error);
