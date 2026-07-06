/**
 * Check actual paragraph count in HTML
 */

import { createAdminClient } from "../lib/supabase/admin";

const TOPIC = "family-vacations";

async function checkParagraphCount() {
  const supabase = createAdminClient();

  // Get topic and package
  const { data: topic } = await supabase
    .from("topics")
    .select("id")
    .eq("slug", TOPIC)
    .single();

  if (!topic) {
    console.log(`❌ Topic not found`);
    return;
  }

  const { data: pkg } = await supabase
    .from("knowledge_packages")
    .select("id, fact_count")
    .eq("topic_id", topic.id)
    .single();

  if (!pkg) {
    console.log(`❌ Knowledge package not found`);
    return;
  }

  // Get rendered output
  const { data: rendered } = await supabase
    .from("rendered_outputs")
    .select("content, renderer_id, created_at")
    .eq("package_id", pkg.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!rendered) {
    console.log(`❌ No rendered output found`);
    return;
  }

  const html = rendered.content;
  const pTags = html.match(/<p>/g);
  const pCount = pTags ? pTags.length : 0;

  console.log(`Topic: ${TOPIC}`);
  console.log(`Facts in package: ${pkg.fact_count}`);
  console.log(`<p> tags in HTML: ${pCount}`);
  console.log(`Renderer ID: ${rendered.renderer_id || 'N/A'}`);
  console.log(`Created at: ${rendered.created_at || 'N/A'}`);

  // Show first 1000 chars of HTML
  console.log(`\nFirst 1000 chars of HTML:`);
  console.log(html.substring(0, 1000));
}

checkParagraphCount().catch(console.error);
