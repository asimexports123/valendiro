/**
 * Calculate Before Metrics
 * Capture current average words per fact, editorial scores, and word counts
 */

import { createAdminClient } from "../lib/supabase/admin";

const TOPICS = ["nodejs-cluster", "vendor-management", "family-vacations"];

async function calculateBeforeMetrics() {
  console.log("BEFORE METRICS");
  console.log("===============\n");

  const supabase = createAdminClient();

  for (const slug of TOPICS) {
    console.log(`--- ${slug} ---`);

    // Get topic and package
    const { data: topic } = await supabase
      .from("topics")
      .select("id")
      .eq("slug", slug)
      .single();

    if (!topic) {
      console.log(`❌ Topic not found`);
      continue;
    }

    const { data: pkg } = await supabase
      .from("knowledge_packages")
      .select("id, fact_count")
      .eq("topic_id", topic.id)
      .single();

    if (!pkg) {
      console.log(`❌ Knowledge package not found`);
      continue;
    }

    // Get facts
    const { data: facts } = await supabase
      .from("knowledge_facts")
      .select("statement")
      .eq("package_id", pkg.id);

    if (!facts) {
      console.log(`❌ No facts found`);
      continue;
    }

    // Calculate average words per fact
    const totalWords = facts.reduce((sum, f) => sum + f.statement.split(/\s+/).length, 0);
    const avgWordsPerFact = totalWords / facts.length;

    console.log(`Facts count: ${facts.length}`);
    console.log(`Average words per fact: ${avgWordsPerFact.toFixed(1)}`);

    // Get rendered output for word count and editorial score
    const { data: rendered } = await supabase
      .from("rendered_outputs")
      .select("quality_score, renderer_id")
      .eq("package_id", pkg.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (rendered) {
      console.log(`Word count: ${rendered.quality_score?.wordCount || 'N/A'}`);
      console.log(`Editorial score: ${rendered.quality_score?.overall || 'N/A'}`);
      console.log(`Renderer: ${rendered.renderer_id || 'N/A'}`);
    }

    console.log();
  }
}

calculateBeforeMetrics().catch(console.error);
