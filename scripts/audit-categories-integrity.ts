/**
 * Category Data Integrity Audit
 * Investigate why categories table appears empty while topics contain category_id values
 */

import { createAdminClient } from "../lib/supabase/admin";

async function main() {
  const sb = createAdminClient();

  console.log("=== 1. CHECK CATEGORIES TABLE COUNT ===");
  const { count: categoriesCount } = await sb
    .from("categories")
    .select("*", { count: "exact", head: true });
  console.log(`Categories table count: ${categoriesCount}`);

  console.log("\n=== 2. LIST ALL CATEGORIES (IF ANY) ===");
  const { data: allCategories } = await sb
    .from("categories")
    .select("id, slug, name, created_at")
    .limit(50);
  console.table(allCategories);

  console.log("\n=== 3. CHECK TOPICS WITH CATEGORY_ID ===");
  const { data: topicsWithCategory } = await sb
    .from("topics")
    .select("id, slug, category_id, subcategory_id")
    .not("category_id", "is", null)
    .limit(20);
  console.table(topicsWithCategory);

  console.log("\n=== 4. CHECK ORPHANED category_id VALUES IN TOPICS ===");
  if (topicsWithCategory && topicsWithCategory.length > 0) {
    const categoryIds = [...new Set(topicsWithCategory.map(t => t.category_id).filter(Boolean))];
    console.log(`Found ${categoryIds.length} unique category_id values in topics:`, categoryIds);
    
    for (const catId of categoryIds) {
      const { data: category } = await sb
        .from("categories")
        .select("id, slug, name")
        .eq("id", catId)
        .maybeSingle();
      console.log(`Category ID ${catId} exists in categories table: ${category ? 'YES' : 'NO'}`);
      if (category) {
        console.log(`  -> ${category.slug}: ${category.name}`);
      }
    }
  }

  console.log("\n=== 5. CHECK SUBCATEGORIES TABLE COUNT ===");
  const { count: subcategoriesCount } = await sb
    .from("subcategories")
    .select("*", { count: "exact", head: true });
  console.log(`Subcategories table count: ${subcategoriesCount}`);

  console.log("\n=== 6. LIST ALL SUBCATEGORIES (IF ANY) ===");
  const { data: allSubcategories } = await sb
    .from("subcategories")
    .select("id, slug, name, category_id")
    .limit(50);
  console.table(allSubcategories);

  console.log("\n=== 7. CHECK topic_subcategories TABLE COUNT ===");
  const { count: topicSubcategoriesCount } = await sb
    .from("topic_subcategories")
    .select("*", { count: "exact", head: true });
  console.log(`topic_subcategories table count: ${topicSubcategoriesCount}`);

  console.log("\n=== 8. CHECK IF category_id VALUES EXIST IN SUBCATEGORIES ===");
  if (topicsWithCategory && topicsWithCategory.length > 0) {
    const categoryIds = [...new Set(topicsWithCategory.map(t => t.category_id).filter(Boolean))];
    for (const catId of categoryIds) {
      const { data: subcategory } = await sb
        .from("subcategories")
        .select("id, slug, name")
        .eq("id", catId)
        .maybeSingle();
      console.log(`Category ID ${catId} exists in subcategories table: ${subcategory ? 'YES' : 'NO'}`);
      if (subcategory) {
        console.log(`  -> ${subcategory.slug}: ${subcategory.name}`);
      }
    }
  }

  console.log("\n=== 9. CHECK production topics specifically ===");
  const productionSlugs = ["nodejs-cluster", "family-vacations", "vendor-management"];
  for (const slug of productionSlugs) {
    const { data: topic } = await sb
      .from("topics")
      .select("id, slug, category_id, subcategory_id")
      .eq("slug", slug)
      .single();
    console.log(`\n${slug}:`);
    console.log(`  topic_id: ${topic?.id}`);
    console.log(`  category_id: ${topic?.category_id}`);
    console.log(`  subcategory_id: ${topic?.subcategory_id}`);
    
    if (topic?.category_id) {
      const { data: category } = await sb
        .from("categories")
        .select("id, slug, name")
        .eq("id", topic.category_id)
        .maybeSingle();
      console.log(`  category exists: ${category ? 'YES' : 'NO'}`);
      if (category) console.log(`  category: ${category.slug}`);
      
      const { data: subcategory } = await sb
        .from("subcategories")
        .select("id, slug, name")
        .eq("id", topic.category_id)
        .maybeSingle();
      console.log(`  subcategory exists: ${subcategory ? 'YES' : 'NO'}`);
      if (subcategory) console.log(`  subcategory: ${subcategory.slug}`);
    }
  }
}

main().catch(console.error);
