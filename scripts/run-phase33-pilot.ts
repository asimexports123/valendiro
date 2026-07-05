/**
 * Phase 33.6: Knowledge Factory Pilot
 * 
 * Execute pilot on 10 highest-priority packages:
 * - Python Programming Fundamentals
 * - Git Version Control
 * - Data Structures
 * - Investing Basics
 * - Cybersecurity Fundamentals
 * - Nutrition Fundamentals
 * - Diabetes
 * - Travel Planning Fundamentals
 * - Home Maintenance Basics
 * - Leadership Fundamentals
 */

import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

import { createAdminClient } from "../lib/supabase/admin";
import { KnowledgeFactory } from "../services/factory/knowledgeFactory";
import { loadKnowledgePackage } from "../services/renderer/knowledgePackageLoader";

const PILOT_TOPICS = [
  "python-programming-fundamentals",
  "git-version-control",
  "data-structures",
  "investing-basics",
  "cybersecurity-fundamentals",
  "nutrition-fundamentals",
  "diabetes",
  "travel-planning-fundamentals",
  "home-maintenance-basics",
  "leadership-fundamentals",
];

async function runPhase33Pilot() {
  const sb = createAdminClient();
  const factory = new KnowledgeFactory();

  console.log("Phase 33: Knowledge Factory Pilot");
  console.log("=".repeat(60));
  console.log(`Processing ${PILOT_TOPICS.length} highest-priority packages\n`);

  const results: any[] = [];

  for (const slug of PILOT_TOPICS) {
    try {
      // Get topic by slug
      const { data: topic } = await sb
        .from("topics")
        .select("id, slug, package_id")
        .eq("slug", slug)
        .maybeSingle();

      if (!topic) {
        console.log(`\n❌ Topic not found: ${slug}`);
        results.push({
          slug,
          processed: false,
          error: "Topic not found",
        });
        continue;
      }

      // Load knowledge package
      const pkgResult = await loadKnowledgePackage({ packageId: topic.package_id });
      
      if (!pkgResult || !pkgResult.package) {
        console.log(`\n❌ Knowledge Package not found: ${slug}`);
        results.push({
          slug,
          processed: false,
          error: "Knowledge Package not found",
        });
        continue;
      }

      // Process through Knowledge Factory
      const factoryResult = await factory.processPackage(pkgResult.package, {
        dryRun: true,
        skipAcquisition: true,
        skipAuthoring: true,
        skipPublication: true,
      });

      results.push({
        slug,
        processed: true,
        state: factoryResult.state,
        validationPassed: factoryResult.validationPassed,
        qualityMetrics: factoryResult.qualityMetrics,
        scoringResult: factoryResult.scoringResult,
        error: factoryResult.error,
      });

    } catch (error: any) {
      console.log(`\n❌ Error processing ${slug}: ${error.message}`);
      results.push({
        slug,
        processed: false,
        error: error.message,
      });
    }
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("PHASE 33 PILOT RESULTS");
  console.log("=".repeat(60));
  console.log(`Total packages: ${results.length}`);
  console.log(`Processed: ${results.filter(r => r.processed).length}`);
  console.log(`Validation passed: ${results.filter(r => r.validationPassed).length}`);

  const processedResults = results.filter(r => r.processed && r.qualityMetrics);
  if (processedResults.length > 0) {
    const avgCoverage = processedResults.reduce((sum, r) => sum + r.qualityMetrics.coverageScore, 0) / processedResults.length;
    const avgCompleteness = processedResults.reduce((sum, r) => sum + r.qualityMetrics.completenessScore, 0) / processedResults.length;
    const avgAuthority = processedResults.reduce((sum, r) => sum + r.qualityMetrics.authorityScore, 0) / processedResults.length;
    const avgFreshness = processedResults.reduce((sum, r) => sum + r.qualityMetrics.freshnessScore, 0) / processedResults.length;
    const avgOverall = processedResults.reduce((sum, r) => sum + r.qualityMetrics.overallQualityScore, 0) / processedResults.length;

    console.log(`Average Coverage Score: ${Math.round(avgCoverage)}/100`);
    console.log(`Average Completeness Score: ${Math.round(avgCompleteness)}/100`);
    console.log(`Average Authority Score: ${Math.round(avgAuthority)}/100`);
    console.log(`Average Freshness Score: ${Math.round(avgFreshness)}/100`);
    console.log(`Average Overall Quality Score: ${Math.round(avgOverall)}/100`);
  }

  console.log("\nIndividual Results:");
  results.forEach(r => {
    if (r.processed) {
      const status = r.validationPassed ? "✅" : "❌";
      const metrics = r.qualityMetrics ? ` (Coverage: ${r.qualityMetrics.coverageScore}, Overall: ${r.qualityMetrics.overallQualityScore})` : "";
      console.log(`${status} ${r.slug}: ${r.state}${metrics}`);
    } else {
      console.log(`❌ ${r.slug}: ${r.error}`);
    }
  });
}

runPhase33Pilot()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("Error:", error);
    process.exit(1);
  });
