/**
 * Canonical Publication Service
 *
 * Sole public API for publishing topics and translations in production.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { PublicationPipeline } from "@/services/publication/publicationPipeline";
import { generateCanonicalSlug } from "@/services/discovery/canonicalTopicService";
import { v4 as uuidv4 } from "uuid";
import { assertCanonicalTopicPublish } from "@/lib/architecture/canonicalPublishGuard";
import {
  insertTopic,
  upsertTopicTranslation,
  updateTopicTranslationContent,
  markTopicPublished,
  updateTopicFields,
  type TopicInsertRow,
  type TopicTranslationWrite,
} from "./writers";

export type { TopicInsertRow, TopicTranslationWrite };
export {
  insertTopic,
  upsertTopicTranslation,
  updateTopicTranslationContent,
  markTopicPublished,
  updateTopicFields,
};

export interface DraftTopic {
  id: string;
  slug: string;
  canonicalPath: string;
  isNew: boolean;
}

const pipeline = new PublicationPipeline({
  enableCacheRevalidation: true,
  dryRun: false,
});

export async function ensureDraftTopic(title: string): Promise<DraftTopic> {
  const sb = createAdminClient();
  const slug = generateCanonicalSlug(title);
  const canonicalPath = `/en/topics/${slug}`;

  const { data: existing } = await sb
    .from("topics")
    .select("id, slug, canonical_path")
    .eq("slug", slug)
    .maybeSingle();

  if (existing) {
    return {
      id: existing.id,
      slug: existing.slug,
      canonicalPath: existing.canonical_path ?? canonicalPath,
      isNew: false,
    };
  }

  const topicId = await insertTopic({
    id: uuidv4(),
    slug,
    canonical_path: canonicalPath,
    status: "draft",
    published_at: null,
  });

  return { id: topicId, slug, canonicalPath, isNew: true };
}

export async function publishRenderedOutput(
  renderedOutputId: string,
  targetLanguage = "en"
) {
  assertCanonicalTopicPublish("publishRenderedOutput");
  return pipeline.publishRenderedOutput(renderedOutputId, targetLanguage);
}

/** @deprecated Demand-path compatibility */
export async function publishDemandTopic(row: TopicInsertRow): Promise<string> {
  return insertTopic(row);
}

/** @deprecated Demand-path compatibility — blocked in production (DEMAND_PIPELINE_FROZEN). */
export async function publishDemandTopicTranslation(row: TopicTranslationWrite): Promise<void> {
  assertCanonicalTopicPublish("publishDemandTopicTranslation");
  await upsertTopicTranslation(row);
}
