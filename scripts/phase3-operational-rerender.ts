/**
 * Phase 3 operational re-render — batch re-render eligible packages with metrics.
 * Usage: ALLOW_RENDER=true npx tsx scripts/phase3-operational-rerender.ts [--before-only|--rerender|--after-meta]
 */
import * as dotenv from "dotenv";
import { resolve, join } from "path";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "fs";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });
process.env.ALLOW_RENDER = "true";

const SCREENSHOT_DIR = resolve(process.cwd(), "temp/phase3-screenshots");
const RESULTS_PATH = resolve(process.cwd(), "temp/phase3-results.json");

/** Representative packages across 5 domains (fact_count >= 8, actual facts in DB, live topic URLs) */
const SELECTED_PACKAGES = [
  {
    domain: "Technology",
    packageId: "ea3f9ac1-b0fd-4ae7-8552-75245331ef9e",
    slug: "nodejs-cluster",
    url: "https://valendiro.com/en/topics/nodejs-cluster",
  },
  {
    domain: "Finance",
    packageId: "952ae4c7-c3f6-4383-8e6b-f82498448644",
    slug: "index-funds",
    url: "https://valendiro.com/en/topics/index-funds",
  },
  {
    domain: "Travel",
    packageId: "30a11d2a-0413-491f-ac1b-e6574fbabd69",
    slug: "family-vacations",
    url: "https://valendiro.com/en/topics/family-vacations",
  },
  {
    domain: "Health",
    packageId: "da30b63d-6ae6-4067-bc49-9c73b1803fe8",
    slug: "heart-disease",
    url: "https://valendiro.com/en/topics/heart-disease",
  },
  {
    domain: "Business",
    packageId: "0e9e7def-de47-45f3-a1e7-b3cfcffd0b85",
    slug: "vendor-management",
    url: "https://valendiro.com/en/topics/vendor-management",
  },
];

interface PackageResult {
  domain: string;
  packageId: string;
  slug: string;
  url: string;
  oldProjectionId: string | null;
  newProjectionId: string | null;
  projectionVersion: string | null;
  compositionScore: number | null;
  qualityScore: number | null;
  validationPassed: boolean;
  validationIssues: string[];
  renderDurationMs: number;
  projectionDurationMs: number | null;
  seoBefore: SeoSnapshot | null;
  seoAfter: SeoSnapshot | null;
  seoUnchanged: boolean | null;
  screenshotBefore: string;
  screenshotAfter: string;
  beforeContent: string | null;
  afterContent: string | null;
  status: string;
  wordCount: number;
  sectionCount: number;
}

interface SeoSnapshot {
  path: string;
  title: string;
  description: string;
  canonical: string;
}

