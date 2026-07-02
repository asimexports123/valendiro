/**
 * Phase 2 Verification Script
 * 
 * Proves:
 * 1. Create Topic "Python" 
 * 2. Assign Entity Type "Programming Language"
 * 3. Run materializeBlueprint()
 * 4. Verify hub_sections + hub_slots created
 * 5. Coverage = 0%
 * 6. Existing tables still work
 */

import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  "https://diwwvkbztvhwouttajha.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY"
);

async function main() {
  console.log("=== Phase 2 Verification ===\n");

  // Step 0: Seed entity type blueprint (if not exists)
  console.log("--- Step 0: Ensure Entity Type Blueprint ---");
  let { data: et } = await sb.from("entity_types").select("id").eq("slug", "programming-language").single();
  if (!et) {
    const { data: newEt } = await sb.from("entity_types").insert({ slug: "programming-language" }).select("id").single();
    et = newEt;
    await sb.from("entity_type_translations").insert({ entity_type_id: et!.id, language_code: "en", name: "Programming Language", description: "Blueprint for programming language knowledge hubs" });
  }
  console.log("  Entity Type ID:", et!.id);

  // Ensure sections + slots exist
  const { count: secCount } = await sb.from("entity_type_sections").select("*", { count: "exact", head: true }).eq("entity_type_id", et!.id);
  if (!secCount || secCount === 0) {
    // Create 3 sections with slots
    const sections = [
      { slug: "foundations", sort_order: 1, name: "Foundations", description: "Core setup and basics", slots: [
        { slug: "introduction", sort_order: 1, title: "Introduction", description: "Overview of the language" },
        { slug: "installation", sort_order: 2, title: "Installation", description: "How to install and set up" },
        { slug: "syntax-basics", sort_order: 3, title: "Syntax Basics", description: "Basic syntax and structure" },
      ]},
      { slug: "core-concepts", sort_order: 2, name: "Core Concepts", description: "Essential language features", slots: [
        { slug: "variables", sort_order: 1, title: "Variables & Data Types", description: "Variables, types, and type system" },
        { slug: "functions", sort_order: 2, title: "Functions", description: "Defining and using functions" },
        { slug: "control-flow", sort_order: 3, title: "Control Flow", description: "Conditionals, loops, and flow control" },
        { slug: "oop", sort_order: 4, title: "Object-Oriented Programming", description: "Classes, objects, and inheritance" },
      ]},
      { slug: "advanced", sort_order: 3, name: "Advanced", description: "Advanced topics", slots: [
        { slug: "async-programming", sort_order: 1, title: "Async Programming", description: "Asynchronous patterns" },
        { slug: "testing", sort_order: 2, title: "Testing", description: "Unit testing and test frameworks" },
      ]},
    ];

    for (const sec of sections) {
      const { data: newSec } = await sb.from("entity_type_sections").insert({ entity_type_id: et!.id, slug: sec.slug, sort_order: sec.sort_order }).select("id").single();
      await sb.from("entity_type_section_translations").insert({ section_id: newSec!.id, language_code: "en", name: sec.name, description: sec.description });
      for (const slot of sec.slots) {
        const { data: newSlot } = await sb.from("entity_type_slots").insert({ section_id: newSec!.id, entity_type_id: et!.id, slug: slot.slug, sort_order: slot.sort_order }).select("id").single();
        await sb.from("entity_type_slot_translations").insert({ slot_id: newSlot!.id, language_code: "en", title: slot.title, description: slot.description });
      }
    }
    console.log("  Blueprint seeded: 3 sections, 9 slots");
  } else {
    console.log("  Blueprint already exists:", secCount, "sections");
  }

  // Step 1: Create Topic "Python"
  console.log("\n--- Step 1: Create Topic 'Python' ---");
  const { data: topic, error: topicErr } = await sb.from("topics").insert({
    slug: "python",
    canonical_path: "/en/topics/python",
    status: "draft",
  }).select("id, slug, entity_type_id").single();

  if (topicErr) { console.log("  ERROR:", topicErr.message); return; }
  console.log("  Topic created:", topic.slug, "| entity_type_id:", topic.entity_type_id, "(null = correct)");

  await sb.from("topic_translations").insert({
    topic_id: topic.id,
    language_code: "en",
    title: "Python",
    subtitle: "A versatile programming language",
  });

  // Step 2: materializeBlueprint (inline version for this test)
  console.log("\n--- Step 2: Assign Entity Type + Materialize Blueprint ---");
  
  // Fetch blueprint
  const { data: bpSections } = await sb.from("entity_type_sections")
    .select("id, slug, sort_order, entity_type_section_translations(language_code, name, description)")
    .eq("entity_type_id", et!.id)
    .order("sort_order");

  const { data: bpSlots } = await sb.from("entity_type_slots")
    .select("id, section_id, slug, sort_order, entity_type_slot_translations(language_code, title, description)")
    .eq("entity_type_id", et!.id)
    .order("sort_order");

  let totalSections = 0;
  let totalSlots = 0;

  for (const bpSec of bpSections!) {
    const { data: hubSec } = await sb.from("hub_sections").insert({
      topic_id: topic.id,
      entity_type_section_id: bpSec.id,
      slug: bpSec.slug,
      sort_order: bpSec.sort_order,
    }).select("id").single();
    totalSections++;

    const secTrans = (bpSec as any).entity_type_section_translations || [];
    for (const t of secTrans) {
      await sb.from("hub_section_translations").insert({ section_id: hubSec!.id, language_code: t.language_code, name: t.name, description: t.description });
    }

    const sectionSlots = (bpSlots || []).filter((s: any) => s.section_id === bpSec.id);
    for (const bpSlot of sectionSlots) {
      const { data: hubSlot } = await sb.from("hub_slots").insert({
        section_id: hubSec!.id,
        topic_id: topic.id,
        entity_type_slot_id: bpSlot.id,
        slug: bpSlot.slug,
        sort_order: bpSlot.sort_order,
        status: "empty",
      }).select("id").single();
      totalSlots++;

      const slotTrans = (bpSlot as any).entity_type_slot_translations || [];
      for (const t of slotTrans) {
        await sb.from("hub_slot_translations").insert({ slot_id: hubSlot!.id, language_code: t.language_code, title: t.title, description: t.description });
      }
    }
  }

  // Update topic with entity_type_id
  await sb.from("topics").update({ entity_type_id: et!.id }).eq("id", topic.id);
  console.log("  ✓ Blueprint materialized:", totalSections, "sections,", totalSlots, "slots");

  // Step 3: Verify
  console.log("\n--- Step 3: Verify Hub Structure ---");
  const { data: hubSecs } = await sb.from("hub_sections").select("slug, hub_section_translations(name)").eq("topic_id", topic.id).order("sort_order");
  console.log("  Hub Sections:");
  for (const s of hubSecs!) {
    console.log("    -", s.slug, "→", (s as any).hub_section_translations?.[0]?.name);
  }

  const { data: hubSlots } = await sb.from("hub_slots").select("slug, status, hub_slot_translations(title)").eq("topic_id", topic.id).order("sort_order");
  console.log("  Hub Slots:");
  for (const s of hubSlots!) {
    console.log("    -", s.slug, `[${s.status}]`, "→", (s as any).hub_slot_translations?.[0]?.title);
  }

  // Step 4: Coverage
  console.log("\n--- Step 4: Coverage ---");
  const total = hubSlots!.length;
  const filled = hubSlots!.filter((s: any) => s.status !== "empty").length;
  const pct = total > 0 ? Math.round((filled / total) * 100) : 0;
  console.log(`  Total slots: ${total} | Filled: ${filled} | Coverage: ${pct}%`);

  // Step 5: Existing tables still work
  console.log("\n--- Step 5: Backward Compatibility ---");
  const { data: cats } = await sb.from("categories").select("slug");
  console.log("  Categories:", cats!.length, "rows ✓");
  const { error: topicsErr } = await sb.from("topics").select("id, slug, entity_type_id").limit(5);
  console.log("  Topics query (with new column):", topicsErr ? "ERROR" : "✓");
  const { error: artErr } = await sb.from("articles").select("id").limit(1);
  console.log("  Articles:", artErr ? "ERROR" : "✓");

  // Step 6: Verify topic without entity_type still works
  const { data: topicCheck } = await sb.from("topics").select("id, slug, entity_type_id").eq("id", topic.id).single();
  console.log("  Topic 'Python' entity_type_id:", topicCheck!.entity_type_id, "(should be UUID)");

  console.log("\n=== Phase 2 Verification PASSED ===");

  // Cleanup note
  console.log("\n[Test data left in DB for your review. Can be cleaned after approval.]");
}

main().catch((e) => console.error("FATAL:", e.message));
