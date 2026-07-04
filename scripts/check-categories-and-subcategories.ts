import { readFileSync } from "fs";
import { resolve } from "path";

const envPath = resolve(process.cwd(), ".env.local");
const envContent = readFileSync(envPath, "utf-8");
envContent.split("\n").forEach((line) => {
  const [key, ...values] = line.split("=");
  if (key && values.length > 0) {
    process.env[key] = values.join("=");
  }
});

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function checkCategoriesAndSubcategories() {
  // Get all categories
  const catsRes = await fetch(
    `${SUPABASE_URL}/rest/v1/categories?select=id,slug,name&limit=20`,
    {
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    }
  );
  const catsData = await catsRes.json();
  const categories = Array.isArray(catsData) ? catsData : [];

  console.log("=== CATEGORIES ===");
  for (const cat of categories) {
    // Get subcategories for this category
    const subRes = await fetch(
      `${SUPABASE_URL}/rest/v1/subcategories?select=id,slug&category_id=eq.${cat.id}`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );
    const subcategories = await subRes.json();
    
    console.log(`\n${cat.name} (${cat.slug}): ${subcategories.length} subcategories`);
    subcategories.forEach(sub => {
      console.log(`  - ${sub.slug}`);
    });
  }
}

checkCategoriesAndSubcategories().catch(console.error);
