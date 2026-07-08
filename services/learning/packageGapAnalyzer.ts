/**
 * Package Gap Analyzer — what knowledge is missing from a topic's package?
 *
 * Drives purpose-driven acquisition: every crawl answers a known gap.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import {
  computeKnowledgePackageMetrics,
  type KnowledgePackageQualityMetrics,
} from "@/services/knowledge/knowledgePackageMetrics";
import type { FactType } from "@/lib/types";

const REQUIRED_FACT_TYPES: FactType[] = [
  "definition",
  "property",
  "procedural",
  "warning",
  "rule",
  "comparison",
  "causal",
  "measurement",
];

/** Topic is excellent — stop enriching, move on. */
export const EXCELLENCE_THRESHOLDS = {
  knowledgeRichness: 70,
  completenessScore: 70,
  wordCount: 1200,
  factCount: 25,
  citationCoverage: 60,
};

export interface KnowledgeGap {
  type: "missing_fact_type" | "low_citations" | "low_sources" | "thin_content" | "no_relationships";
  detail: string;
  severity: number;
  searchHint: string;
}

export interface PackageGapReport {
  topicId: string;
  slug: string;
  title: string;
  categorySlug: string | null;
  subcategorySlug: string | null;
  packageId: string | null;
  wordCount: number;
  metrics: KnowledgePackageQualityMetrics | null;
  gaps: KnowledgeGap[];
  weaknessScore: number;
  isExcellent: boolean;
  searchQueries: string[];
}

export async function analyzePackageGaps(topicId: string): Promise<PackageGapReport> {
  const sb = createAdminClient();

  const { data: topic } = await sb
    .from("topics")
    .select("id, slug, category_id, subcategory_id, topic_translations(title, content)")
    .eq("id", topicId)
    .eq("topic_translations.language_code", "en")
    .maybeSingle();

  if (!topic) throw new Error(`Topic not found: ${topicId}`);

  const trans = topic.topic_translations?.[0];
  const title = trans?.title ?? topic.slug;
  const content = trans?.content ?? "";
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

  let categorySlug: string | null = null;
  let subcategorySlug: string | null = null;
  if (topic.category_id) {
    const { data: cat } = await sb.from("categories").select("slug").eq("id", topic.category_id).maybeSingle();
    categorySlug = cat?.slug ?? null;
  }
  if (topic.subcategory_id) {
    const { data: sub } = await sb.from("subcategories").select("slug").eq("id", topic.subcategory_id).maybeSingle();
    subcategorySlug = sub?.slug ?? null;
  }

  const { data: pkg } = await sb
    .from("knowledge_packages")
    .select("id")
    .eq("topic_id", topicId)
    .eq("status", "ready")
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  let metrics: KnowledgePackageQualityMetrics | null = null;
  const gaps: KnowledgeGap[] = [];

  if (pkg) {
    const { data: facts } = await sb
      .from("knowledge_facts")
      .select("statement, fact_type, confidence, tags, domain")
      .eq("package_id", pkg.id);

    const { data: citations } = await sb
      .from("knowledge_citations")
      .select("id, source_name, source_url, adapter_name, source_authority")
      .eq("package_id", pkg.id);

    const { data: rels } = await sb
      .from("knowledge_relationships")
      .select("relationship_type")
      .eq("package_id", pkg.id);

    metrics = computeKnowledgePackageMetrics({
      facts: (facts ?? []).map((f) => ({
        statement: f.statement,
        normalizedStatement: f.statement.toLowerCase(),
        factType: f.fact_type,
        confidence: f.confidence,
        domain: f.domain,
        scope: "contextual" as const,
        tags: f.tags ?? [],
        evidences: [],
        provenances: [],
      })),
      relationships: (rels ?? []).map((_, i) => ({
        sourceIndex: i,
        targetIndex: i + 1,
        type: "related_to" as const,
        sourceLevel: "fact" as const,
        targetLevel: "fact" as const,
        strength: "moderate" as const,
        explanation: "",
        bidirectional: true,
      })),
      citations: (citations ?? []).map((c) => ({
        candidateId: c.id,
        sourceName: c.source_name,
        sourceUrl: c.source_url,
        adapterName: c.adapter_name,
        extractionMethod: "",
        sourceAuthority: (c.source_authority as "official" | "encyclopedic" | "community") ?? "community",
      })),
      conflicts: [],
    });

    for (const factType of REQUIRED_FACT_TYPES) {
      if (!(metrics.factTypeDistribution[factType] ?? 0)) {
        gaps.push({
          type: "missing_fact_type",
          detail: `Missing ${factType} facts`,
          severity: factType === "definition" ? 90 : 60,
          searchHint: `${title} ${factType.replace("_", " ")}`,
        });
      }
    }

    if (metrics.citationCoverage < 50) {
      gaps.push({
        type: "low_citations",
        detail: `Citation coverage ${metrics.citationCoverage}%`,
        severity: 70,
        searchHint: `${title} official documentation`,
      });
    }

    if (metrics.sourceCount < 2) {
      gaps.push({
        type: "low_sources",
        detail: `Only ${metrics.sourceCount} source(s)`,
        severity: 65,
        searchHint: `${title} comprehensive guide`,
      });
    }

    if ((rels?.length ?? 0) < 3) {
      gaps.push({
        type: "no_relationships",
        detail: "Few knowledge relationships",
        severity: 40,
        searchHint: `${title} concepts explained`,
      });
    }
  }

  if (wordCount < 600) {
    gaps.push({
      type: "thin_content",
      detail: `Only ${wordCount} words published`,
      severity: 85,
      searchHint: `${title} complete guide tutorial`,
    });
  }

  gaps.sort((a, b) => b.severity - a.severity);

  const isExcellent =
    !!metrics &&
    metrics.knowledgeRichness >= EXCELLENCE_THRESHOLDS.knowledgeRichness &&
    metrics.completenessScore >= EXCELLENCE_THRESHOLDS.completenessScore &&
    wordCount >= EXCELLENCE_THRESHOLDS.wordCount &&
    metrics.factCount >= EXCELLENCE_THRESHOLDS.factCount &&
    metrics.citationCoverage >= EXCELLENCE_THRESHOLDS.citationCoverage;

  const weaknessScore = isExcellent
    ? 0
    : gaps.reduce((s, g) => s + g.severity, 0) + (100 - (metrics?.knowledgeRichness ?? 10));

  const searchQueries = [...new Set(gaps.slice(0, 4).map((g) => g.searchHint))];

  return {
    topicId,
    slug: topic.slug,
    title,
    categorySlug,
    subcategorySlug,
    packageId: pkg?.id ?? null,
    wordCount,
    metrics,
    gaps,
    weaknessScore,
    isExcellent,
    searchQueries,
  };
}
