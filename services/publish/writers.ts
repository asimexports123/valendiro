/**
 * @architecture-frozen — Canonical topic/translation writers. See docs/ARCHITECTURE_FROZEN.md
 * Canonical DB writers for topics and topic_translations.
 * Low-level mutations only — no business logic.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { v4 as uuidv4 } from "uuid";

export interface TopicTranslationWrite {
  topic_id: string;
  language_code: string;
  title: string;
  subtitle?: string | null;
  content: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  structured_data?: unknown | null;
}

export interface TopicInsertRow {
  id?: string;
  slug: string;
  canonical_path: string;
  category_id?: string | null;
  subcategory_id?: string | null;
  difficulty?: string;
  estimated_read_time?: number;
  status: "draft" | "published" | "review" | "archived";
  published_at?: string | null;
  content?: string | null;
  html_content?: string | null;
}

export async function upsertTopicTranslation(row: TopicTranslationWrite): Promise<void> {
  const sb = createAdminClient();
  const now = new Date().toISOString();

  const { data: existing } = await sb
    .from("topic_translations")
    .select("id")
    .eq("topic_id", row.topic_id)
    .eq("language_code", row.language_code)
    .maybeSingle();

  if (existing) {
    const { error } = await sb
      .from("topic_translations")
      .update({
        title: row.title,
        subtitle: row.subtitle ?? null,
        content: row.content,
        meta_title: row.meta_title ?? null,
        meta_description: row.meta_description ?? null,
        structured_data: row.structured_data ?? null,
        updated_at: now,
      })
      .eq("id", existing.id);
    if (error) throw new Error(`Failed to update topic translation: ${error.message}`);
    return;
  }

  const { error } = await sb.from("topic_translations").insert({
    topic_id: row.topic_id,
    language_code: row.language_code,
    title: row.title,
    subtitle: row.subtitle ?? null,
    content: row.content,
    meta_title: row.meta_title ?? null,
    meta_description: row.meta_description ?? null,
    structured_data: row.structured_data ?? null,
    created_at: now,
    updated_at: now,
  });
  if (error) throw new Error(`Failed to insert topic translation: ${error.message}`);
}

export async function updateTopicTranslationContent(
  topicId: string,
  content: string,
  languageCode = "en"
): Promise<void> {
  const sb = createAdminClient();
  const { error } = await sb
    .from("topic_translations")
    .update({ content, updated_at: new Date().toISOString() })
    .eq("topic_id", topicId)
    .eq("language_code", languageCode);
  if (error) throw new Error(`Failed to update translation content: ${error.message}`);
}

export async function insertTopic(row: TopicInsertRow): Promise<string> {
  const sb = createAdminClient();
  const topicId = row.id ?? uuidv4();
  const { error } = await sb.from("topics").insert({
    id: topicId,
    slug: row.slug,
    canonical_path: row.canonical_path,
    category_id: row.category_id ?? null,
    subcategory_id: row.subcategory_id ?? null,
    difficulty: row.difficulty ?? "intermediate",
    estimated_read_time: row.estimated_read_time ?? 8,
    status: row.status,
    published_at: row.published_at ?? null,
    content: row.content ?? null,
    html_content: row.html_content ?? null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(`Failed to insert topic: ${error.message}`);
  return topicId;
}

export async function markTopicPublished(topicId: string): Promise<void> {
  const sb = createAdminClient();
  const now = new Date().toISOString();
  const { error } = await sb
    .from("topics")
    .update({ status: "published", published_at: now, updated_at: now })
    .eq("id", topicId);
  if (error) throw new Error(`Failed to mark topic published: ${error.message}`);
}

export async function updateTopicFields(
  topicId: string,
  fields: Record<string, unknown>
): Promise<void> {
  const sb = createAdminClient();
  const { error } = await sb
    .from("topics")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", topicId);
  if (error) throw new Error(`Failed to update topic: ${error.message}`);
}
