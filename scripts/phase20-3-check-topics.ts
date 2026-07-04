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

async function checkTopics() {
  console.log("=== Checking Topics Table ===\n");

  const { data: topics } = await supabase
    .from("topics")
    .select("id, slug, category_slug, subcategory_slug")
    .limit(30);

  console.log("Sample topics:");
  (topics || []).slice(0, 15).forEach((t: any) => {
    console.log(`  ${t.slug}: category=${t.category_slug}, subcategory=${t.subcategory_slug}`);
  });

  const categories = new Set<string>();
  const subcategories = new Set<string>();
  (topics || []).forEach((t: any) => {
    if (t.category_slug) categories.add(t.category_slug);
    if (t.subcategory_slug) subcategories.add(t.subcategory_slug);
  });

  console.log(`\nUnique categories: ${categories.size}`);
  categories.forEach(c => console.log(`  - ${c}`));

  console.log(`\nUnique subcategories: ${subcategories.size}`);
  subcategories.forEach(s => console.log(`  - ${s}`));
}

checkTopics().catch(console.error);
