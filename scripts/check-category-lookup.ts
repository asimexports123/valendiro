/**
 * Check why category lookup is failing
 */

import { createAdminClient } from "../lib/supabase/admin";

async function main() {
  const sb = createAdminClient();

  // Check all categories
  const { data: categories } = await sb
    .from("categories")
    .select("id, slug, name")
    .limit(20);
  
  console.log("All categories in database:");
  console.table(categories);

  // Check the specific category IDs from the topics
  const categoryIds = [
    '5d04b30f-c557-43a3-b315-dd181aecb3c3', // nodejs-cluster
    'de6223df-9fab-4dcd-acf2-c08f7e643ecf', // family-vacations
    'd5fc8ca2-9890-4e62-af8f-276cdfcd034a', // vendor-management
  ];

  console.log("\n\nLooking up specific category IDs:");
  for (const catId of categoryIds) {
    const { data: category } = await sb
      .from("categories")
      .select("id, slug, name")
      .eq("id", catId)
      .maybeSingle();
    console.log(`Category ID ${catId}:`, category);
  }
}

main().catch(console.error);
