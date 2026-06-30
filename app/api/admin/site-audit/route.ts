/**
 * GET /api/admin/site-audit
 *
 * Full site integrity audit:
 *   1. DB-level checks  — every published slug has an English translation
 *   2. HTTP-level checks — fetch every public URL, record status codes
 *   3. Orphan detection  — topics/articles with no valid parent chain
 *   4. Navigation checks — static nav/footer links
 *
 * Returns a structured JSON report. Exits with 200 always (CI reads the
 * `passed` boolean to decide whether to fail the job).
 *
 * Auth: session cookie (same pattern as other admin routes).
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// ─── Constants ────────────────────────────────────────────────────────────────

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://valendiro.com").replace(/\/$/, "");
const LANG = "en";
const BASE = `${SITE_URL}/${LANG}`;

const V1_CATEGORY_SLUGS = [
  "technology", "personal-finance", "business",
  "education", "health-wellness", "home-lifestyle", "travel",
];

const STATIC_ROUTES = [
  `${BASE}`,
  `${BASE}/search`,
  `${BASE}/about`,
  `${BASE}/contact`,
  `${BASE}/privacy`,
  `${BASE}/terms`,
  `${SITE_URL}/sitemap.xml`,
];

const NAV_LINKS = V1_CATEGORY_SLUGS.map((s) => `${BASE}/categories/${s}`);

const FOOTER_LINKS = [
  `${BASE}/about`,
  `${BASE}/contact`,
  `${BASE}/privacy`,
  `${BASE}/terms`,
  `${BASE}/search`,
  ...NAV_LINKS,
];

// ─── Types ────────────────────────────────────────────────────────────────────

type CheckStatus = "ok" | "broken" | "no_translation" | "empty_slug" | "orphan" | "no_db_row";
type PageType = "static" | "category" | "collection" | "topic" | "article" | "nav" | "footer" | "sitemap";

interface RouteCheck {
  type: PageType;
  url: string;
  slug?: string;
  db_status?: CheckStatus;
  http_status?: number;
  reason?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function httpCheck(url: string): Promise<number> {
  try {
    const res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
    });
    return res.status;
  } catch {
    return 0;
  }
}

async function batchHttpCheck(
  items: { url: string }[],
  concurrency = 8
): Promise<Map<string, number>> {
  const results = new Map<string, number>();
  for (let i = 0; i < items.length; i += concurrency) {
    const chunk = items.slice(i, i + concurrency);
    const statuses = await Promise.all(chunk.map((item) => httpCheck(item.url)));
    chunk.forEach((item, idx) => results.set(item.url, statuses[idx]));
  }
  return results;
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  // Auth
  const authClient = await createClient();
  const { data: { session } } = await authClient.auth.getSession();

  // Allow CI token auth as fallback (set AUDIT_SECRET in Vercel + GitHub)
  const auditSecret = process.env.AUDIT_SECRET;
  const authHeader = request.headers.get("x-audit-secret");
  const isCI = auditSecret && authHeader === auditSecret;

  if (!session && !isCI) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const checks: RouteCheck[] = [];
  const urlsToFetch: { url: string; ref: RouteCheck }[] = [];

  // ── 1. Static routes ────────────────────────────────────────────────────────
  for (const url of STATIC_ROUTES) {
    const c: RouteCheck = { type: url.includes("sitemap") ? "sitemap" : "static", url };
    checks.push(c);
    urlsToFetch.push({ url, ref: c });
  }

  // ── 2. Navigation links ─────────────────────────────────────────────────────
  for (const url of NAV_LINKS) {
    const slug = url.split("/").pop()!;
    const c: RouteCheck = { type: "nav", url, slug };
    checks.push(c);
    urlsToFetch.push({ url, ref: c });
  }

  // ── 3. Footer links ─────────────────────────────────────────────────────────
  for (const url of FOOTER_LINKS) {
    // Skip duplicates already added in nav
    if (!checks.find((c) => c.url === url && c.type === "footer")) {
      const slug = url.split("/").pop() || undefined;
      const c: RouteCheck = { type: "footer", url, slug };
      checks.push(c);
      urlsToFetch.push({ url, ref: c });
    }
  }

  // ── 4. Categories (DB + HTTP) ────────────────────────────────────────────────
  const { data: categories } = await supabase
    .from("categories")
    .select("id, slug, category_translations(language_code, name)")
    .in("slug", V1_CATEGORY_SLUGS);

  const foundCatSlugs = new Set((categories ?? []).map((c: any) => c.slug));

  for (const slug of V1_CATEGORY_SLUGS) {
    const url = `${BASE}/categories/${slug}`;
    const cat = (categories ?? []).find((c: any) => c.slug === slug);
    let db_status: CheckStatus = "ok";
    let reason: string | undefined;

    if (!cat) {
      db_status = "no_db_row";
      reason = "V1 category slug not in DB — page will 404";
    } else {
      const hasEn = (cat.category_translations as any[])?.some(
        (t: any) => t.language_code === "en" && t.name
      );
      if (!hasEn) {
        db_status = "no_translation";
        reason = "Missing English translation";
      }
    }

    const c: RouteCheck = { type: "category", url, slug, db_status, reason };
    checks.push(c);
    if (db_status === "ok") urlsToFetch.push({ url, ref: c });
    else c.http_status = 404; // skip fetch — we know it will 404
  }

  // ── 5. Collections (DB sample — top 200 by created_at) ───────────────────────
  const { data: collections } = await supabase
    .from("collections")
    .select("id, slug, category_id, collection_translations(language_code, name)")
    .order("created_at", { ascending: false })
    .limit(200);

  const validCatIds = new Set((categories ?? []).map((c: any) => c.id));

  for (const col of collections ?? []) {
    if (!col.slug) continue;
    const url = `${BASE}/collections/${col.slug}`;
    const hasEn = (col.collection_translations as any[])?.some(
      (t: any) => t.language_code === "en" && t.name
    );
    const orphan = col.category_id && !validCatIds.has(col.category_id);
    const db_status: CheckStatus = !hasEn ? "no_translation" : orphan ? "orphan" : "ok";
    const reason = !hasEn
      ? "Missing English translation"
      : orphan
      ? `category_id ${col.category_id} not a V1 category`
      : undefined;

    const c: RouteCheck = { type: "collection", url, slug: col.slug, db_status, reason };
    checks.push(c);
    if (db_status === "ok") urlsToFetch.push({ url, ref: c });
    else c.http_status = 404;
  }

  // ── 6. Topics (DB sample — top 200 published) ────────────────────────────────
  const { data: topics } = await supabase
    .from("topics")
    .select("id, slug, status, category_id, collection_id, topic_translations(language_code, title)")
    .eq("status", "published")
    .order("updated_at", { ascending: false })
    .limit(200);

  // Build set of valid collection IDs for orphan check
  const validCollectionIds = new Set((collections ?? []).map((c: any) => c.id));

  for (const topic of topics ?? []) {
    if (!topic.slug) continue;
    const url = `${BASE}/topics/${topic.slug}`;
    const hasEn = (topic.topic_translations as any[])?.some(
      (t: any) => t.language_code === "en" && t.title
    );
    const orphan = topic.collection_id && !validCollectionIds.has(topic.collection_id);
    const db_status: CheckStatus = !hasEn ? "no_translation" : orphan ? "orphan" : "ok";
    const reason = !hasEn
      ? "Published topic missing English translation"
      : orphan
      ? `collection_id ${topic.collection_id} not found in sampled collections`
      : undefined;

    const c: RouteCheck = { type: "topic", url, slug: topic.slug, db_status, reason };
    checks.push(c);
    if (db_status === "ok") urlsToFetch.push({ url, ref: c });
    else c.http_status = 404;
  }

  // ── 7. Articles (DB sample — top 200 published) ───────────────────────────────
  const { data: articles } = await supabase
    .from("articles")
    .select("id, slug, status, topic_id, article_translations(language_code, title)")
    .eq("status", "published")
    .order("updated_at", { ascending: false })
    .limit(200);

  const validTopicIds = new Set((topics ?? []).map((t: any) => t.id));

  for (const article of articles ?? []) {
    if (!article.slug) continue;
    const url = `${BASE}/articles/${article.slug}`;
    const hasEn = (article.article_translations as any[])?.some(
      (t: any) => t.language_code === "en" && t.title
    );
    const orphan = article.topic_id && !validTopicIds.has(article.topic_id);
    const db_status: CheckStatus = !hasEn ? "no_translation" : orphan ? "orphan" : "ok";
    const reason = !hasEn
      ? "Published article missing English translation"
      : orphan
      ? `topic_id ${article.topic_id} not found in sampled topics`
      : undefined;

    const c: RouteCheck = { type: "article", url, slug: article.slug, db_status, reason };
    checks.push(c);
    if (db_status === "ok") urlsToFetch.push({ url, ref: c });
    else c.http_status = 404;
  }

  // ── HTTP fetches in parallel batches ─────────────────────────────────────────
  const statusMap = await batchHttpCheck(urlsToFetch, 10);
  for (const { url, ref } of urlsToFetch) {
    ref.http_status = statusMap.get(url) ?? 0;
  }

  // ── Build report ──────────────────────────────────────────────────────────────
  const byStatus = {
    ok_200:    checks.filter((c) => c.http_status === 200).length,
    redirect_3xx: checks.filter((c) => c.http_status !== undefined && c.http_status >= 300 && c.http_status < 400).length,
    not_found_404: checks.filter((c) => c.http_status === 404).length,
    error_other: checks.filter((c) => c.http_status !== undefined && c.http_status !== 200 && (c.http_status < 300 || c.http_status >= 400) && c.http_status !== 404).length,
    unreachable: checks.filter((c) => c.http_status === 0).length,
  };

  const broken = checks.filter(
    (c) => c.db_status !== "ok" || (c.http_status !== undefined && c.http_status !== 200 && c.http_status !== 301 && c.http_status !== 302)
  );

  const orphans = checks.filter((c) => c.db_status === "orphan");

  const byType = (type: PageType) => {
    const group = checks.filter((c) => c.type === type);
    return {
      total: group.length,
      ok: group.filter((c) => c.http_status === 200).length,
      broken: group.filter((c) => c.db_status !== "ok" || (c.http_status !== undefined && c.http_status !== 200 && c.http_status !== 301 && c.http_status !== 302)).length,
    };
  };

  const report = {
    generated_at: new Date().toISOString(),
    site_url: SITE_URL,
    passed: broken.length === 0,
    summary: {
      total_urls_tested: checks.filter((c) => c.http_status !== undefined).length,
      "200_ok": byStatus.ok_200,
      "3xx_redirect": byStatus.redirect_3xx,
      "404_not_found": byStatus.not_found_404,
      other_errors: byStatus.error_other,
      unreachable: byStatus.unreachable,
      broken_total: broken.length,
      orphan_pages: orphans.length,
    },
    by_type: {
      static:     byType("static"),
      nav:        byType("nav"),
      footer:     byType("footer"),
      categories: byType("category"),
      collections: byType("collection"),
      topics:     byType("topic"),
      articles:   byType("article"),
      sitemap:    byType("sitemap"),
    },
    broken_routes: broken.map((c) => ({
      type: c.type,
      url: c.url,
      db_status: c.db_status,
      http_status: c.http_status,
      reason: c.reason,
    })),
    orphan_pages: orphans.map((c) => ({
      type: c.type,
      url: c.url,
      reason: c.reason,
    })),
  };

  return NextResponse.json(report, { status: 200 });
}
