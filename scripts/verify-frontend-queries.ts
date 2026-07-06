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

async function verifyFrontendQueries() {
  const supabase = createAdminClient();

  const V1_CATEGORY_SLUGS = [
    "technology",
    "personal-finance",
    "business",
    "education",
    "health-wellness",
    "home-lifestyle",
    "travel",
  ];

  console.log("=== Test 1: Get V1 Category IDs ===");
  const { data: categories } = await supabase
    .from("categories")
    .select("id")
    .in("slug", V1_CATEGORY_SLUGS);

  const categoryIds = (categories || []).map((c: any) => c.id);
  console.log(`Found ${categoryIds.length} V1 categories`);

  console.log("\n=== Test 2: Get topics directly linked to categories ===");
  const { data: directTopics } = categoryIds.length > 0
    ? await supabase.from("topics").select("id, category_id").in("category_id", categoryIds).eq("status", "published")
    : { data: [] };
  console.log(`Found ${directTopics?.length || 0} topics directly linked to categories`);

  console.log("\n=== Test 3: Get subcategories for V1 categories ===");
  const { data: subcategories } = categoryIds.length > 0
    ? await supabase.from("subcategories").select("id").in("category_id", categoryIds)
    : { data: [] };
  const subcategoryIds = (subcategories || []).map((s: any) => s.id);
  console.log(`Found ${subcategoryIds.length} subcategories`);

  console.log("\n=== Test 4: Get topics linked via subcategories ===");
  const { data: indirectTopics } = subcategoryIds.length > 0
    ? await supabase.from("topics").select("id, subcategory_id, subcategories(category_id)").in("subcategory_id", subcategoryIds).eq("status", "published")
    : { data: [] };
  console.log(`Found ${indirectTopics?.length || 0} topics linked via subcategories`);

  console.log("\n=== Test 5: Merge topics ===");
  const topicSet = new Set<string>();
  const topicCategoryMap: Record<string, string> = {};

  for (const t of directTopics || []) {
    topicSet.add(t.id);
    topicCategoryMap[t.id] = t.category_id;
  }

  for (const t of indirectTopics || []) {
    topicSet.add(t.id);
    const categoryId = t.subcategories?.category_id || t.category_id;
    topicCategoryMap[t.id] = categoryId;
  }

  const v1TopicIds = Array.from(topicSet);
  console.log(`Total unique topics: ${v1TopicIds.length}`);

  console.log("\n=== Test 6: Get articles for these topics ===");
  const { data: articles } = await supabase
    .from("articles")
    .select("id, slug, topic_id, updated_at, article_translations(title, excerpt)")
    .eq("status", "published")
    .in("topic_id", v1TopicIds)
    .eq("article_translations.language_code", "en")
    .order("updated_at", { ascending: false })
    .limit(10);

  console.log(`Found ${articles?.length || 0} published articles`);
  if (articles && articles.length > 0) {
    console.log("\nSample articles:");
    articles.forEach((a: any) => {
      const translation = a.article_translations?.[0];
      console.log(`- ${a.slug}: ${translation?.title || 'Untitled'}`);
    });
  }

  console.log("\n=== Test 7: Get homepage stats ===");
  const subcategoriesCount = subcategoryIds.length;
  const topics = v1TopicIds.length;

  let articleCount = 0;
  if (v1TopicIds.length > 0) {
    const { count } = await supabase
      .from("articles").select("id", { count: "exact", head: true })
      .eq("status", "published").in("topic_id", v1TopicIds);
    articleCount = count ?? 0;
  }

  console.log(`Homepage stats:`);
  console.log(`- Subcategories: ${subcategoriesCount}`);
  console.log(`- Topics: ${topics}`);
  console.log(`- Articles: ${articleCount}`);

  console.log("\n=== Summary ===");
  if (articleCount > 0) {
    console.log("✅ SUCCESS: Frontend queries are returning articles");
    console.log(`✅ Homepage will show ${articleCount} articles`);
  } else {
    console.log("❌ FAILURE: Frontend queries are not returning articles");
  }
}

verifyFrontendQueries().catch(console.error);
