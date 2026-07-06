import * as dotenv from "dotenv";
import { resolve } from "path";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

async function testFix() {
  const supabase = createAdminClient();

  console.log("=== Test: Get V1 Category IDs ===");
  const V1_CATEGORY_SLUGS = [
    "technology",
    "personal-finance",
    "business",
    "education",
    "health-wellness",
    "home-lifestyle",
    "travel",
  ];

  const { data: categories } = await supabase
    .from("categories")
    .select("id")
    .in("slug", V1_CATEGORY_SLUGS);

  const categoryIds = (categories || []).map((c: any) => c.id);
  console.log(`Found ${categoryIds.length} V1 categories`);

  console.log("\n=== Test: Get topics directly linked to categories ===");
  const { data: directTopics } = categoryIds.length > 0
    ? await supabase.from("topics").select("id, slug").in("category_id", categoryIds).eq("status", "published")
    : { data: [] };
  console.log(`Found ${directTopics?.length || 0} topics directly linked to categories`);

  console.log("\n=== Test: Get subcategories for V1 categories ===");
  const { data: subcategories } = categoryIds.length > 0
    ? await supabase.from("subcategories").select("id").in("category_id", categoryIds)
    : { data: [] };
  const subcategoryIds = (subcategories || []).map((s: any) => s.id);
  console.log(`Found ${subcategoryIds.length} subcategories`);

  console.log("\n=== Test: Get topics linked via subcategories ===");
  const { data: indirectTopics } = subcategoryIds.length > 0
    ? await supabase.from("topics").select("id, slug").in("subcategory_id", subcategoryIds).eq("status", "published")
    : { data: [] };
  console.log(`Found ${indirectTopics?.length || 0} topics linked via subcategories`);

  console.log("\n=== Test: Merge topics ===");
  const topicSet = new Set<string>();
  for (const t of directTopics || []) topicSet.add(t.id);
  for (const t of indirectTopics || []) topicSet.add(t.id);
  console.log(`Total unique topics: ${topicSet.size}`);

  const topicIds = Array.from(topicSet);

  console.log("\n=== Test: Get all articles regardless of status ===");
  const { data: allArticles } = await supabase
    .from("articles")
    .select("id, slug, status, article_translations(title)")
    .in("topic_id", topicIds)
    .eq("article_translations.language_code", "en")
    .limit(10);

  console.log(`Found ${allArticles?.length || 0} total articles (any status)`);
  if (allArticles && allArticles.length > 0) {
    console.log("\nSample articles with status:");
    allArticles.forEach((a: any) => {
      const title = a.article_translations?.[0]?.title || "Untitled";
      console.log(`- ${a.slug}: ${title} (status: ${a.status})`);
    });
  }

  console.log("\n=== Test: Count articles by status ===");
  const { data: statusCounts } = await supabase
    .from("articles")
    .select("status")
    .in("topic_id", topicIds);

  const statusMap: Record<string, number> = {};
  statusCounts?.forEach((a: any) => {
    statusMap[a.status] = (statusMap[a.status] || 0) + 1;
  });
  console.log("Article counts by status:", statusMap);
}

testFix().catch(console.error);
