/**
 * Fact Consumption Audit
 * 
 * Traces facts through the complete rendering pipeline:
 * 1. Facts in knowledge_facts table
 * 2. Facts loaded by knowledgePackageLoader
 * 3. Facts received by renderer
 * 4. Facts actually rendered
 */

import { createAdminClient } from "../lib/supabase/admin";

const TOPICS = ["nodejs-cluster", "vendor-management", "family-vacations"];

interface FactAudit {
  topicSlug: string;
  step1_factsInDb: number;
  step2_factsLoaded: number;
  step3_factsToRenderer: number;
  step4_factsRendered: number;
  ignoredFacts: string[];
  limits: {
    maxFacts: number | null;
    tokenLimit: number | null;
    filtering: string[];
  };
}

async function auditFactConsumption() {
  console.log("Fact Consumption Audit");
  console.log("=====================\n");

  const results: FactAudit[] = [];

  for (const slug of TOPICS) {
    console.log(`\n--- ${slug} ---`);

    const audit: FactAudit = {
      topicSlug: slug,
      step1_factsInDb: 0,
      step2_factsLoaded: 0,
      step3_factsToRenderer: 0,
      step4_factsRendered: 0,
      ignoredFacts: [],
      limits: {
        maxFacts: null,
        tokenLimit: null,
        filtering: [],
      },
    };

    const supabase = createAdminClient();

    // Step 1: Get topic and package
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

    // Step 1: Count facts in DB
    const { data: factsInDb } = await supabase
      .from("knowledge_facts")
      .select("id, statement, fact_type")
      .eq("package_id", pkg.id);

    audit.step1_factsInDb = factsInDb?.length || 0;
    console.log(`1. Facts in knowledge_facts table: ${audit.step1_factsInDb}`);

    // Get all fact statements for comparison
    const dbFactStatements = factsInDb?.map(f => f.statement) || [];

    // Step 2: Check what knowledgePackageLoader would load
    // This requires examining the actual loader code behavior
    // For now, let's check the rendered output to see what was actually used
    const { data: rendered } = await supabase
      .from("rendered_outputs")
      .select("content, quality_score, diagnostics")
      .eq("package_id", pkg.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!rendered) {
      console.log(`❌ No rendered output found`);
      continue;
    }

    console.log(`2. Rendered content length: ${rendered.content.length} chars`);
    console.log(`3. Editorial score: ${rendered.quality_score?.editorialScore || 'N/A'}`);

    // Count how many fact statements appear in rendered content
    let factsInContent = 0;
    const ignoredFacts: string[] = [];

    for (const factStatement of dbFactStatements) {
      // Check if a substantial portion of the fact appears in content
      const words = factStatement.split(' ').slice(0, 5).join(' ');
      if (rendered.content.toLowerCase().includes(words.toLowerCase())) {
        factsInContent++;
      } else {
        ignoredFacts.push(factStatement.substring(0, 80) + "...");
      }
    }

    audit.step4_factsRendered = factsInContent;
    audit.ignoredFacts = ignoredFacts;

    console.log(`4. Facts appearing in rendered content: ${factsInContent}`);
    console.log(`5. Facts ignored: ${ignoredFacts.length}`);

    if (ignoredFacts.length > 0 && ignoredFacts.length <= 10) {
      console.log(`   Ignored facts:`);
      ignoredFacts.forEach(f => console.log(`   - ${f}`));
    } else if (ignoredFacts.length > 10) {
      console.log(`   Ignored facts (first 10):`);
      ignoredFacts.slice(0, 10).forEach(f => console.log(`   - ${f}`));
    }

    results.push(audit);
  }

  // Summary
  console.log("\n\n=== SUMMARY ===");
  for (const result of results) {
    console.log(`\n${result.topicSlug}:`);
    console.log(`  DB Facts: ${result.step1_factsInDb}`);
    console.log(`  Facts in Content: ${result.step4_factsRendered}`);
    console.log(`  Ignored: ${result.ignoredFacts.length}`);
    console.log(`  Utilization: ${((result.step4_factsRendered / result.step1_factsInDb) * 100).toFixed(1)}%`);
  }
}

auditFactConsumption().catch(console.error);
