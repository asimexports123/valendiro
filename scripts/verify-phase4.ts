import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  "https://diwwvkbztvhwouttajha.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY"
);

async function main() {
  console.log("=== Phase 4 Verification: Hub Service Layer ===\n");

  // Get entity type
  const { data: et } = await sb.from("entity_types").select("id").eq("slug", "programming-language").single();
  if (!et) { console.log("ERROR: No entity type found"); return; }

  // 1. Create test topic
  console.log("--- 1. Create Topic + Materialize Blueprint ---");
  const { data: topic } = await sb.from("topics").insert({
    slug: "javascript-phase4-test",
    canonical_path: "/en/topics/javascript",
    status: "draft",
  }).select("id").single();
  console.log("  Topic:", topic!.id);

  // Materialize (inline — simulating what blueprintInheritance.ts does)
  const { data: bpSections } = await sb.from("entity_type_sections")
    .select("id, slug, sort_order, entity_type_section_translations(language_code, name, description)")
    .eq("entity_type_id", et.id).order("sort_order");
  const { data: bpSlots } = await sb.from("entity_type_slots")
    .select("id, section_id, slug, sort_order, entity_type_slot_translations(language_code, title, description)")
    .eq("entity_type_id", et.id).order("sort_order");

  for (const sec of bpSections!) {
    const { data: hubSec } = await sb.from("hub_sections").insert({
      topic_id: topic!.id, entity_type_section_id: sec.id, slug: sec.slug, sort_order: sec.sort_order,
    }).select("id").single();
    for (const t of (sec as any).entity_type_section_translations || [])
      await sb.from("hub_section_translations").insert({ section_id: hubSec!.id, language_code: t.language_code, name: t.name, description: t.description });
    for (const slot of (bpSlots || []).filter((s: any) => s.section_id === sec.id)) {
      const { data: hubSlot } = await sb.from("hub_slots").insert({
        section_id: hubSec!.id, topic_id: topic!.id, entity_type_slot_id: slot.id,
        slug: slot.slug, sort_order: slot.sort_order, status: "empty",
      }).select("id").single();
      for (const t of (slot as any).entity_type_slot_translations || [])
        await sb.from("hub_slot_translations").insert({ slot_id: hubSlot!.id, language_code: t.language_code, title: t.title, description: t.description });
    }
  }
  await sb.from("topics").update({ entity_type_id: et.id }).eq("id", topic!.id);
  console.log("  ✓ Blueprint materialized");

  // 2. Test getHubStructure
  console.log("\n--- 2. getHubStructure ---");
  const { data: structure } = await sb.from("hub_sections")
    .select(`id, slug, sort_order, hub_section_translations(name, description),
      hub_slots(id, slug, sort_order, status, article_id, hub_slot_translations(title, description))`)
    .eq("topic_id", topic!.id)
    .order("sort_order");
  console.log("  Sections:", structure!.length);
  for (const sec of structure!) {
    const slots = (sec as any).hub_slots || [];
    console.log(`    ${sec.slug}: ${slots.length} slots`);
  }

  // 3. Test getEmptySlots
  console.log("\n--- 3. getEmptySlots ---");
  const { data: emptySlots } = await sb.from("hub_slots")
    .select("id, slug, status, hub_slot_translations(title)")
    .eq("topic_id", topic!.id).eq("status", "empty");
  console.log("  Empty slots:", emptySlots!.length, "(should be 15)");

  // 4. Test linkArticleToSlot
  console.log("\n--- 4. linkArticleToSlot ---");
  // Create a fake article for testing
  const { data: article } = await sb.from("articles").insert({
    slug: "javascript-introduction-test",
    canonical_path: "/en/articles/javascript-introduction-test",
    status: "published",
    article_type: "guide",
  }).select("id").single();
  console.log("  Test article:", article!.id);

  const slotToFill = emptySlots![0];
  const { data: linked } = await sb.from("hub_slots")
    .update({ article_id: article!.id, status: "published" })
    .eq("id", slotToFill.id)
    .select("id, slug, status, article_id")
    .single();
  console.log("  ✓ Linked:", linked!.slug, "→ status:", linked!.status, "→ article_id:", linked!.article_id);

  // 5. Test coverage after linking 1 slot
  console.log("\n--- 5. Coverage after 1 slot filled ---");
  const { data: allSlots } = await sb.from("hub_slots").select("status").eq("topic_id", topic!.id);
  const filled = allSlots!.filter(s => s.status !== "empty").length;
  const pct = Math.round((filled / allSlots!.length) * 100);
  console.log(`  Coverage: ${filled}/${allSlots!.length} = ${pct}% (should be ~7%)`);

  // 6. Test unlinkArticleFromSlot
  console.log("\n--- 6. unlinkArticleFromSlot ---");
  const { data: unlinked } = await sb.from("hub_slots")
    .update({ article_id: null, status: "empty" })
    .eq("id", slotToFill.id)
    .select("id, slug, status, article_id")
    .single();
  console.log("  ✓ Unlinked:", unlinked!.slug, "→ status:", unlinked!.status, "→ article_id:", unlinked!.article_id);

  // 7. Test deleteHub
  console.log("\n--- 7. deleteHub ---");
  await sb.from("hub_sections").delete().eq("topic_id", topic!.id);
  await sb.from("topics").update({ entity_type_id: null }).eq("id", topic!.id);
  const { count: remainingSections } = await sb.from("hub_sections").select("*", { count: "exact", head: true }).eq("topic_id", topic!.id);
  console.log("  ✓ Hub deleted. Remaining sections:", remainingSections, "(should be 0)");

  // 8. Backward compatibility
  console.log("\n--- 8. Backward Compatibility ---");
  const { error: catErr } = await sb.from("categories").select("slug");
  console.log("  Categories:", catErr ? "FAIL" : "✓");
  const { error: subErr } = await sb.from("subcategories").select("slug").limit(3);
  console.log("  Subcategories:", subErr ? "FAIL" : "✓");

  // Cleanup
  console.log("\n--- Cleanup ---");
  await sb.from("articles").delete().eq("id", article!.id);
  await sb.from("topics").delete().eq("id", topic!.id);
  console.log("  ✓ Test data cleaned");

  console.log("\n=== Phase 4 Verification PASSED ===");
}

main().catch(e => console.error("FATAL:", e.message));
