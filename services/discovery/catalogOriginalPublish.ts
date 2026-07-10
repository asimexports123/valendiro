/**
 * Publish original catalog content — brain-only pipeline.
 *
 * Flow: crawl fuel → brain understand → assemble → render → scoring engine pass → publish
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { assemble } from "@/services/knowledge/assembler";
import { renderPackage } from "@/services/render/engine";
import { publishRenderedOutput } from "@/services/publish/service";
import { projectPackageToGraph } from "@/services/knowledge/graphService";
import {
  authorizeBrainTopicPublish,
  revokeBrainTopicPublish,
} from "@/lib/architecture/canonicalPublishGuard";
import {
  selectCatalogPublishTargets,
  type CatalogTopicTarget,
} from "./catalogHierarchy";
import { MIN_FUEL_SOURCES } from "./brainQualityGate";
import { PHASE_1_SEED_SLUG_SET } from "@/config/phase1SeedTopics";
import { FLAGSHIP_TOPIC_SLUGS } from "@/config/flagshipTopics";
import {
  countWords,
  detectDummyContent,
} from "@/services/knowledge/contentQualityGate";
import { gatherExternalWorldFuel } from "./brainExternalFuel";
import { prepareBrainCandidates } from "./brainAssemble";
import { renderBrainMarkdownPackage } from "./brainMarkdownRender";
import { scoreInternalContent } from "./internalContentScorer";
import { isBrainAutoPublishEnabled } from "./brainPublishMode";

export interface OriginalPublishResult {
  topicSlug: string;
  topicId: string;
  status: "published" | "skipped" | "failed" | "ready";
  reason?: string;
  wordCount?: number;
  qualityScore?: number;
  internalScore?: number;
  rewriteEngine?: "brain";
}

async function publishOriginalTopic(target: CatalogTopicTarget): Promise<OriginalPublishResult> {
  try {
    const fuel = await gatherExternalWorldFuel(target);
    const totalFuelChars = fuel.texts.reduce((sum, t) => sum + t.length, 0);
    const isSeed = PHASE_1_SEED_SLUG_SET.has(target.slug);
    const minSources = MIN_FUEL_SOURCES;
    const minChars = isSeed ? 2500 : 3500;

    if (fuel.sourceCount < minSources || totalFuelChars < minChars) {
      return {
        topicSlug: target.slug,
        topicId: target.topicId,
        status: "skipped",
        reason: `fuel thin: ${fuel.sourceCount} sources / ${totalFuelChars} chars (need ${minSources}+ / ${minChars}+)`,
      };
    }
    if (fuel.hasDefinitionSignal === false) {
      return {
        topicSlug: target.slug,
        topicId: target.topicId,
        status: "skipped",
        reason: "fuel lacks definition signal — crawler must supply What-is-X text before Brain writes",
      };
    }
    if (!fuel.teachingCoverage?.pass) {
      const missing = fuel.teachingCoverage?.missing?.join(",") || "what/why/how/where";
      return {
        topicSlug: target.slug,
        topicId: target.topicId,
        status: "skipped",
        reason: `fuel lacks teaching coverage (missing: ${missing}) — need What + Why/How + Where before Brain writes; thin fuel would only chipak`,
      };
    }

    const prepared = prepareBrainCandidates(target, fuel);
    if (prepared.candidates.length === 0) {
      return {
        topicSlug: target.slug,
        topicId: target.topicId,
        status: "skipped",
        reason: prepared.reason ?? "brain could not prepare candidates",
      };
    }

    const report = await assemble({
      slotId: null,
      topicId: target.topicId,
      slug: target.slug,
      candidates: prepared.candidates,
    });

    if (!report.packageId) {
      return {
        topicSlug: target.slug,
        topicId: target.topicId,
        status: "failed",
        reason: "brain assemble failed",
      };
    }

    process.env.ALLOW_RENDER = "true";

    const rendered = prepared.brainMarkdown
      ? await renderBrainMarkdownPackage({
          packageId: report.packageId,
          knowledgeHash: report.knowledgeHash,
          slug: target.slug,
          markdown: prepared.brainMarkdown,
        }).then((r) => ({
          outputId: r.outputId,
          content: r.content,
          qualityScore: r.qualityScore,
          cached: false,
          status: "published" as const,
          format: "markdown" as const,
          diagnostics: r.diagnostics,
        }))
      : await renderPackage({
          packageId: report.packageId,
          format: "markdown",
          forceRerender: true,
          policyMode: "strict",
          rendererId: "long-article",
        });

    if (!rendered.outputId || !rendered.content) {
      return {
        topicSlug: target.slug,
        topicId: target.topicId,
        status: "failed",
        reason: "brain render failed",
      };
    }

    const sb = createAdminClient();
    const { data: topicRow } = await sb
      .from("topics")
      .select("topic_translations(content)")
      .eq("id", target.topicId)
      .eq("topic_translations.language_code", "en")
      .maybeSingle();

    const beforeContent = topicRow?.topic_translations?.[0]?.content ?? "";
    const wordsBefore = countWords(beforeContent);
    const dummyBefore = detectDummyContent(beforeContent);

    const eligibility = scoreInternalContent({
      content: rendered.content,
      sourceTexts:
        prepared.notes.allFacts.length > 0 ? prepared.notes.allFacts : fuel.texts,
      topicTitle: target.title,
      isSeed,
      wordsBefore: dummyBefore ? undefined : wordsBefore,
      // Dense teaching gens are often shorter than older padded articles — not a quality failure
      ignoreRegression: Boolean(
        dummyBefore ||
          wordsBefore < 100 ||
          PHASE_1_SEED_SLUG_SET.has(target.slug) ||
          FLAGSHIP_TOPIC_SLUGS.includes(target.slug)
      ),
    });

    if (!eligibility.passed) {
      const prefix = eligibility.criticalFail ? "internal scoring (critical)" : "internal scoring";
      return {
        topicSlug: target.slug,
        topicId: target.topicId,
        status: "skipped",
        reason: `${prefix}: ${eligibility.overallScore}/100 — ${eligibility.failures.join("; ")}`,
        wordCount: eligibility.wordCount,
        qualityScore: rendered.qualityScore?.overall
          ? Math.round(
              typeof rendered.qualityScore.overall === "number" && rendered.qualityScore.overall <= 1
                ? rendered.qualityScore.overall * 100
                : rendered.qualityScore.overall
            )
          : undefined,
        internalScore: eligibility.overallScore,
      };
    }

    if (!isBrainAutoPublishEnabled()) {
      return {
        topicSlug: target.slug,
        topicId: target.topicId,
        status: "ready",
        reason: `auto-publish off — passed ${eligibility.overallScore}/100 (not live)`,
        wordCount: eligibility.wordCount,
        internalScore: eligibility.overallScore,
        rewriteEngine: "brain",
      };
    }

    authorizeBrainTopicPublish();
    try {
      const pubResult = await publishRenderedOutput(rendered.outputId, "en");
      if (!pubResult.success) {
        return {
          topicSlug: target.slug,
          topicId: target.topicId,
          status: "failed",
          reason: pubResult.error ?? "publish failed",
        };
      }
    } finally {
      revokeBrainTopicPublish();
    }

    await projectPackageToGraph(report.packageId, target.topicId, rendered.content).catch(() => undefined);

    await sb
      .from("knowledge_packages")
      .update({ last_verified_at: new Date().toISOString() })
      .eq("id", report.packageId);

    return {
      topicSlug: target.slug,
      topicId: target.topicId,
      status: "published",
      wordCount: eligibility.wordCount,
      qualityScore: rendered.qualityScore?.overall
        ? Math.round(
            typeof rendered.qualityScore.overall === "number" && rendered.qualityScore.overall <= 1
              ? rendered.qualityScore.overall * 100
              : rendered.qualityScore.overall
          )
        : eligibility.overallScore,
      internalScore: eligibility.overallScore,
      rewriteEngine: "brain",
    };
  } catch (err) {
    return {
      topicSlug: target.slug,
      topicId: target.topicId,
      status: "failed",
      reason: err instanceof Error ? err.message : String(err),
    };
  }
}

async function loadTopicTarget(slug: string): Promise<CatalogTopicTarget | null> {
  const sb = createAdminClient();
  const { data: row } = await sb
    .from("topics")
    .select(
      "id, slug, category_id, subcategory_id, topic_translations(title, content)"
    )
    .eq("slug", slug)
    .eq("topic_translations.language_code", "en")
    .maybeSingle();

  if (!row) return null;

  const trans = row.topic_translations?.[0];
  const content = trans?.content ?? "";
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

  let categorySlug: string | null = null;
  let categoryTitle: string | null = null;
  if (row.category_id) {
    const { data: cat } = await sb
      .from("categories")
      .select("slug, category_translations(name)")
      .eq("id", row.category_id)
      .eq("category_translations.language_code", "en")
      .maybeSingle();
    categorySlug = cat?.slug ?? null;
    categoryTitle = cat?.category_translations?.[0]?.name ?? cat?.slug ?? null;
  }

  let subcategorySlug: string | null = null;
  let subcategoryTitle: string | null = null;
  if (row.subcategory_id) {
    const { data: sub } = await sb
      .from("subcategories")
      .select("slug, subcategory_translations(name)")
      .eq("id", row.subcategory_id)
      .eq("subcategory_translations.language_code", "en")
      .maybeSingle();
    subcategorySlug = sub?.slug ?? null;
    subcategoryTitle = sub?.subcategory_translations?.[0]?.name ?? sub?.slug ?? null;
  }

  const { data: pkg } = await sb
    .from("knowledge_packages")
    .select("fact_count")
    .eq("topic_id", row.id)
    .eq("status", "ready")
    .order("fact_count", { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    topicId: row.id,
    slug: row.slug,
    title: trans?.title ?? row.slug,
    wordCount,
    factCount: pkg?.fact_count ?? 0,
    categorySlug,
    categoryTitle,
    subcategorySlug,
    subcategoryTitle,
    priorityScore: 100,
    reason: "single-slug publish",
  };
}

/** Publish one topic by slug through the canonical Brain pipeline. */
export async function publishOriginalTopicBySlug(slug: string): Promise<OriginalPublishResult> {
  const target = await loadTopicTarget(slug);
  if (!target) {
    return {
      topicSlug: slug,
      topicId: "",
      status: "failed",
      reason: "topic not found",
    };
  }
  return publishOriginalTopic(target);
}

export async function publishOriginalCatalogBatch(
  limit = 5,
  options?: { seedOnly?: boolean }
): Promise<{
  processed: number;
  published: number;
  skipped: number;
  failed: number;
  results: OriginalPublishResult[];
}> {
  const targets = await selectCatalogPublishTargets(limit, options);
  const results: OriginalPublishResult[] = [];

  for (const target of targets) {
    results.push(await publishOriginalTopic(target));
  }

  return {
    processed: results.length,
    published: results.filter((r) => r.status === "published").length,
    skipped: results.filter((r) => r.status === "skipped").length,
    failed: results.filter((r) => r.status === "failed").length,
    results,
  };
}
