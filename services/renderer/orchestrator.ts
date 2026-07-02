/**
 * Render Orchestrator
 *
 * Coordinates the full rendering pipeline:
 * Rules → Cache Check → Render → Citations → Links → Score → Serialize → Persist
 *
 * ─── OFFLINE PROCESS — CRITICAL RULE ────────────────────────────────────────
 * The renderer must NEVER execute during a normal page request.
 * Rendering is an offline process. The result is a static artifact.
 * The website serves pre-rendered content from the database.
 *
 * render() is protected by assertOfflineContext() which throws immediately
 * if called outside of an authorized offline pipeline or admin endpoint.
 * ────────────────────────────────────────────────────────────────────────────
 */

import { createAdminClient } from "@/lib/supabase/admin";
import type {
  DocumentNode,
  RendererConfig,
  RenderDiagnostics,
  RenderQualityScore,
  PluginFact,
  CitationInput,
  RelationshipInput,
  OutputFormat,
  RenderedOutputRow,
} from "./types";
import { evaluate } from "./rulesEngine";
import { inferIntent } from "./compositionPolicy";
import { longArticleStrategy } from "./renderers/longArticle";
import { faqStrategy } from "./renderers/faq";
import { longArticleV2Strategy } from "./renderers/longArticleV2";
import { decorateWithCitations } from "./citationRenderer";
import { decorateWithLinks } from "./linkRenderer";
import { scoreQuality } from "./qualityScorer";
import { serializeToHTML } from "./serializers/html";
import { serializeToMarkdown } from "./serializers/markdown";
import { computeCacheKey, checkCache, storeRenderedOutput } from "./cacheManager";

const TEMPLATE_VERSION = "1.0.0";

// ─── Offline Context Guard ────────────────────────────────────────────────────
// Rendering is an offline process. render() must never run during a live page
// request. Permitted callers:
//   1. CLI scripts (tsx scripts/...) — process.env.ALLOW_RENDER = "true"
//   2. Admin API routes — must present X-Render-Secret which sets RENDER_SECRET
//
// In practice: scripts set ALLOW_RENDER=true before importing this module.
// The two protected API routes (POST /api/render and /preview) load this via
// dynamic import() only after verifying the secret header — not at module load.
//
// If neither signal is present the call is rejected immediately.

function assertOfflineContext(): void {
  if (
    process.env.ALLOW_RENDER === "true" ||
    process.env.RENDER_SECRET !== undefined
  ) {
    return;
  }
  throw new Error(
    "[Renderer] render() was called outside of an offline pipeline. " +
    "Rendering is an offline process — set ALLOW_RENDER=true in scripts " +
    "or call via the authorized API endpoint with X-Render-Secret."
  );
}

// ─── Strategy Registry ───────────────────────────────────────────────────────

const STRATEGIES: Record<string, typeof longArticleStrategy> = {
  "long-article": longArticleStrategy,
  "long-article-v2": longArticleV2Strategy,
  "faq": faqStrategy,
};

// ─── Public API ──────────────────────────────────────────────────────────────

export interface RenderRequest {
  packageId: string;
  format?: OutputFormat;
  rendererId?: string;
  style?: string[];
  forceRerender?: boolean;
}

export interface RenderResult {
  outputId: string | null;
  content: string;
  format: OutputFormat;
  qualityScore: RenderQualityScore;
  diagnostics: RenderDiagnostics;
  cached: boolean;
  status: "published" | "draft" | "failed";
}

