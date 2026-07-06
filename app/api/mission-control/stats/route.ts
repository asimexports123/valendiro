import { createAdminClient } from "@/lib/env";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = createAdminClient();

  try {
    // Get article counts by status
    const { count: articlesPublished } = await supabase
      .from("articles")
      .select("*", { count: "exact", head: true })
      .eq("status", "published");

    const { count: drafts } = await supabase
      .from("articles")
      .select("*", { count: "exact", head: true })
      .eq("status", "draft");

    const { count: readyToPublish } = await supabase
      .from("content_generation_queue")
      .select("*", { count: "exact", head: true })
      .in("status", ["pending", "pending_llm"]);

    const { count: failed } = await supabase
      .from("content_generation_queue")
      .select("*", { count: "exact", head: true })
      .eq("status", "failed");

    const { count: needsReview } = await supabase
      .from("articles")
      .select("*", { count: "exact", head: true })
      .eq("status", "review");

    // Get knowledge packages count
    const { count: knowledgePackages } = await supabase
      .from("knowledge_packages")
      .select("*", { count: "exact", head: true })
      .eq("status", "ready");

    // Get rendered outputs count
    const { count: renderedOutputs } = await supabase
      .from("rendered_outputs")
      .select("*", { count: "exact", head: true })
      .eq("status", "published");

    // Get queue sizes
    const { count: discoveryQueue } = await supabase
      .from("content_generation_queue")
      .select("*", { count: "exact", head: true })
      .eq("object_type", "topic")
      .in("status", ["pending", "pending_llm"]);

    const { count: renderingQueue } = await supabase
      .from("knowledge_packages")
      .select("*", { count: "exact", head: true })
      .eq("status", "queued");

    const { count: publishingQueue } = await supabase
      .from("content_generation_queue")
      .select("*", { count: "exact", head: true })
      .eq("object_type", "article")
      .in("status", ["pending", "pending_llm"]);

    // Get quality metrics from recent articles
    const { data: recentArticles } = await supabase
      .from("articles")
      .select("article_translations(content)")
      .eq("status", "published")
      .eq("article_translations.language_code", "en")
      .limit(100);

    let averageWordCount = 0;
    let averageEditorialScore = 75; // Default score
    let averageReferences = 0;
    let averageInternalLinks = 0;
    let averageReadingTime = 0;

    if (recentArticles && recentArticles.length > 0) {
      let totalWords = 0;
      let totalReferences = 0;
      let totalLinks = 0;

      for (const article of recentArticles) {
        const translation = article.article_translations?.[0];
        if (translation?.content) {
          const wordCount = translation.content.split(/\s+/).length;
          totalWords += wordCount;
          
          // Count references (citations)
          const citationMatches = translation.content.match(/\[\d+\]/g);
          totalReferences += citationMatches ? citationMatches.length : 0;

          // Count internal links (basic heuristic)
          const linkMatches = translation.content.match(/\[.*?\]\(\/.*?\)/g);
          totalLinks += linkMatches ? linkMatches.length : 0;
        }
      }

      averageWordCount = Math.round(totalWords / recentArticles.length);
      averageReferences = Math.round(totalReferences / recentArticles.length);
      averageInternalLinks = Math.round(totalLinks / recentArticles.length);
      averageReadingTime = Math.round(averageWordCount / 200); // 200 words per minute
    }

    // Get source counts
    const { count: rssSources } = await supabase
      .from("rss_sources")
      .select("*", { count: "exact", head: true })
      .eq("source_type", "rss");

    const { count: feedlySources } = await supabase
      .from("rss_sources")
      .select("*", { count: "exact", head: true })
      .eq("source_type", "feedly");

    const { count: officialSources } = await supabase
      .from("sources")
      .select("*", { count: "exact", head: true })
      .eq("source_type", "official");

    const { count: governmentSources } = await supabase
      .from("sources")
      .select("*", { count: "exact", head: true })
      .eq("source_type", "government");

    const { count: universitySources } = await supabase
      .from("sources")
      .select("*", { count: "exact", head: true })
      .eq("source_type", "university");

    const { count: trustedSources } = await supabase
      .from("sources")
      .select("*", { count: "exact", head: true })
      .gt("reliability_score", 0.8);

    const stats = {
      articlesPublished: articlesPublished || 0,
      drafts: drafts || 0,
      readyToPublish: readyToPublish || 0,
      failed: failed || 0,
      needsReview: needsReview || 0,
      knowledgePackages: knowledgePackages || 0,
      renderedOutputs: renderedOutputs || 0,
      discoveryQueue: discoveryQueue || 0,
      renderingQueue: renderingQueue || 0,
      publishingQueue: publishingQueue || 0,
      averageEditorialScore,
      averageWordCount,
      averageReferences,
      averageInternalLinks,
      averageReadingTime,
      rssSources: rssSources || 0,
      feedlySources: feedlySources || 0,
      officialSources: officialSources || 0,
      governmentSources: governmentSources || 0,
      universitySources: universitySources || 0,
      trustedSources: trustedSources || 0,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
