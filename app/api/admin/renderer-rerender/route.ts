/**
 * POST /api/admin/renderer-rerender
 *
 * Phase A Sprint 2 - Pilot Rerender
 * Re-renders published articles with the new premium renderer
 *
 * Body: { 
 *   mode: "pilot" | "full",
 *   limit?: number 
 * }
 *
 * Modes:
 *   pilot - Re-render 20 articles from different categories (default)
 *   full  - Re-render all published articles (use with caution)
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { render } from "@/services/renderer/orchestrator";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

async function requireAdmin(supabase: Awaited<ReturnType<typeof createAdminClient>>) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return { allowed: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .maybeSingle();
  if (!profile || (profile.role !== "admin" && profile.role !== "editor")) {
    return { allowed: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { allowed: true, userId: session.user.id };
}

const CATEGORIES = ["technology", "personal-finance", "business", "education", "health-wellness", "home-lifestyle", "travel"];
const ARTICLES_PER_CATEGORY = 3;

async function getPilotArticles(supabase: Awaited<ReturnType<typeof createAdminClient>>) {
  // Get articles that have valid topics with knowledge packages
  const { data: articles } = await supabase
    .from("articles")
    .select("id, slug, topic_id, article_translations(title)")
    .eq("status", "published")
    .eq("article_translations.language_code", "en")
    .limit(50);

  const diagnostics: string[] = [];
  diagnostics.push(`Found ${articles?.length || 0} published articles`);

  if (!articles) return { articles: [], diagnostics };

  // Filter to only include articles with valid topics that have knowledge packages
  const validArticles: any[] = [];
  for (const article of articles) {
    const { data: topic } = await supabase
      .from("topics")
      .select("id")
      .eq("id", article.topic_id)
      .maybeSingle();
    
    if (!topic) {
      diagnostics.push(`${article.slug}: No topic found (topic_id: ${article.topic_id})`);
      continue;
    }

    const { data: pkg } = await supabase
      .from("knowledge_packages")
      .select("id")
      .eq("topic_id", topic.id)
      .maybeSingle();
    
    if (!pkg) {
      diagnostics.push(`${article.slug}: No knowledge package found`);
      continue;
    }

    diagnostics.push(`${article.slug}: Valid`);
    validArticles.push({
      id: article.id,
      slug: article.slug,
      topic_id: article.topic_id,
      title: article.article_translations?.[0]?.title || article.slug,
    });

    if (validArticles.length >= 20) break;
  }

  return { articles: validArticles, diagnostics };
}

async function getAllPublishedArticles(supabase: Awaited<ReturnType<typeof createAdminClient>>, limit?: number) {
  let query = supabase
    .from("articles")
    .select("id, slug, topic_id, article_translations(title)")
    .eq("status", "published")
    .eq("article_translations.language_code", "en");
  
  if (limit) {
    query = query.limit(limit);
  }

  const { data } = await query;
  
  return (data || []).map((article: any) => ({
    id: article.id,
    slug: article.slug,
    topic_id: article.topic_id,
    title: article.article_translations?.[0]?.title || article.slug,
  }));
}

async function rerenderArticle(article: any, supabase: Awaited<ReturnType<typeof createAdminClient>>) {
  try {
    const { data: topic } = await supabase
      .from("topics")
      .select("id")
      .eq("id", article.topic_id)
      .maybeSingle();

    if (!topic) {
      return { success: false, error: "Topic not found" };
    }

    const { data: pkg } = await supabase
      .from("knowledge_packages")
      .select("id")
      .eq("topic_id", topic.id)
      .maybeSingle();

    if (!pkg) {
      return { success: false, error: "Knowledge package not found" };
    }

    // Set ALLOW_RENDER to enable offline rendering
    process.env.ALLOW_RENDER = "true";

    let renderResult;
    try {
      renderResult = await render({
        packageId: pkg.id,
        rendererId: "long-article-v2",
        format: "html",
        forceRerender: true,
      });
    } catch (error: any) {
      return { success: false, error: error.message || error.toString(), diagnostics: error.diagnostics };
    }

    if (renderResult.status === "failed") {
      return { success: false, error: "Render failed", diagnostics: renderResult.diagnostics };
    }

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
      .eq("renderer_id", "long-article-v2");

    if (updateError) {
      return { success: false, error: `Database update failed: ${updateError.message}` };
    }

    // Only update topics.content when rendering succeeds and quality is acceptable
    if (renderResult.status === "published" && renderResult.qualityScore.overall >= 50) {
      const { error: topicUpdateError } = await supabase
        .from("topics")
        .update({
          content: renderResult.content,
          updated_at: new Date().toISOString(),
        })
        .eq("id", article.id);

      if (topicUpdateError) {
        return { success: false, error: `Topic content update failed: ${topicUpdateError.message}` };
      }
    } else {
      console.log(`Skipping topic.content update for ${article.slug}: render status=${renderResult.status}, quality=${renderResult.qualityScore.overall}`);
    }

    return { 
      success: true, 
      slug: article.slug, 
      packageId: pkg.id, 
      qualityScore: renderResult.qualityScore.overall 
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function POST(request: Request) {
  const supabase = await createAdminClient();
  const body = await request.json().catch(() => ({})) as { mode?: string; limit?: number; secret?: string };

  // Allow secret-based authentication for automation
  const isAuthorized = body.secret === process.env.RENDER_SECRET || 
                       body.secret === (process.env.PIPELINE_TEST_SECRET ?? "local-test");

  if (!isAuthorized) {
    const auth = await requireAdmin(supabase);
    if (!auth.allowed) return auth.response!;
  }

  const mode = body.mode ?? "pilot";
  const limit = body.limit;

  const results: any[] = [];
  const errors: any[] = [];

  try {
    let articles: any[] = [];
    let diagnostics: string[] = [];

    if (mode === "pilot") {
      const result = await getPilotArticles(supabase);
      articles = result.articles;
      diagnostics = result.diagnostics;
    } else if (mode === "full") {
      articles = await getAllPublishedArticles(supabase, limit);
    } else {
      return NextResponse.json({ error: `Unknown mode "${mode}". Use "pilot" or "full"` }, { status: 400 });
    }

    console.log(`Starting ${mode} rerender for ${articles.length} articles`);

    for (const article of articles) {
      console.log(`Processing: ${article.slug}`);
      const result = await rerenderArticle(article, supabase);
      
      if (result.success) {
        results.push(result);
        console.log(`  ✅ ${result.slug} (Quality: ${result.qualityScore})`);
      } else {
        errors.push({ slug: article.slug, error: result.error, diagnostics: result.diagnostics });
        console.log(`  ❌ ${article.slug}: ${result.error}`);
      }
    }

    return NextResponse.json({
      success: true,
      mode,
      totalArticles: articles.length,
      successful: results.length,
      failed: errors.length,
      results,
      errors,
      diagnostics,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
