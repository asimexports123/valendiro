/**
 * Production Proof Evidence
 * 
 * Gathers complete production evidence from the running autonomous pipeline
 * No simulations - only real production data
 */

import { createAdminClient } from "../lib/env";

async function gatherProductionEvidence() {
  const supabase = createAdminClient();

  console.log("=== PRODUCTION PROOF EVIDENCE ===\n");

  // Task 1: Show discovered articles with complete evidence
  console.log("TASK 1: DISCOVERED ARTICLES WITH COMPLETE EVIDENCE\n");
  
  const { data: discoveredArticles } = await supabase
    .from("discovered_articles")
    .select(`
      id,
      external_id,
      title,
      url,
      source_id,
      status,
      created_at,
      published_at,
      discovery_system_sources (
        id,
        name,
        url,
        source_type
      )
    `)
    .eq("status", "accepted")
    .order("created_at", { ascending: false })
    .limit(5);

  if (discoveredArticles && discoveredArticles.length > 0) {
    for (const article of discoveredArticles) {
      console.log(`Article: ${article.title}`);
      console.log(`  Database ID: ${article.id}`);
      console.log(`  Source URL: ${article.url}`);
      console.log(`  Source ID: ${article.source_id}`);
      console.log(`  Source Name: ${article.discovery_system_sources?.name}`);
      console.log(`  Source Type: ${article.discovery_system_sources?.source_type}`);
      console.log(`  Status: ${article.status}`);
      console.log(`  Discovery Timestamp: ${article.created_at}`);
      console.log(`  Published At: ${article.published_at}`);
      console.log();
    }
  }

  // Task 2: Show Knowledge Packages created
  console.log("TASK 2: KNOWLEDGE PACKAGES CREATED\n");
  
  const { data: knowledgePackages } = await supabase
    .from("knowledge_packages")
    .select("*")
    .eq("status", "ready")
    .order("created_at", { ascending: false })
    .limit(3);

  if (knowledgePackages && knowledgePackages.length > 0) {
    for (const pkg of knowledgePackages) {
      console.log(`Knowledge Package: ${pkg.slug}`);
      console.log(`  Database ID: ${pkg.id}`);
      console.log(`  Version: ${pkg.version}`);
      console.log(`  Knowledge Hash: ${pkg.knowledge_hash}`);
      console.log(`  Fact Count: ${pkg.fact_count}`);
      console.log(`  Citation Count: ${pkg.source_count}`);
      console.log(`  Relationship Count: ${pkg.relationship_count}`);
      console.log(`  Status: ${pkg.status}`);
      console.log(`  Created At: ${pkg.created_at}`);
      console.log(`  Last Verified At: ${pkg.last_verified_at}`);
      console.log();
    }
  }

  // Task 3: Show rendered outputs
  console.log("TASK 3: RENDERED OUTPUTS\n");
  
  const { data: renderedOutputs } = await supabase
    .from("rendered_outputs")
    .select("*")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(3);

  if (renderedOutputs && renderedOutputs.length > 0) {
    for (const output of renderedOutputs) {
      console.log(`Rendered Output: ${output.id}`);
      console.log(`  Package ID: ${output.package_id}`);
      console.log(`  Renderer ID: ${output.renderer_id}`);
      console.log(`  Renderer Version: ${output.renderer_version}`);
      console.log(`  Template Version: ${output.template_version}`);
      console.log(`  Output Format: ${output.output_format}`);
      console.log(`  Status: ${output.status}`);
      console.log(`  Word Count: ${output.word_count}`);
      console.log(`  Section Count: ${output.section_count}`);
      console.log(`  Citation Count: ${output.citation_count}`);
      console.log(`  Quality Score: ${JSON.stringify(output.quality_score)}`);
      console.log(`  Render Duration: ${output.render_duration_ms}ms`);
      console.log(`  Created At: ${output.created_at}`);
      console.log();
    }
  }

  // Task 4: Show facts with citations
  console.log("TASK 4: FACTS WITH CITATIONS\n");
  
  const { data: facts } = await supabase
    .from("knowledge_facts")
    .select(`
      id,
      statement,
      fact_type,
      confidence,
      package_id,
      knowledge_citations (
        id,
        source_name,
        source_url
      )
    `)
    .limit(5);

  if (facts && facts.length > 0) {
    for (const fact of facts) {
      console.log(`Fact: ${fact.statement}`);
      console.log(`  Database ID: ${fact.id}`);
      console.log(`  Package ID: ${fact.package_id}`);
      console.log(`  Type: ${fact.fact_type}`);
      console.log(`  Confidence: ${fact.confidence}`);
      console.log(`  Citations: ${fact.knowledge_citations?.length || 0}`);
      if (fact.knowledge_citations && fact.knowledge_citations.length > 0) {
        fact.knowledge_citations.forEach(cit => {
          console.log(`    - ${cit.source_name}: ${cit.source_url}`);
        });
      }
      console.log();
    }
  }

  // Task 5: Production metrics
  console.log("TASK 5: PRODUCTION METRICS\n");
  
  const { data: metrics } = await supabase
    .from("discovery_metrics")
    .select("*")
    .order("recorded_at", { ascending: false })
    .limit(10);

  if (metrics && metrics.length > 0) {
    console.log(`Recent Discovery Metrics:`);
    for (const metric of metrics) {
      console.log(`  ${metric.metric_type}: ${metric.metric_value}`);
      console.log(`    Source: ${metric.source_id}`);
      console.log(`    Recorded At: ${metric.recorded_at}`);
    }
  }

  console.log("\n=== PRODUCTION PROOF COMPLETE ===");
}

gatherProductionEvidence().catch(console.error);