async function getCurrentOutput(
  sb: ReturnType<typeof import("@supabase/supabase-js").createClient>,
  packageId: string
) {
  const { data } = await sb
    .from("rendered_outputs")
    .select("id, renderer_id, renderer_version, status, quality_score, created_at")
    .eq("package_id", packageId)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

async function fetchSeo(url: string): Promise<SeoSnapshot> {
  const res = await fetch(url, { headers: { "User-Agent": "Phase3-Validation/1.0" } });
  const html = await res.text();
  const title = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() ?? "";
  const description =
    html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)?.[1]?.trim() ??
    html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i)?.[1]?.trim() ??
    "";
  const canonical =
    html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/i)?.[1]?.trim() ??
    html.match(/<link[^>]+href=["']([^"']*)["'][^>]+rel=["']canonical["']/i)?.[1]?.trim() ??
    "";
  const path = new URL(url).pathname;
  return { path, title, description, canonical };
}

function seoEqual(a: SeoSnapshot, b: SeoSnapshot): boolean {
  return a.path === b.path && a.title === b.title && a.description === b.description && a.canonical === b.canonical;
}

function loadResults(): PackageResult[] {
  if (!existsSync(RESULTS_PATH)) {
    return SELECTED_PACKAGES.map((p) => ({
      ...p,
      oldProjectionId: null,
      newProjectionId: null,
      projectionVersion: null,
      compositionScore: null,
      qualityScore: null,
      validationPassed: false,
      validationIssues: [],
      renderDurationMs: 0,
      projectionDurationMs: null,
      seoBefore: null,
      seoAfter: null,
      seoUnchanged: null,
      screenshotBefore: join(SCREENSHOT_DIR, `${p.slug}-before.png`),
      screenshotAfter: join(SCREENSHOT_DIR, `${p.slug}-after.png`),
      beforeContent: null,
      afterContent: null,
      status: "pending",
      wordCount: 0,
      sectionCount: 0,
    }));
  }
  return JSON.parse(readFileSync(RESULTS_PATH, "utf-8"));
}

function saveResults(results: PackageResult[]) {
  mkdirSync(resolve(process.cwd(), "temp"), { recursive: true });
  writeFileSync(RESULTS_PATH, JSON.stringify(results, null, 2));
}

async function captureBeforeState() {
  const { createClient } = await import("@supabase/supabase-js");
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  mkdirSync(SCREENSHOT_DIR, { recursive: true });
  const results = loadResults();

  for (const r of results) {
    const output = await getCurrentOutput(sb, r.packageId);
    r.oldProjectionId = output?.id ?? null;
    r.projectionVersion = output?.renderer_id ?? null;
    r.qualityScore = (output?.quality_score as { overall?: number })?.overall ?? null;
    const { data: pkgRow } = await sb
      .from("knowledge_packages")
      .select("topic_id")
      .eq("id", r.packageId)
      .single();
    if (pkgRow?.topic_id) {
      const { data: translation } = await sb
        .from("topic_translations")
        .select("content")
        .eq("topic_id", pkgRow.topic_id)
        .eq("language_code", "en")
        .maybeSingle();
      r.beforeContent = translation?.content ?? null;
    }
    try {
      r.seoBefore = await fetchSeo(r.url);
    } catch (e) {
      console.warn(`SEO fetch failed for ${r.slug}:`, e);
    }
    console.log(`BEFORE ${r.domain}/${r.slug}: oldOutput=${r.oldProjectionId} url=${r.url}`);
  }

  saveResults(results);
  console.log(`Before state saved to ${RESULTS_PATH}`);
  console.log(`Screenshot dir: ${SCREENSHOT_DIR}`);
}

async function rerenderAll() {
  const { createClient } = await import("@supabase/supabase-js");
  const { renderPackage } = await import("../services/render/engine");
  const { markOutputStatus, markOutputPublished } = await import("../services/render/writers");

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const results = loadResults();

  for (const r of results) {
    console.log(`\n=== Re-rendering ${r.domain}: ${r.slug} (${r.packageId}) ===`);
    if (!r.oldProjectionId) {
      const output = await getCurrentOutput(sb, r.packageId);
      r.oldProjectionId = output?.id ?? null;
      r.projectionVersion = output?.renderer_id ?? null;
    }

    const t0 = Date.now();
    try {
      const result = await renderPackage({
        packageId: r.packageId,
        rendererId: "long-article-v2",
        forceRerender: true,
      });
      r.renderDurationMs = Date.now() - t0;
      r.newProjectionId = result.outputId;
      r.qualityScore = result.qualityScore.overall;
      r.wordCount = result.qualityScore.wordCount;
      r.sectionCount = result.qualityScore.sectionCount;
      r.status = result.status;
      r.afterContent = result.content || null;

      const projectionMetrics = result.diagnostics.projectionMetrics;
      r.validationPassed = projectionMetrics?.passed ?? false;
      r.validationIssues = projectionMetrics?.issues ?? [];
      r.projectionDurationMs = result.diagnostics.renderDurationMs ?? null;
      r.compositionScore = projectionMetrics
        ? Math.max(0, 100 - (projectionMetrics.issues?.length ?? 0) * 10)
        : null;

      const { data: newOut } = await sb
        .from("rendered_outputs")
        .select("renderer_id, renderer_version, content")
        .eq("id", result.outputId!)
        .single();
      r.projectionVersion = newOut?.renderer_id ?? "long-article-v2";
      r.afterContent = newOut?.content ?? r.afterContent;

      if (!r.validationPassed && result.outputId) {
        await markOutputStatus(result.outputId, "failed");
        r.status = "validation_failed_kept_old";
        console.log(`  VALIDATION FAILED — marked new output failed, keeping old published`);
      } else if (r.validationPassed && result.outputId) {
        if (r.oldProjectionId && r.oldProjectionId !== result.outputId) {
          await markOutputStatus(r.oldProjectionId, "stale");
          console.log(`  Validation passed — marked old output stale`);
        }
        await markOutputPublished(result.outputId);
        const { publishRenderedOutput } = await import("../services/publish/service");
        const pub = await publishRenderedOutput(result.outputId, "en");
        if (!pub.success) {
          r.status = "publish_failed";
          r.validationIssues.push(`publish: ${pub.error}`);
          console.log(`  Publish failed: ${pub.error}`);
        } else {
          r.status = "published";
          console.log(`  Validation passed — published via canonical pipeline`);
        }
      }

      console.log(
        JSON.stringify(
          {
            oldId: r.oldProjectionId,
            newId: r.newProjectionId,
            validationPassed: r.validationPassed,
            qualityScore: r.qualityScore,
            renderDurationMs: r.renderDurationMs,
            issues: r.validationIssues,
          },
          null,
          2
        )
      );
    } catch (e) {
      r.status = "error";
      r.validationIssues = [String(e)];
      console.error(`  ERROR:`, e);
    }
  }

  saveResults(results);
  console.log(`\nRe-render complete. Results: ${RESULTS_PATH}`);
}

async function captureAfterSeo() {
  const results = loadResults();
  for (const r of results) {
    try {
      r.seoAfter = await fetchSeo(r.url);
      r.seoUnchanged = r.seoBefore && r.seoAfter ? seoEqual(r.seoBefore, r.seoAfter) : null;
      console.log(`AFTER SEO ${r.slug}: unchanged=${r.seoUnchanged}`);
    } catch (e) {
      console.warn(`SEO after failed for ${r.slug}:`, e);
    }
  }
  saveResults(results);
}

async function publishLiveFromResults() {
  const { createClient } = await import("@supabase/supabase-js");
  const { updateTopicTranslationContent } = await import("../services/publish/writers");
  const { serializeToMarkdown } = await import("../services/renderer/serializers/markdown");

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const results = loadResults();
  for (const r of results) {
    if (!r.newProjectionId) {
      console.log(`Skip ${r.slug}: no newProjectionId`);
      continue;
    }
    const { data: outRow } = await sb
      .from("rendered_outputs")
      .select("document_tree")
      .eq("id", r.newProjectionId)
      .single();
    const tree =
      typeof outRow?.document_tree === "string"
        ? JSON.parse(outRow.document_tree)
        : outRow?.document_tree ?? [];
    const markdown = serializeToMarkdown(tree);
    const { data: pkgRow } = await sb
      .from("knowledge_packages")
      .select("topic_id")
      .eq("id", r.packageId)
      .single();
    if (!pkgRow?.topic_id) {
      console.log(`Skip ${r.slug}: no topic_id`);
      continue;
    }
    await updateTopicTranslationContent(pkgRow.topic_id, markdown, "en");
    r.status = "published";
    console.log(`Published live markdown for ${r.slug} (${r.newProjectionId})`);
  }
  saveResults(results);
}

async function main() {
  const mode = process.argv[2] ?? "all";
  if (mode === "--before-only" || mode === "before") {
    await captureBeforeState();
  } else if (mode === "--rerender" || mode === "rerender") {
    await rerenderAll();
  } else if (mode === "--publish-live" || mode === "publish-live") {
    await publishLiveFromResults();
  } else if (mode === "--after-meta" || mode === "after-meta") {
    await captureAfterSeo();
  } else {
    await captureBeforeState();
    await rerenderAll();
    await captureAfterSeo();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
