/**
 * Complete production pipeline investigation
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://diwwvkbztvhwouttajha.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY";

const sb = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
  console.log("=== PRODUCTION PIPELINE INVESTIGATION ===\n");

  const slug = "machine-learning-basics";

  // 1. Check topic_translations.content (what frontend serves)
  console.log("1. Checking topic_translations.content (frontend source):");
  const { data: topic } = await sb
    .from("topics")
    .select("id, category_id, subcategory_id, status")
    .eq("slug", slug)
    .single();

  if (!topic) {
    console.log("  Topic not found");
    return;
  }

  console.log(`  Topic ID: ${topic.id}`);
  console.log(`  Category ID: ${topic.category_id}`);
  console.log(`  Subcategory ID: ${topic.subcategory_id}`);
  console.log(`  Status: ${topic.status}`);

  const { data: translation } = await sb
    .from("topic_translations")
    .select("content, title, subtitle")
    .eq("topic_id", topic.id)
    .eq("language_code", "en")
    .single();

  if (!translation) {
    console.log("  Translation not found");
    return;
  }

  const translationWords = translation.content?.split(/\s+/).length || 0;
  const translationPreview = translation.content?.substring(0, 500) || "";
  console.log(`  Content length: ${translationWords} words`);
  console.log(`  Title: ${translation.title}`);
  console.log(`  Subtitle: ${translation.subtitle}`);
  console.log(`  Content preview: ${translationPreview}...\n`);

  // 2. Check rendered_outputs table (v2 renders)
  console.log("2. Checking rendered_outputs table (v2 renders):");
  const { data: pkg } = await sb
    .from("knowledge_packages")
    .select("id")
    .eq("slug", slug)
    .single();

  if (!pkg) {
    console.log("  Package not found");
    return;
  }

  const { data: v2Outputs } = await sb
    .from("rendered_outputs")
    .select("*")
    .eq("package_id", pkg.id)
    .eq("renderer_id", "long-article-v2-v5.0.0")
    .order("created_at", { ascending: false })
    .limit(3);

  console.log(`  V2 outputs found: ${v2Outputs?.length || 0}`);
  if (v2Outputs && v2Outputs.length > 0) {
    v2Outputs.forEach((out, i) => {
      const words = out.content?.split(/\s+/).length || 0;
      const preview = out.content?.substring(0, 300) || "";
      console.log(`  Output ${i + 1}:`);
      console.log(`    ID: ${out.id}`);
      console.log(`    Created: ${out.created_at}`);
      console.log(`    Words: ${words}`);
      console.log(`    Status: ${out.status}`);
      console.log(`    Preview: ${preview}...`);
    });
  }

  // 3. Check for v1 outputs
  console.log("\n3. Checking rendered_outputs table (v1 renders):");
  const { data: v1Outputs } = await sb
    .from("rendered_outputs")
    .select("*")
    .eq("package_id", pkg.id)
    .like("renderer_id", "long-article%")
    .not("renderer_id", "like", "%v2%")
    .order("created_at", { ascending: false })
    .limit(3);

  console.log(`  V1 outputs found: ${v1Outputs?.length || 0}`);
  if (v1Outputs && v1Outputs.length > 0) {
    v1Outputs.forEach((out, i) => {
      const words = out.content?.split(/\s+/).length || 0;
      const preview = out.content?.substring(0, 300) || "";
      console.log(`  Output ${i + 1}:`);
      console.log(`    Renderer: ${out.renderer_id}`);
      console.log(`    Created: ${out.created_at}`);
      console.log(`    Words: ${words}`);
      console.log(`    Preview: ${preview}...`);
    });
  }

  // 4. Compare content
  console.log("\n4. CONTENT COMPARISON:");
  if (v2Outputs && v2Outputs.length > 0) {
    const latestV2 = v2Outputs[0];
    const v2Words = latestV2.content?.split(/\s+/).length || 0;
    const translationWords2 = translation.content?.split(/\s+/).length || 0;
    
    console.log(`  Translation content words: ${translationWords2}`);
    console.log(`  Latest v2 output words: ${v2Words}`);
    console.log(`  Match: ${translation.content === latestV2.content ? "YES" : "NO"}`);
    
    if (translation.content !== latestV2.content) {
      console.log(`  ⚠️ CONTENT MISMATCH: topic_translations does not match v2 rendered output`);
      console.log(`  This explains why the live site shows stale content`);
    }
  }

  console.log("\n=== INVESTIGATION COMPLETE ===");
}

main().catch(console.error);
