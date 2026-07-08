/**
 * Rebuild a single topic from autonomous web acquisition (authority-first).
 * Will NOT publish thin, dummy, or regressed content.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { analyzePackageGaps } from "./packageGapAnalyzer";
import { seekKnowledgeForGaps } from "./webKnowledgeSeeker";
import { assemble } from "@/services/knowledge/assembler";
import { filterRelevantCandidates } from "@/services/knowledge/relevanceGate";
import { evaluatePublishEligibility, countWords } from "@/services/knowledge/contentQualityGate";
import { renderPackage } from "@/services/render/engine";
import { publishRenderedOutput } from "@/services/publish/service";

export interface RebuildResult {
  slug: string;
  success: boolean;
  wordsBefore: number;
  wordsAfter: number;
  published: boolean;
  error?: string;
}

export async function rebuildTopicFromAuthority(slug: string): Promise<RebuildResult> {
  const sb = createAdminClient();

  const { data: topic } = await sb
    .from("topics")
    .select("id, slug, topic_translations(title, content)")
    .eq("slug", slug)
    .eq("topic_translations.language_code", "en")
    .maybeSingle();

  if (!topic) {
    return { slug, success: false, wordsBefore: 0, wordsAfter: 0, published: false, error: "Topic not found" };
  }

  const title = topic.topic_translations?.[0]?.title ?? slug;
  const beforeContent = topic.topic_translations?.[0]?.content ?? "";
  const wordsBefore = countWords(beforeContent);

  try {
    const gapReport = await analyzePackageGaps(topic.id);
    const acquired = await seekKnowledgeForGaps(gapReport);
    const { kept } = filterRelevantCandidates(acquired, slug, title);

    if (kept.length === 0) {
      return { slug, success: false, wordsBefore, wordsAfter: wordsBefore, published: false, error: "No relevant sources acquired" };
    }

    const report = await assemble({
      slotId: null,
      topicId: topic.id,
      slug,
      candidates: kept,
    });

    if (!report.packageId) {
      return { slug, success: false, wordsBefore, wordsAfter: wordsBefore, published: false, error: "Assembly failed" };
    }

    process.env.ALLOW_RENDER = "true";
    const rendered = await renderPackage({
      packageId: report.packageId,
      format: "markdown",
      forceRerender: true,
      policyMode: "strict",
      rendererId: "long-article",
    });

    if (!rendered.outputId || !rendered.content) {
      return { slug, success: false, wordsBefore, wordsAfter: wordsBefore, published: false, error: "Render failed" };
    }

    const eligibility = evaluatePublishEligibility({
      content: rendered.content,
      qualityScoreRaw: rendered.qualityScore?.overall,
      wordsBefore,
    });

    if (!eligibility.allowed) {
      return {
        slug,
        success: false,
        wordsBefore,
        wordsAfter: eligibility.wordCount,
        published: false,
        error: `Publish blocked: ${eligibility.reasons.join("; ")}`,
      };
    }

    const pub = await publishRenderedOutput(rendered.outputId, "en");
    if (!pub.success) {
      return { slug, success: false, wordsBefore, wordsAfter: eligibility.wordCount, published: false, error: pub.error ?? "Publish failed" };
    }

    await sb
      .from("topics")
      .update({ status: "published", updated_at: new Date().toISOString() })
      .eq("id", topic.id);

    const wordsAfter = countWords(rendered.content);

    return { slug, success: true, wordsBefore, wordsAfter, published: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { slug, success: false, wordsBefore, wordsAfter: wordsBefore, published: false, error: message };
  }
}
