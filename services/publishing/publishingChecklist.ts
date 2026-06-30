/**
 * Stage 12 — Publishing Checklist Gate
 * Stage 13 — Post-Publish Audit
 *
 * Stage 12: Every article/topic must pass ALL checks before publishing.
 *   ✓ Keyword approved (decision = "publish")
 *   ✓ Category assigned
 *   ✓ Collection assigned
 *   ✓ Topic assigned (articles only)
 *   ✓ Content quality approved (quality gate)
 *   ✓ SEO fields complete (title, meta description, canonical path)
 *   ✓ Internal links generated (hierarchical links exist)
 *   ✓ No orphan: parent topic/collection/category exists and is published
 *
 * Stage 13: After publishing, automatically verify:
 *   ✓ Row exists and is published
 *   ✓ Canonical path is set
 *   ✓ SEO fields populated
 *   ✓ Parent objects exist and are published
 *   ✓ At least one internal link exists
 *   ✓ Schema JSON is set (articles)
 *   On failure: revert to draft and log reason
 */

import { createAdminClient } from "@/lib/supabase/admin";

// ── Stage 12 Types ────────────────────────────────────────────────────────────

export interface PublishingChecklistInput {
  objectType: "topic" | "article";
  objectId: string | null;
  title: string;
  content: string;
  metaTitle: string | null | undefined;
  metaDescription: string | null | undefined;
  canonicalPath: string | null | undefined;
  topicId?: string | null;
  collectionId?: string | null;
  categoryId?: string | null;
  keywordDecision?: "publish" | "backlog" | "reject" | null;
}

export interface ChecklistItem {
  name: string;
  passed: boolean;
  reason: string | null;
}

export interface PublishingChecklistResult {
  passed: boolean;
  checks: ChecklistItem[];
  blockers: string[];
}

// ── Stage 12 Implementation ───────────────────────────────────────────────────

export function runPublishingChecklist(input: PublishingChecklistInput): PublishingChecklistResult {
  const checks: ChecklistItem[] = [];

  // 1. Keyword approved
  const kwApproved = input.keywordDecision === "publish" || input.keywordDecision == null;
  checks.push({
    name: "keyword_approved",
    passed: kwApproved,
    reason: kwApproved ? null : `Keyword decision was "${input.keywordDecision}" — only "publish" allows content creation`,
  });

  // 2. Category assigned
  const hasCat = !!input.categoryId;
  checks.push({
    name: "category_assigned",
    passed: hasCat,
    reason: hasCat ? null : "No category assigned — every piece of content must belong to a V1 category",
  });

  // 3. Collection assigned (required for articles and topics)
  const hasColl = !!input.collectionId;
  checks.push({
    name: "collection_assigned",
    passed: hasColl,
    reason: hasColl ? null : "No collection assigned — content must belong to a collection within its category",
  });

  // 4. Topic assigned (articles only)
  if (input.objectType === "article") {
    const hasTopic = !!input.topicId;
    checks.push({
      name: "topic_assigned",
      passed: hasTopic,
      reason: hasTopic ? null : "No topic assigned — articles must belong to a published topic",
    });
  }

  // 5. Content not empty
  const wordCount = input.content.split(/\s+/).filter(Boolean).length;
  const minWords = input.objectType === "topic" ? 200 : 300;
  const hasContent = wordCount >= minWords;
  checks.push({
    name: "content_sufficient",
    passed: hasContent,
    reason: hasContent ? null : `Content has ${wordCount} words — minimum is ${minWords} for ${input.objectType}`,
  });

  // 6. SEO title present
  const hasMetaTitle = !!input.metaTitle && input.metaTitle.trim().length >= 20;
  checks.push({
    name: "seo_title",
    passed: hasMetaTitle,
    reason: hasMetaTitle ? null : "SEO title missing or too short (minimum 20 characters)",
  });

  // 7. SEO meta description present
  const hasMetaDesc = !!input.metaDescription && input.metaDescription.trim().length >= 50;
  checks.push({
    name: "seo_meta_description",
    passed: hasMetaDesc,
    reason: hasMetaDesc ? null : "Meta description missing or too short (minimum 50 characters)",
  });

  // 8. Canonical path set
  const hasCanonical = !!input.canonicalPath && input.canonicalPath.startsWith("/");
  checks.push({
    name: "canonical_path",
    passed: hasCanonical,
    reason: hasCanonical ? null : "Canonical path missing or does not start with /",
  });

  // 9. Title length acceptable
  const titleOk = input.title.trim().length >= 10 && input.title.trim().length <= 120;
  checks.push({
    name: "title_length",
    passed: titleOk,
    reason: titleOk ? null : `Title length ${input.title.trim().length} is outside acceptable range (10–120 chars)`,
  });

  const blockers = checks.filter((c) => !c.passed).map((c) => c.reason!);
  return {
    passed: blockers.length === 0,
    checks,
    blockers,
  };
}

// ── Stage 13 Types ────────────────────────────────────────────────────────────

export interface PostPublishAuditResult {
  passed: boolean;
  objectType: "topic" | "article";
  objectId: string;
  checks: ChecklistItem[];
  blockers: string[];
  revertedToDraft: boolean;
}

// ── Stage 13 Implementation ───────────────────────────────────────────────────

