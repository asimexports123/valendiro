import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  "https://diwwvkbztvhwouttajha.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY"
);

async function main() {
  console.log("=== Seeding Demo Hub: Python ===\n");

  // Check if already exists
  const { data: existing } = await sb.from("topics").select("id").eq("slug", "python").single();
  if (existing) {
    console.log("Python topic already exists:", existing.id);
    return;
  }

  // Get entity type
  const { data: et } = await sb.from("entity_types").select("id").eq("slug", "programming-language").single();
  if (!et) { console.log("ERROR: No entity type"); return; }

  // Get programming subcategory
  const { data: sub } = await sb.from("subcategories").select("id").eq("slug", "programming").single();

  // Create topic
  const { data: topic } = await sb.from("topics").insert({
    slug: "python",
    canonical_path: "/en/topics/python",
    status: "published",
    entity_type_id: et.id,
  }).select("id").single();
  console.log("Topic created:", topic!.id);

  // Add translation
  await sb.from("topic_translations").insert({
    topic_id: topic!.id,
    language_code: "en",
    title: "Python",
    subtitle: "A versatile, beginner-friendly programming language",
  });

  // Materialize blueprint
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

  // Mark 2 slots as published (simulate some content)
  const { data: slots } = await sb.from("hub_slots").select("id, slug").eq("topic_id", topic!.id).order("sort_order").limit(2);
  for (const slot of slots!) {
    // Create a dummy article for each
    const { data: art } = await sb.from("articles").insert({
      slug: `python-${slot.slug}`,
      canonical_path: `/en/articles/python-${slot.slug}`,
      status: "published",
      article_type: "guide",
    }).select("id").single();
    await sb.from("hub_slots").update({ article_id: art!.id, status: "published" }).eq("id", slot.id);
  }

  console.log("✓ Hub materialized: 5 sections, 15 slots (2 filled)");

  // Verify
  const { data: allSlots } = await sb.from("hub_slots").select("status").eq("topic_id", topic!.id);
  const filled = allSlots!.filter(s => s.status !== "empty").length;
  console.log(`  Coverage: ${filled}/${allSlots!.length} = ${Math.round((filled / allSlots!.length) * 100)}%`);
}

main().catch(e => console.error("FATAL:", e.message));
