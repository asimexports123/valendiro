import { createClient as createServerClient } from "@/lib/supabase/server";
import { updateTopicFields } from "@/services/publish/writers";
import type { HubSection, HubSlot, HubSlotStatus } from "@/lib/types";

/**
 * Hub Service
 *
 * CRUD operations for Knowledge Hubs (hub_sections + hub_slots).
 * No discovery, scoring, or pipeline logic — just data access.
 */

// ─── Hub Structure Queries ────────────────────────────────────────────

/**
 * Get full hub structure for a topic (sections with their slots and translations).
 */
export async function getHubStructure(topicId: string, lang: string = "en") {
  const supabase = await createServerClient();

  const { data: sections, error } = await supabase
    .from("hub_sections")
    .select(`
      id, slug, sort_order, entity_type_section_id,
      hub_section_translations!inner(name, description),
      hub_slots(
        id, slug, sort_order, status, article_id, entity_type_slot_id,
        hub_slot_translations!inner(title, description)
      )
    `)
    .eq("topic_id", topicId)
    .eq("hub_section_translations.language_code", lang)
    .eq("hub_slots.hub_slot_translations.language_code", lang)
    .order("sort_order");

  if (error) throw new Error(`Failed to fetch hub structure: ${error.message}`);
  return sections || [];
}

/**
 * Get all hubs (topics with entity types assigned) with coverage summary.
 */
export async function listHubs(options?: { limit?: number; offset?: number }) {
  const supabase = await createServerClient();
  const limit = options?.limit ?? 50;
  const offset = options?.offset ?? 0;

  const { data: topics, error } = await supabase
    .from("topics")
    .select(`
      id, slug, entity_type_id, status,
      topic_translations(title, subtitle),
      entity_types(slug, entity_type_translations(name))
    `)
    .not("entity_type_id", "is", null)
    .range(offset, offset + limit - 1);

  if (error) throw new Error(`Failed to list hubs: ${error.message}`);
  return topics || [];
}

// ─── Slot Operations ──────────────────────────────────────────────────

/**
 * Link an article to a hub slot (marks slot as published).
 */
export async function linkArticleToSlot(slotId: string, articleId: string) {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("hub_slots")
    .update({ article_id: articleId, status: "published" as HubSlotStatus })
    .eq("id", slotId)
    .select("id, slug, status, article_id")
    .single();

  if (error) throw new Error(`Failed to link article to slot: ${error.message}`);
  return data;
}

/**
 * Unlink an article from a hub slot (resets to empty).
 */
export async function unlinkArticleFromSlot(slotId: string) {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("hub_slots")
    .update({ article_id: null, status: "empty" as HubSlotStatus })
    .eq("id", slotId)
    .select("id, slug, status")
    .single();

  if (error) throw new Error(`Failed to unlink article from slot: ${error.message}`);
  return data;
}

/**
 * Update slot status (empty → drafted → published).
 */
export async function updateSlotStatus(slotId: string, status: HubSlotStatus) {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("hub_slots")
    .update({ status })
    .eq("id", slotId)
    .select("id, slug, status")
    .single();

  if (error) throw new Error(`Failed to update slot status: ${error.message}`);
  return data;
}

/**
 * Get empty slots for a topic (candidates for content generation).
 */
export async function getEmptySlots(topicId: string, lang: string = "en") {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("hub_slots")
    .select(`
      id, slug, sort_order, entity_type_slot_id,
      hub_slot_translations!inner(title, description),
      hub_sections!inner(slug, sort_order)
    `)
    .eq("topic_id", topicId)
    .eq("status", "empty")
    .eq("hub_slot_translations.language_code", lang)
    .order("sort_order");

  if (error) throw new Error(`Failed to fetch empty slots: ${error.message}`);
  return data || [];
}

/**
 * Get a single slot by ID.
 */
export async function getSlotById(slotId: string, lang: string = "en") {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("hub_slots")
    .select(`
      id, slug, sort_order, status, article_id, topic_id, entity_type_slot_id,
      hub_slot_translations!inner(title, description)
    `)
    .eq("id", slotId)
    .eq("hub_slot_translations.language_code", lang)
    .single();

  if (error) throw new Error(`Failed to fetch slot: ${error.message}`);
  return data;
}

// ─── Hub Deletion ─────────────────────────────────────────────────────

/**
 * Delete all hub sections and slots for a topic (cascade handles translations).
 * Used for re-materializing a blueprint or removing a hub.
 */
export async function deleteHub(topicId: string) {
  const supabase = await createServerClient();

  const { error } = await supabase
    .from("hub_sections")
    .delete()
    .eq("topic_id", topicId);

  if (error) throw new Error(`Failed to delete hub: ${error.message}`);

  // Reset entity_type_id on the topic
  await updateTopicFields(topicId, { entity_type_id: null });

  return { success: true };
}
