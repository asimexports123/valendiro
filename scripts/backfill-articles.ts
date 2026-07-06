import * as dotenv from "dotenv";
import { resolve } from "path";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";

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

async function backfillArticles() {
  const supabase = createAdminClient();

  console.log("=== Step 1: Get all published topics ===");
  const { data: publishedTopics, error: topicsError } = await supabase
    .from("topics")
    .select("id, slug, topic_translations(title), published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (topicsError) {
    console.error("Error getting published topics:", topicsError);
    return;
  }

  console.log(`Found ${publishedTopics?.length || 0} published topics`);

  console.log("\n=== Step 2: Get existing article topic_ids ===");
  const { data: existingArticles, error: articlesError } = await supabase
    .from("articles")
    .select("topic_id");

  if (articlesError) {
    console.error("Error getting existing articles:", articlesError);
    return;
  }

  const existingTopicIds = new Set((existingArticles || []).map((a: any) => a.topic_id));
  console.log(`Found ${existingTopicIds.size} existing articles`);

  console.log("\n=== Step 3: Create article rows for topics without articles ===");
  let created = 0;
  let errors = 0;

  for (const topic of publishedTopics || []) {
    if (existingTopicIds.has(topic.id)) {
      continue;
    }

    try {
      const translation = topic.topic_translations?.[0];
      const title = translation?.title || topic.slug;

      const articleId = uuidv4();
      const now = new Date().toISOString();

      // Create article row (using only existing columns)
      const { error: insertError } = await supabase
        .from("articles")
        .insert({
          id: articleId,
          slug: topic.slug,
          canonical_path: `/en/articles/${topic.slug}`,
          article_type: "guide",
          topic_id: topic.id,
          status: "published",
          published_at: topic.published_at || now,
          created_at: now,
          updated_at: now,
        });

      if (insertError) {
        console.error(`Error creating article for topic ${topic.slug}:`, insertError);
        errors++;
      } else {
        // Create article translation
        const { error: translationError } = await supabase
          .from("article_translations")
          .insert({
            article_id: articleId,
            language_code: "en",
            title: title,
            excerpt: null,
            content: translation?.content || null,
            meta_title: `${title} — Complete Guide`,
            meta_description: `Learn everything about ${title} — definitions, guides, tips, and expert resources.`,
          });

        if (translationError) {
          console.error(`Error creating translation for article ${topic.slug}:`, translationError);
          errors++;
        } else {
          created++;
          console.log(`Created article for topic: ${topic.slug}`);
        }
      }
    } catch (err) {
      console.error(`Error processing topic ${topic.slug}:`, err);
      errors++;
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Created: ${created} articles`);
  console.log(`Errors: ${errors}`);
  console.log(`Total published topics: ${publishedTopics?.length || 0}`);

  console.log("\n=== Step 4: Verify article count ===");
  const { count: finalArticleCount } = await supabase
    .from("articles")
    .select("*", { count: "exact", head: true })
    .eq("status", "published");

  console.log(`Final article count: ${finalArticleCount}`);
  console.log(`Published topic count: ${publishedTopics?.length || 0}`);

  if (finalArticleCount === (publishedTopics?.length || 0)) {
    console.log("✅ SUCCESS: Article count equals published topic count");
  } else {
    console.log("❌ FAILURE: Article count does not equal published topic count");
  }
}

backfillArticles().catch(console.error);
