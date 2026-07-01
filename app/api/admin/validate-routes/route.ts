import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const V1_CATEGORY_SLUGS = [
  "technology",
  "personal-finance",
  "business",
  "education",
  "health-wellness",
  "home-lifestyle",
  "travel",
];

interface RouteResult {
  type: "category" | "subcategory" | "topic" | "article";
  slug: string;
  status: "ok" | "broken" | "no_translation" | "empty_slug";
  reason?: string;
}

export async function GET() {
  const authClient = await createClient();
  const { data: { session } } = await authClient.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const results: RouteResult[] = [];

  // ── 1. Categories ────────────────────────────────────────────────────────
  const { data: categories } = await supabase
    .from("categories")
    .select("id, slug, category_translations(language_code, name)")
    .in("slug", V1_CATEGORY_SLUGS);

  for (const cat of categories ?? []) {
    if (!cat.slug) {
      results.push({ type: "category", slug: "(empty)", status: "empty_slug", reason: "Category row has no slug" });
      continue;
    }
    const hasEnTranslation = (cat.category_translations as any[])?.some(
      (t: any) => t.language_code === "en" && t.name
    );
    if (!hasEnTranslation) {
      results.push({ type: "category", slug: cat.slug, status: "no_translation", reason: "Missing English translation — getCategoryBySlug returns null" });
    } else {
      results.push({ type: "category", slug: cat.slug, status: "ok" });
    }
  }

  // Flag any V1 slug not found in DB at all
  const foundCatSlugs = new Set((categories ?? []).map((c: any) => c.slug));
  for (const slug of V1_CATEGORY_SLUGS) {
    if (!foundCatSlugs.has(slug)) {
      results.push({ type: "category", slug, status: "broken", reason: "V1 category slug not found in DB — category page will 404" });
    }
  }

  // ── 2. Collections ───────────────────────────────────────────────────────
  const { data: subcategories } = await supabase
    .from("subcategories")
    .select("id, slug, category_id, subcategory_translations(language_code, name)")
    .order("created_at", { ascending: false })
    .limit(2000);

  for (const col of subcategories ?? []) {
    if (!col.slug) {
      results.push({ type: "subcategory", slug: "(empty)", status: "empty_slug", reason: "Subcategory row has no slug" });
      continue;
    }
    const hasEnTranslation = (col.subcategory_translations as any[])?.some(
      (t: any) => t.language_code === "en" && t.name
    );
    if (!hasEnTranslation) {
      results.push({ type: "subcategory", slug: col.slug, status: "no_translation", reason: "Missing English translation — subcategory page will show slug as name" });
    } else {
      results.push({ type: "subcategory", slug: col.slug, status: "ok" });
    }
  }

  // ── 3. Topics ─────────────────────────────────────────────────────────────
  const { data: topics } = await supabase
    .from("topics")
    .select("id, slug, status, category_id, topic_translations(language_code, title)")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(5000);

  for (const topic of topics ?? []) {
    if (!topic.slug) {
      results.push({ type: "topic", slug: "(empty)", status: "empty_slug", reason: "Topic has no slug" });
      continue;
    }
    const hasEnTranslation = (topic.topic_translations as any[])?.some(
      (t: any) => t.language_code === "en" && t.title
    );
    if (!hasEnTranslation) {
      results.push({ type: "topic", slug: topic.slug, status: "no_translation", reason: "Published topic missing English translation — topic page returns notFound()" });
    } else {
      results.push({ type: "topic", slug: topic.slug, status: "ok" });
    }
  }

  // ── 4. Articles ───────────────────────────────────────────────────────────
  const { data: articles } = await supabase
    .from("articles")
    .select("id, slug, status, topic_id, article_translations(language_code, title)")
    .eq("status", "published")
    .order("updated_at", { ascending: false })
    .limit(5000);

  for (const article of articles ?? []) {
    if (!article.slug) {
      results.push({ type: "article", slug: "(empty)", status: "empty_slug", reason: "Article has no slug" });
      continue;
    }
    const hasEnTranslation = (article.article_translations as any[])?.some(
      (t: any) => t.language_code === "en" && t.title
    );
    if (!hasEnTranslation) {
      results.push({ type: "article", slug: article.slug, status: "no_translation", reason: "Published article missing English translation — article page returns notFound()" });
    } else {
      results.push({ type: "article", slug: article.slug, status: "ok" });
    }
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  const broken404 = results.filter((r) => r.status !== "ok");

  const summary = {
    total: results.length,
    ok: results.filter((r) => r.status === "ok").length,
    broken: broken404.length,
    byType: {
      categories:  { total: results.filter((r) => r.type === "category").length,  ok: results.filter((r) => r.type === "category"  && r.status === "ok").length  },
      subcategories: { total: results.filter((r) => r.type === "subcategory").length, ok: results.filter((r) => r.type === "subcategory" && r.status === "ok").length },
      topics:      { total: results.filter((r) => r.type === "topic").length,      ok: results.filter((r) => r.type === "topic"      && r.status === "ok").length },
      articles:    { total: results.filter((r) => r.type === "article").length,    ok: results.filter((r) => r.type === "article"    && r.status === "ok").length },
    },
    issues: broken404,
  };

  return NextResponse.json(summary, { status: 200 });
}
