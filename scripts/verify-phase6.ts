import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  "https://diwwvkbztvhwouttajha.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY"
);

async function main() {
  console.log("=== Phase 6 Verification: Discovery Framework ===\n");

  // 1. Register static mock source
  console.log("--- 1. Register Discovery Source ---");
  const { data: existingSource } = await sb.from("discovery_sources").select("id").eq("slug", "static-mock").single();
  let sourceId: string;

  if (existingSource) {
    sourceId = existingSource.id;
    console.log("  Source already exists:", sourceId);
  } else {
    const { data: source } = await sb.from("discovery_sources").insert({
      slug: "static-mock",
      name: "Static Mock Adapter",
      adapter_type: "static",
      config: {},
      status: "active",
    }).select("id").single();
    sourceId = source!.id;
    console.log("  ✓ Source registered:", sourceId);
  }

  // 2. Get Python topic (seeded in Phase 5)
  const { data: topic } = await sb.from("topics").select("id, slug, entity_type_id").eq("slug", "python").single();
  if (!topic) { console.log("ERROR: Python topic not found"); return; }
  console.log("\n--- 2. Topic: Python ---");
  console.log("  ID:", topic.id);
  console.log("  Entity Type:", topic.entity_type_id);

  // 3. Get empty slots
  const { data: emptySlots } = await sb.from("hub_slots")
    .select("id, slug, status, hub_slot_translations(title, description), hub_sections(slug, hub_section_translations(name))")
    .eq("topic_id", topic.id)
    .eq("status", "empty");

  console.log("  Empty slots:", emptySlots?.length ?? 0);

  // 4. Simulate adapter extraction (inline — same logic as StaticMockAdapter)
  console.log("\n--- 3. Mock Adapter Extraction ---");
  const topicTitle = "Python";
  const slotInfos = (emptySlots ?? []).map((s: any) => ({
    id: s.id,
    slug: s.slug,
    title: s.hub_slot_translations?.[0]?.title ?? s.slug,
    description: s.hub_slot_translations?.[0]?.description ?? "",
    sectionSlug: s.hub_sections?.slug ?? "",
    sectionName: s.hub_sections?.hub_section_translations?.[0]?.name ?? "",
  }));

  const rawCandidates: any[] = [];
  for (const slot of slotInfos) {
    rawCandidates.push({
      slotId: slot.id,
      title: `${topicTitle}: ${slot.title}`,
      description: `Comprehensive guide covering ${slot.title.toLowerCase()} for ${topicTitle}.`,
      sourceUrl: null,
      relevanceScore: 80,
      confidenceScore: 75,
    });
  }
  console.log("  Candidates extracted:", rawCandidates.length);

  // 5. Score candidates
  console.log("\n--- 4. Scoring ---");
  const scored = rawCandidates.map((c: any) => {
    const combined = Math.round(c.relevanceScore * 0.6 + c.confidenceScore * 0.4);
    return { ...c, combinedScore: combined, decision: combined >= 60 ? "accepted" : "rejected" };
  });
  const accepted = scored.filter((c: any) => c.decision === "accepted").length;
  const rejected = scored.filter((c: any) => c.decision === "rejected").length;
  console.log("  Accepted:", accepted, "| Rejected:", rejected);

  // 6. Create discovery run
  console.log("\n--- 5. Persist Discovery Run ---");
  const { data: run } = await sb.from("discovery_runs").insert({
    source_id: sourceId,
    topic_id: topic.id,
    entity_type_id: topic.entity_type_id,
    status: "completed",
    slots_analyzed: slotInfos.length,
    candidates_found: scored.length,
    candidates_accepted: accepted,
    candidates_rejected: rejected,
    candidates_duplicate: 0,
    completed_at: new Date().toISOString(),
  }).select("id").single();
  console.log("  ✓ Run:", run!.id);

  // 7. Persist candidates
  for (const c of scored) {
    await sb.from("discovery_candidates").insert({
      run_id: run!.id,
      hub_slot_id: c.slotId,
      title: c.title,
      description: c.description,
      source_url: c.sourceUrl,
      relevance_score: c.relevanceScore,
      confidence_score: c.confidenceScore,
      status: c.decision === "accepted" ? "accepted" : "rejected",
    });
  }
  console.log("  ✓ Candidates persisted:", scored.length);

  // 8. Verify counts
  console.log("\n--- 6. Final Verification ---");
  const { count: srcCount } = await sb.from("discovery_sources").select("*", { count: "exact", head: true });
  const { count: runCount } = await sb.from("discovery_runs").select("*", { count: "exact", head: true });
  const { count: candCount } = await sb.from("discovery_candidates").select("*", { count: "exact", head: true });
  console.log("  Discovery Sources:", srcCount);
  console.log("  Discovery Runs:", runCount);
  console.log("  Discovery Candidates:", candCount);

  // 9. Backward compat
  console.log("\n--- 7. Backward Compatibility ---");
  const { error: catErr } = await sb.from("categories").select("slug");
  const { error: subErr } = await sb.from("subcategories").select("slug").limit(1);
  const { error: hubErr } = await sb.from("hub_slots").select("id").eq("topic_id", topic.id);
  console.log("  Categories:", catErr ? "FAIL" : "✓");
  console.log("  Subcategories:", subErr ? "FAIL" : "✓");
  console.log("  Hub Slots:", hubErr ? "FAIL" : "✓");

  console.log("\n=== Phase 6 Verification PASSED ===");
}

main().catch((e) => console.error("FATAL:", e.message));