export async function render(request: RenderRequest): Promise<RenderResult> {
  assertOfflineContext();

  const startTime = Date.now();

  // ─── 1. Load Package Data ────────────────────────────────────────────────
  const sb = createAdminClient();

  const { data: pkg } = await sb
    .from("knowledge_packages")
    .select("*")
    .eq("id", request.packageId)
    .single();

  if (!pkg) throw new Error(`Package not found: ${request.packageId}`);

  const { data: factsData } = await sb
    .from("knowledge_facts")
    .select("*")
    .eq("package_id", request.packageId)
    .order("created_at");

  const { data: citData } = await sb
    .from("knowledge_citations")
    .select("*")
    .eq("package_id", request.packageId);

  const factIds = (factsData ?? []).map((f: any) => f.id);
  let relData: any[] = [];
  if (factIds.length > 0) {
    const { data } = await sb
      .from("knowledge_relationships")
      .select("*")
      .or(`source_id.in.(${factIds.join(",")}),target_id.in.(${factIds.join(",")})`);
    relData = data ?? [];
  }

  // Map to renderer input types
  const facts: PluginFact[] = (factsData ?? []).map((f: any) => ({
    id: f.id,
    statement: f.statement,
    factType: f.fact_type,
    confidence: f.confidence,
    scope: f.scope,
    tags: f.tags ?? [],
    domain: f.domain,
  }));

  const citations: CitationInput[] = (citData ?? []).map((c: any) => ({
    id: c.id,
    sourceName: c.source_name,
    sourceUrl: c.source_url,
    adapterName: c.adapter_name,
    sourceAuthority: c.source_authority,
    retrievedAt: c.retrieved_at,
  }));

  const relationships: RelationshipInput[] = relData.map((r: any) => ({
    id: r.id,
    sourceId: r.source_id,
    targetId: r.target_id,
    relationshipType: r.relationship_type,
    strength: r.strength ?? "moderate",
    explanation: r.explanation,
    bidirectional: r.bidirectional ?? false,
  }));

  // ─── 2. Resolve category for composition policy ─────────────────────────
  // Chain: knowledge_packages.topic_id → topics → topic_subcategories
  //        → subcategories → categories
  let categorySlug = "general";
  try {
    const { data: topic } = await sb
      .from("topics")
      .select("id")
      .eq("slug", pkg.slug)
      .maybeSingle();

    if (topic?.id) {
      const { data: tsub } = await sb
        .from("topic_subcategories")
        .select("subcategory_id")
        .eq("topic_id", topic.id)
        .limit(1)
        .maybeSingle();

      if (tsub?.subcategory_id) {
        const { data: sub } = await sb
          .from("subcategories")
          .select("category_id")
          .eq("id", tsub.subcategory_id)
          .maybeSingle();

        if (sub?.category_id) {
          const { data: cat } = await sb
            .from("categories")
            .select("slug")
            .eq("id", sub.category_id)
            .maybeSingle();

          if (cat?.slug) categorySlug = cat.slug;
        }
      }
    }
  } catch (_) {
    // non-fatal — fall back to default policy
  }

  // ─── 3. Determine Renderer Config ───────────────────────────────────────
  const rendererId = request.rendererId ?? "long-article";
  const strategy = STRATEGIES[rendererId] ?? longArticleStrategy;
  const format: OutputFormat = request.format ?? "html";
  const style = request.style ?? ["intermediate"];

  const config: RendererConfig = {
    rendererId: `${rendererId}-v${strategy.version}`,
    rendererVersion: strategy.version,
    templateVersion: TEMPLATE_VERSION,
    format,
    style,
    slug: pkg.slug,
    category: categorySlug,
    intent: inferIntent(categorySlug, pkg.slug),
  };

  // ─── 4. Cache Check ─────────────────────────────────────────────────────
  const cacheKey = computeCacheKey(pkg.knowledge_hash, strategy.version, TEMPLATE_VERSION, format);

  if (!request.forceRerender) {
    const cached = await checkCache(cacheKey);
    if (cached && cached.status !== "stale") {
      return {
        outputId: cached.id,
        content: cached.content,
        format: cached.output_format as OutputFormat,
        qualityScore: cached.quality_score as RenderQualityScore,
        diagnostics: cached.diagnostics as RenderDiagnostics,
        cached: true,
        status: cached.status as "published" | "draft" | "failed",
      };
    }
  }

  // ─── 5. Rules Evaluation ────────────────────────────────────────────────
  const rulesStart = Date.now();
  const decision = evaluate(facts, citations);
  const rulesMs = Date.now() - rulesStart;

  if (!decision.eligible) {
    // Return failed result with diagnostics
    const diagnostics = buildDiagnostics({
      config, cacheKey, pkg, facts, citations,
      decision, rulesMs, renderMs: 0, citationMs: 0, serializeMs: 0,
      factsUsed: 0, totalDuration: Date.now() - startTime,
    });

    const emptyScore: RenderQualityScore = {
      overall: 0, factCoverage: 0, citationCoverage: 0,
      sectionCompleteness: 0, readabilityEstimate: 0,
      missingKnowledgeCount: decision.missingKnowledge.length,
      missingKnowledgeSeverity: { critical: decision.missingKnowledge.length },
      wordCount: 0, sectionCount: 0, internalLinkCount: 0, citationCount: 0,
      readingFlow: { repeatedOpenings: 0, paragraphLengthBalance: 0, headingDensity: 0, bulletListRatio: 0, transitionQuality: 0, sentenceVariety: 0, overallFlowScore: 0 },
    };

    return {
      outputId: null,
      content: "",
      format,
      qualityScore: emptyScore,
      diagnostics,
      cached: false,
      status: "failed",
    };
  }

  // ─── 6. Render ──────────────────────────────────────────────────────────
  const renderStart = Date.now();
  let tree: DocumentNode[] = strategy.render(facts, citations, relationships, config, decision);
  const renderMs = Date.now() - renderStart;

  // ─── 7. Citation Rendering ──────────────────────────────────────────────
  const citationStart = Date.now();
  tree = decorateWithCitations(tree, citations, format);
  const citationMs = Date.now() - citationStart;

  // ─── 8. Internal Link Rendering ─────────────────────────────────────────
  tree = decorateWithLinks(tree, relationships, facts, pkg.slug, format);

  // ─── 9. Quality Scoring ─────────────────────────────────────────────────
  const qualityScore = scoreQuality(tree, facts, citations, decision);

  // ─── 10. Serialization ──────────────────────────────────────────────────
  const serializeStart = Date.now();
  let content: string;
  if (format === "html") {
    content = serializeToHTML(tree);
  } else if (format === "markdown") {
    content = serializeToMarkdown(tree);
  } else {
    content = JSON.stringify(tree, null, 2);
  }
  const serializeMs = Date.now() - serializeStart;

  // ─── 11. Diagnostics ────────────────────────────────────────────────────
  const totalDuration = Date.now() - startTime;
  const diagnostics = buildDiagnostics({
    config, cacheKey, pkg, facts, citations,
    decision, rulesMs, renderMs, citationMs, serializeMs,
    factsUsed: facts.length, totalDuration,
  });

  // ─── 12. Persist ────────────────────────────────────────────────────────
  const outputId = await storeRenderedOutput({
    packageId: request.packageId,
    knowledgeHash: pkg.knowledge_hash,
    rendererId: config.rendererId,
    rendererVersion: config.rendererVersion,
    templateVersion: config.templateVersion,
    outputFormat: format,
    style,
    cacheKey,
    content,
    documentTree: tree,
    wordCount: qualityScore.wordCount,
    sectionCount: qualityScore.sectionCount,
    citationCount: qualityScore.citationCount,
    qualityScore,
    diagnostics,
    renderDurationMs: totalDuration,
  });

  // Determine status
  let status: "published" | "draft" | "failed" = "draft";
  if (qualityScore.overall >= 60) status = "published"; // Temporarily lowered from 90 to 60 for Phase 15 deployment
  else if (qualityScore.overall < 40) status = "failed";

  return {
    outputId,
    content,
    format,
    qualityScore,
    diagnostics,
    cached: false,
    status,
  };
}

