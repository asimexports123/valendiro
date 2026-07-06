import { NextResponse } from "next/server";
import { runResearchAgent, runOutlineAgent, runWriterAgent, runDeterministicQualityCheck, buildDeterministicSEOFields } from "@/services/intelligence/agentPipeline";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: Request) {
  const secret = request.headers.get("x-validate-secret");
  const expectedSecret = process.env.VALIDATE_SECRET;
  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { keyword } = await request.json();
  if (!keyword) return NextResponse.json({ error: "keyword required" }, { status: 400 });

  const supabase = createAdminClient();

  try {
    // Run the full intent-aware pipeline
    const { pack, intent, durationMs: d1 } = await runResearchAgent(keyword, "general");
    const { structure, durationMs: d2 } = await runOutlineAgent(pack, intent);
    const { content, durationMs: d3 } = await runWriterAgent(pack, structure, intent);
    const quality = runDeterministicQualityCheck(content);
    const seo = buildDeterministicSEOFields(structure.title, keyword, pack);

    // Build slug
    const slug = structure.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80);

    // Check duplicate
    const { data: existing } = await supabase
      .from("articles")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existing) {
      // Update existing draft
      await supabase.from("article_translations")
        .update({ title: structure.title, content, excerpt: content.slice(0, 250), meta_title: seo.metaTitle, meta_description: seo.metaDescription })
        .eq("article_id", existing.id)
        .eq("language_code", "en");
    } else {
      // Insert new draft article
      const { data: article, error: aErr } = await supabase
        .from("articles")
        .insert({
          slug,
          canonical_path: `/en/articles/${slug}`,
          article_type: "guide",
          status: "draft",
        })
        .select()
        .single();

      if (aErr || !article) throw new Error(aErr?.message || "Article insert failed");

      const firstParagraph = content.replace(/^#+.+$/gm, "").split(/\n{2,}/).find(p => p.trim().length > 40) ?? "";
      const excerpt = firstParagraph.replace(/\*\*/g, "").trim().slice(0, 250);

      await supabase.from("article_translations").insert({
        article_id: article.id,
        language_code: "en",
        title: structure.title,
        excerpt,
        content,
        meta_title: seo.metaTitle,
        meta_description: seo.metaDescription,
      });
    }

    const sections = structure.sections.map(s => s.heading);

    return NextResponse.json({
      intent,
      title: structure.title,
      slug,
      wordCount: quality.wordCount,
      qualityScore: quality.score,
      qualityPassed: quality.passed,
      qualityIssues: quality.issues,
      sections,
      durationMs: d1 + d2 + d3,
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[validate-article] Error for "${keyword}":`, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
