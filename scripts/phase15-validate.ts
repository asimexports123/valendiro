/**
 * Phase 15 Validation Script
 * 
 * Validates Phase 15 improvements by checking knowledge packages and rendered outputs:
 * - Machine Learning Basics
 * - CSS Fundamentals
 * - Docker Containers
 * - Nutrition Fundamentals
 * - Retirement Planning Fundamentals
 */

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://diwwvkbztvhwouttajha.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY"
);

const TOPICS_TO_VALIDATE = [
  "machine-learning-basics",
  "css-fundamentals",
  "docker-containers",
  "nutrition-fundamentals",
  "retirement-planning-fundamentals",
];

async function main() {
  console.log("Phase 15 Validation Report");
  console.log("==========================\n");

  const results: any[] = [];

  for (const slug of TOPICS_TO_VALIDATE) {
    console.log(`Topic: ${slug}`);
    
    // Get topic and knowledge package
    const { data: topic } = await supabase
      .from("topics")
      .select("id, title, knowledge_packages(id, status, fact_count, relationship_count)")
      .eq("slug", slug)
      .single();

    if (!topic) {
      console.log(`  ❌ Topic not found\n`);
      results.push({ slug, status: "NOT_FOUND" });
      continue;
    }

    const pkg = topic.knowledge_packages?.[0];
    if (!pkg) {
      console.log(`  ❌ No knowledge package found\n`);
      results.push({ slug, status: "NO_PACKAGE" });
      continue;
    }

    // Get rendered output
    const { data: output } = await supabase
      .from("rendered_outputs")
      .select("id, renderer_id, renderer_version, quality_score, status, created_at")
      .eq("package_id", pkg.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    console.log(`  Knowledge Package ID: ${pkg.id}`);
    console.log(`  Package Status: ${pkg.status}`);
    console.log(`  Fact Count: ${pkg.fact_count}`);
    console.log(`  Relationship Count: ${pkg.relationship_count}`);
    
    if (output) {
      console.log(`  Rendered Output ID: ${output.id}`);
      console.log(`  Renderer: ${output.renderer_id} v${output.renderer_version}`);
      console.log(`  Quality Score: ${output.quality_score?.overall || 'N/A'}/100`);
      console.log(`  Output Status: ${output.status}`);
      console.log(`  Last Rendered: ${output.created_at}`);
      
      results.push({
        slug,
        title: topic.title,
        packageId: pkg.id,
        packageStatus: pkg.status,
        rendererId: output.renderer_id,
        qualityScore: output.quality_score?.overall || 0,
        outputStatus: output.status,
        lastRendered: output.created_at,
      });
    } else {
      console.log(`  ❌ No rendered output found`);
      results.push({
        slug,
        title: topic.title,
        packageId: pkg.id,
        packageStatus: pkg.status,
        outputStatus: "NO_OUTPUT",
      });
    }

    console.log();
  }

  console.log("==========================");
  console.log("Summary");
  console.log("==========================");
  
  const readyToRender = results.filter(r => r.packageStatus === "ready");
  const published = results.filter(r => r.outputStatus === "published");
  const drafts = results.filter(r => r.outputStatus === "draft");
  const noOutput = results.filter(r => r.outputStatus === "NO_OUTPUT" || r.outputStatus === "NO_PACKAGE" || r.outputStatus === "NOT_FOUND");

  console.log(`Ready for rendering: ${readyToRender.length}/${results.length}`);
  console.log(`Published: ${published.length}/${results.length}`);
  console.log(`Draft: ${drafts.length}/${results.length}`);
  console.log(`No output: ${noOutput.length}/${results.length}`);

  // Check if quality scores meet new 90 threshold
  const belowThreshold = results.filter(r => r.qualityScore && r.qualityScore < 90);
  if (belowThreshold.length > 0) {
    console.log(`\n⚠️  Topics below new 90/100 threshold:`);
    belowThreshold.forEach(r => {
      console.log(`   - ${r.slug}: ${r.qualityScore}/100`);
    });
  }

  console.log(`\nPhase 15 implementation complete. Topics need to be re-rendered to apply changes.`);
}

main().catch(console.error);