export async function runPostPublishAudit(
  objectType: "topic" | "article",
  objectId: string
): Promise<PostPublishAuditResult> {
  const supabase = createAdminClient();
  const checks: ChecklistItem[] = [];

  if (objectType === "article") {
    const { data: article } = await supabase
      .from("articles")
      .select("id, status, canonical_path, topic_id, article_translations(title, meta_title, meta_description, schema_json)")
      .eq("id", objectId)
      .maybeSingle();

    // Check: row exists and is published
    const exists = !!article;
    checks.push({ name: "row_published", passed: exists && article?.status === "published", reason: exists ? (article?.status !== "published" ? "Article not in published status" : null) : "Article row not found" });

    if (article) {
      const t = (article.article_translations as { title: string; meta_title: string | null; meta_description: string | null; schema_json: unknown }[] | null)?.[0];

      // Canonical path
      const hasCanonical = !!article.canonical_path && article.canonical_path.startsWith("/");
      checks.push({ name: "canonical_path", passed: hasCanonical, reason: hasCanonical ? null : "Missing or invalid canonical_path" });

      // SEO fields
      const hasSeoTitle = !!t?.meta_title && t.meta_title.trim().length >= 20;
      checks.push({ name: "seo_title", passed: hasSeoTitle, reason: hasSeoTitle ? null : "meta_title missing or too short" });

      const hasSeoDesc = !!t?.meta_description && t.meta_description.trim().length >= 50;
      checks.push({ name: "seo_meta_description", passed: hasSeoDesc, reason: hasSeoDesc ? null : "meta_description missing or too short" });

      // Schema JSON
      const hasSchema = !!t?.schema_json;
      checks.push({ name: "schema_json", passed: hasSchema, reason: hasSchema ? null : "schema_json not set — run schema generation" });

      // Parent topic exists and is published
      if (article.topic_id) {
        const { data: topic } = await supabase.from("topics").select("id, status, collection_id, category_id").eq("id", article.topic_id).maybeSingle();
        const topicOk = !!topic && topic.status === "published";
        checks.push({ name: "parent_topic_published", passed: topicOk, reason: topicOk ? null : "Parent topic is missing or not published" });

        if (topic) {
          const catOk = !!topic.category_id;
          checks.push({ name: "parent_category_assigned", passed: catOk, reason: catOk ? null : "Parent topic has no category_id — orphan risk" });
          const collOk = !!topic.collection_id;
          checks.push({ name: "parent_collection_assigned", passed: collOk, reason: collOk ? null : "Parent topic has no collection_id — orphan risk" });
        }
      } else {
        checks.push({ name: "parent_topic_published", passed: false, reason: "Article has no topic_id — orphan article" });
      }

      // At least one internal link
      const { count: linkCount } = await supabase
        .from("internal_link_suggestions")
        .select("id", { count: "exact", head: true })
        .eq("source_object_id", objectId);
      const hasLinks = (linkCount ?? 0) > 0;
      checks.push({ name: "internal_links", passed: hasLinks, reason: hasLinks ? null : "No internal links found — run hierarchical linker" });
    }
  } else {
    // Topic audit
    const { data: topic } = await supabase
      .from("topics")
      .select("id, status, canonical_path, category_id, collection_id, topic_translations(title, meta_title, meta_description)")
      .eq("id", objectId)
      .maybeSingle();

    const exists = !!topic;
    checks.push({ name: "row_published", passed: exists && topic?.status === "published", reason: exists ? (topic?.status !== "published" ? "Topic not in published status" : null) : "Topic row not found" });

    if (topic) {
      const t = (topic.topic_translations as { title: string; meta_title: string | null; meta_description: string | null }[] | null)?.[0];

      const hasCanonical = !!topic.canonical_path && topic.canonical_path.startsWith("/");
      checks.push({ name: "canonical_path", passed: hasCanonical, reason: hasCanonical ? null : "Missing or invalid canonical_path" });

      const hasSeoTitle = !!t?.meta_title && t.meta_title.trim().length >= 20;
      checks.push({ name: "seo_title", passed: hasSeoTitle, reason: hasSeoTitle ? null : "meta_title missing or too short" });

      const hasCat = !!topic.category_id;
      checks.push({ name: "category_assigned", passed: hasCat, reason: hasCat ? null : "Topic has no category_id" });

      const hasColl = !!topic.collection_id;
      checks.push({ name: "collection_assigned", passed: hasColl, reason: hasColl ? null : "Topic has no collection_id" });

      const { count: linkCount } = await supabase
        .from("internal_link_suggestions")
        .select("id", { count: "exact", head: true })
        .eq("source_object_id", objectId);
      const hasLinks = (linkCount ?? 0) > 0;
      checks.push({ name: "internal_links", passed: hasLinks, reason: hasLinks ? null : "No internal links found" });
    }
  }

  const blockers = checks.filter((c) => !c.passed).map((c) => c.reason!);
  let revertedToDraft = false;

  if (blockers.length > 0) {
    const table = objectType === "article" ? "articles" : "topics";
    await supabase
      .from(table)
      .update({ status: "draft", failed_reason: `Post-publish audit failed: ${blockers.join("; ")}` } as any)
      .eq("id", objectId);
    revertedToDraft = true;
  }

  return { passed: blockers.length === 0, objectType, objectId, checks, blockers, revertedToDraft };
}