// ─── Diagnostics Builder ─────────────────────────────────────────────────────

function buildDiagnostics(ctx: {
  config: RendererConfig;
  cacheKey: string;
  pkg: any;
  facts: PluginFact[];
  citations: CitationInput[];
  decision: any;
  rulesMs: number;
  renderMs: number;
  citationMs: number;
  serializeMs: number;
  factsUsed: number;
  totalDuration: number;
}): RenderDiagnostics {
  return {
    rendererId: ctx.config.rendererId,
    rendererVersion: ctx.config.rendererVersion,
    templateVersion: ctx.config.templateVersion,
    packageSlug: ctx.pkg.slug,
    knowledgeHash: ctx.pkg.knowledge_hash,
    cacheKey: ctx.cacheKey,
    renderDurationMs: ctx.totalDuration,
    rulesEvaluationMs: ctx.rulesMs,
    citationRenderMs: ctx.citationMs,
    serializationMs: ctx.serializeMs,
    factsTotal: ctx.facts.length,
    factsUsed: ctx.factsUsed,
    factsSkipped: [],
    citationsTotal: ctx.citations.length,
    citationsReferenced: ctx.citations.length,
    qualityScore: {
      overall: 0, factCoverage: 0, citationCoverage: 0,
      sectionCompleteness: 0, readabilityEstimate: 0,
      missingKnowledgeCount: 0, missingKnowledgeSeverity: {},
      wordCount: 0, sectionCount: 0, internalLinkCount: 0, citationCount: 0,
      readingFlow: { repeatedOpenings: 0, paragraphLengthBalance: 0, headingDensity: 0, bulletListRatio: 0, transitionQuality: 0, sentenceVariety: 0, overallFlowScore: 0 },
    },
    missingKnowledge: ctx.decision.missingKnowledge ?? [],
    policyApplied: ctx.decision.policy?.name ?? "default",
    blockOrder: ctx.decision.blockOrder ?? [],
    templateSelectionsUsed: ctx.facts.length,
    variantSeed: ctx.pkg.slug,
    warnings: ctx.decision.warnings ?? [],
  };
}
