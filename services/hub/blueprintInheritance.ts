import { createClient as createServerClient } from "@/lib/supabase/server";
import { updateTopicFields } from "@/services/publish/writers";

/**
 * materializeBlueprint
 *
 * Given a topic_id and entity_type_id:
 * 1. Fetches all sections and slots from the entity type blueprint
 * 2. Creates corresponding hub_sections and hub_slots for the topic
 * 3. Creates translations for each section and slot
 *
 * This is a purely additive operation. It does NOT touch discovery, scoring, or pipeline.
 * Hub slots are created with status = 'empty'.
 */
export async function materializeBlueprint(topicId: string, entityTypeId: string) {
  const supabase = await createServerClient();

  // 1. Fetch blueprint sections with their translations
  const { data: blueprintSections, error: secErr } = await supabase
    .from("entity_type_sections")
    .select("id, slug, sort_order, entity_type_section_translations(language_code, name, description)")
    .eq("entity_type_id", entityTypeId)
    .order("sort_order");

  if (secErr) throw new Error(`Failed to fetch blueprint sections: ${secErr.message}`);
  if (!blueprintSections || blueprintSections.length === 0) {
    return { sections: 0, slots: 0 };
  }

  // 2. Fetch blueprint slots with their translations
  const { data: blueprintSlots, error: slotErr } = await supabase
    .from("entity_type_slots")
    .select("id, section_id, slug, sort_order, entity_type_slot_translations(language_code, title, description)")
    .eq("entity_type_id", entityTypeId)
    .order("sort_order");

  if (slotErr) throw new Error(`Failed to fetch blueprint slots: ${slotErr.message}`);

  let totalSections = 0;
  let totalSlots = 0;

  // 3. Create hub_sections for each blueprint section
  for (const bpSection of blueprintSections) {
    const { data: hubSection, error: hsErr } = await supabase
      .from("hub_sections")
      .insert({
        topic_id: topicId,
        entity_type_section_id: bpSection.id,
        slug: bpSection.slug,
        sort_order: bpSection.sort_order,
      })
      .select("id")
      .single();

    if (hsErr) throw new Error(`Failed to create hub_section '${bpSection.slug}': ${hsErr.message}`);
    totalSections++;

    // Create section translations
    const sectionTranslations = (bpSection as any).entity_type_section_translations || [];
    for (const trans of sectionTranslations) {
      await supabase.from("hub_section_translations").insert({
        section_id: hubSection.id,
        language_code: trans.language_code,
        name: trans.name,
        description: trans.description,
      });
    }

    // 4. Create hub_slots for slots belonging to this section
    const sectionSlots = (blueprintSlots || []).filter((s: any) => s.section_id === bpSection.id);
    for (const bpSlot of sectionSlots) {
      const { data: hubSlot, error: hslErr } = await supabase
        .from("hub_slots")
        .insert({
          section_id: hubSection.id,
          topic_id: topicId,
          entity_type_slot_id: bpSlot.id,
          slug: bpSlot.slug,
          sort_order: bpSlot.sort_order,
          status: "empty",
        })
        .select("id")
        .single();

      if (hslErr) throw new Error(`Failed to create hub_slot '${bpSlot.slug}': ${hslErr.message}`);
      totalSlots++;

      // Create slot translations
      const slotTranslations = (bpSlot as any).entity_type_slot_translations || [];
      for (const trans of slotTranslations) {
        await supabase.from("hub_slot_translations").insert({
          slot_id: hubSlot.id,
          language_code: trans.language_code,
          title: trans.title,
          description: trans.description,
        });
      }
    }
  }

  // 5. Update topic with entity_type_id
  await updateTopicFields(topicId, { entity_type_id: entityTypeId });

  return { sections: totalSections, slots: totalSlots };
}
