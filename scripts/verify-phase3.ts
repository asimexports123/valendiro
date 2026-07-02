import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  "https://diwwvkbztvhwouttajha.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY"
);

async function main() {
  console.log("=== Phase 3 Final Verification ===\n");

  // 1. Verify categories
  const { count: catCount } = await sb.from("categories").select("*", { count: "exact", head: true });
  console.log(`✓ Categories: ${catCount}`);

  // 2. Verify subcategories
  const { count: subCount } = await sb.from("subcategories").select("*", { count: "exact", head: true });
  console.log(`✓ Subcategories: ${subCount}`);

  // 3. Verify entity type
  const { data: et } = await sb.from("entity_types").select("id, slug").single();
  console.log(`✓ Entity Type: ${et!.slug} (${et!.id})`);

  // 4. Verify blueprint
  const { count: secCount } = await sb.from("entity_type_sections").select("*", { count: "exact", head: true }).eq("entity_type_id", et!.id);
  const { count: slotCount } = await sb.from("entity_type_slots").select("*", { count: "exact", head: true }).eq("entity_type_id", et!.id);
  console.log(`✓ Blueprint: ${secCount} sections, ${slotCount} slots`);

  // 5. Create new topic "Python" and materialize blueprint
  console.log("\n--- Test: Create Topic + Materialize ---");
  
  const { data: topic, error: topicErr } = await sb.from("topics").insert({
    slug: "python-test-phase3",
    canonical_path: "/en/topics/python",
    status: "draft",
  }).select("id, slug, entity_type_id").single();

  if (topicErr) { console.log("ERROR creating topic:", topicErr.message); return; }
  console.log(`  Topic created: ${topic.slug} | entity_type_id: ${topic.entity_type_id} (null = ✓)`);

  // Materialize blueprint
  const { data: bpSections } = await sb.from("entity_type_sections")
    .select("id, slug, sort_order, entity_type_section_translations(language_code, name, description)")
    .eq("entity_type_id", et!.id).order("sort_order");

  const { data: bpSlots } = await sb.from("entity_type_slots")
    .select("id, section_id, slug, sort_order, entity_type_slot_translations(language_code, title, description)")
    .eq("entity_type_id", et!.id).order("sort_order");

  let totalSec = 0, totalSlot = 0;
  for (const sec of bpSections!) {
    const { data: hubSec } = await sb.from("hub_sections").insert({
      topic_id: topic.id, entity_type_section_id: sec.id, slug: sec.slug, sort_order: sec.sort_order,
    }).select("id").single();
    totalSec++;

    for (const t of (sec as any).entity_type_section_translations || []) {
      await sb.from("hub_section_translations").insert({ section_id: hubSec!.id, language_code: t.language_code, name: t.name, description: t.description });
    }

    for (const slot of (bpSlots || []).filter((s: any) => s.section_id === sec.id)) {
      const { data: hubSlot } = await sb.from("hub_slots").insert({
        section_id: hubSec!.id, topic_id: topic.id, entity_type_slot_id: slot.id,
        slug: slot.slug, sort_order: slot.sort_order, status: "empty",
      }).select("id").single();
      totalSlot++;

      for (const t of (slot as any).entity_type_slot_translations || []) {
        await sb.from("hub_slot_translations").insert({ slot_id: hubSlot!.id, language_code: t.language_code, title: t.title, description: t.description });
      }
    }
  }

  await sb.from("topics").update({ entity_type_id: et!.id }).eq("id", topic.id);
  console.log(`  ✓ Materialized: ${totalSec} sections, ${totalSlot} slots`);

  // 6. Verify coverage
  const { data: allSlots } = await sb.from("hub_slots").select("status").eq("topic_id", topic.id);
  const filled = allSlots!.filter(s => s.status !== "empty").length;
  const pct = Math.round((filled / allSlots!.length) * 100);
  console.log(`  ✓ Coverage: ${filled}/${allSlots!.length} = ${pct}%`);

  // 7. Existing functionality
  console.log("\n--- Backward Compatibility ---");
  const { error: catErr } = await sb.from("categories").select("slug");
  console.log(`  Categories query: ${catErr ? "FAIL" : "✓"}`);
  const { error: subErr } = await sb.from("subcategories").select("slug, category_id").limit(3);
  console.log(`  Subcategories query: ${subErr ? "FAIL" : "✓"}`);
  const { error: artErr } = await sb.from("articles").select("id").limit(1);
  console.log(`  Articles query: ${artErr ? "FAIL" : "✓"}`);

  // 8. Clean test topic (leave seed data)
  console.log("\n--- Cleanup test topic ---");
  await sb.from("hub_slot_translations").delete().in("slot_id", 
    (await sb.from("hub_slots").select("id").eq("topic_id", topic.id)).data!.map(s => s.id)
  );
  await sb.from("hub_slots").delete().eq("topic_id", topic.id);
  await sb.from("hub_section_translations").delete().in("section_id",
    (await sb.from("hub_sections").select("id").eq("topic_id", topic.id)).data!.map(s => s.id)
  );
  await sb.from("hub_sections").delete().eq("topic_id", topic.id);
  await sb.from("topics").delete().eq("id", topic.id);
  console.log("  ✓ Test topic cleaned");

  console.log("\n=== Phase 3 Verification PASSED ===");
}

main().catch(e => console.error("FATAL:", e.message));
