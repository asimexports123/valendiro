import "dotenv/config";
// Allow rendering in CLI context
process.env.ALLOW_RENDER = "true";

import { createAdminClient } from "../lib/supabase/admin";
import { render } from "../services/renderer/orchestrator";

const CATEGORIES = ["technology", "personal-finance", "business", "education", "health-wellness", "home-lifestyle", "travel"];
const ARTICLES_PER_CATEGORY = 3;

async function getPilotArticles() {
  const supabase = createAdminClient();
  const articles: any[] = [];

  for (const categorySlug of CATEGORIES) {
    // Get category ID
    const { data: category } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", categorySlug)
      .maybeSingle();
    
    if (!category) {
      console.log(`Category ${categorySlug} not found, skipping`);
      continue;
    }

    // Get topics for this category
    const { data: topics } = await supabase
      .from("topics")
      .select("id")
      .eq("category_id", category.id)
      .eq("status", "published")
      .limit(20);

    if (!topics || topics.length === 0) {
      console.log(`No topics found for ${categorySlug}`);
      continue;
    }

    const topicIds = topics.map((t: any) => t.id);

    // Get published articles for these topics
    const { data: categoryArticles } = await supabase
      .from("articles")
      .select("id, slug, topic_id, article_translations(title)")
      .in("topic_id", topicIds)
      .eq("status", "published")
      .eq("article_translations.language_code", "en")
      .limit(ARTICLES_PER_CATEGORY);

    if (categoryArticles) {
      for (const article of categoryArticles) {
        articles.push({
          id: article.id,
          slug: article.slug,
          topic_id: article.topic_id,
          title: article.article_translations?.[0]?.title || article.slug,
          category: categorySlug,
        });
      }
    }
  }

  return articles;
}

async function rerenderArticle(article: any) {
  const supabase = createAdminClient();

  try {
    // Get topic info
    const { data: topic } = await supabase
      .from("topics")
      .select("id, slug, category_id, subcategory_id")
      .eq("id", article.topic_id)
      .maybeSingle();

    if (!topic) {
      console.log(`  ❌ Topic not found for article ${article.slug}`);
      return null;
    }

    // Get knowledge package
    const { data: pkg } = await supabase
      .from("knowledge_packages")
      .select("*")
      .eq("topic_id", topic.id)
      .maybeSingle();

    if (!pkg) {
      console.log(`  ❌ Knowledge package not found for ${article.slug}`);
      return null;
    }

    // Get category slug
    const { data: category } = await supabase
      .from("categories")
      .select("slug")
      .eq("id", topic.category_id)
      .maybeSingle();

    const categorySlug = category?.slug || "technology";

    // Render with new renderer
    const renderResult = await render({
      packageId: pkg.id,
      rendererId: "long-article-v2",
      format: "html",
      forceRerender: true,
    });

    if (renderResult.status === "failed") {
      console.log(`  ❌ Render failed for ${article.slug}`);
      return null;
    }

    // Update rendered_outputs table
    const { error: updateError } = await supabase
      .from("rendered_outputs")
      .update({
        content: renderResult.content,
        format: renderResult.format,
        quality_score: renderResult.qualityScore.overall,
        diagnostics: renderResult.diagnostics,
        updated_at: new Date().toISOString(),
      })
      .eq("package_id", pkg.id)
      .eq("renderer_id", "longArticleV2");

    if (updateError) {
      console.log(`  ❌ Database update failed for ${article.slug}:`, updateError.message);
      return null;
    }

    console.log(`  ✅ Successfully re-rendered ${article.slug}`);
    return {
      articleId: article.id,
      slug: article.slug,
      packageId: pkg.id,
      qualityScore: renderResult.qualityScore.overall,
    };
  } catch (error) {
    console.log(`  ❌ Error re-rendering ${article.slug}:`, error);
    return null;
  }
}

async function main() {
  console.log("Phase A Sprint 2 - Pilot Rerender");
  console.log("=================================\n");

  console.log("Step 1: Selecting pilot articles...\n");
  const articles = await getPilotArticles();
  console.log(`Selected ${articles.length} articles for pilot rerender\n`);

  console.log("Step 2: Re-rendering articles with new renderer...\n");
  const results: any[] = [];
  for (const article of articles) {
    console.log(`Processing: ${article.slug} (${article.category})`);
    const result = await rerenderArticle(article);
    if (result) {
      results.push(result);
    }
  }

  console.log("\n=================================");
  console.log("Pilot Rerender Summary");
  console.log("=================================");
  console.log(`Total articles selected: ${articles.length}`);
  console.log(`Successfully re-rendered: ${results.length}`);
  console.log(`Failed: ${articles.length - results.length}`);
  
  console.log("\nSuccessfully re-rendered articles:");
  for (const result of results) {
    console.log(`  - ${result.slug} (Quality Score: ${result.qualityScore})`);
  }

  console.log("\nCompleted pilot rerender. Please verify production pages.");
}

main().catch(console.error);
