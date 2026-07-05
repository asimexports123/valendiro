/**
 * Phase 34: Knowledge Composition Pilot
 * 
 * Run composition on the 10 pilot topics to measure improvements
 */

import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

import { createAdminClient } from "../lib/supabase/admin";
import { loadKnowledgePackage } from "../services/renderer/knowledgePackageLoader";
import { DuplicateDetector } from "../services/composition/duplicateDetection";
import { KnowledgeComposer } from "../services/composition/knowledgeComposer";
import { QualityMetricsCalculator } from "../services/qualityMetrics/qualityMetrics";
import { DataProcessor } from "../services/dataProcessor/dataProcessor";

async function runPhase34CompositionPilot() {
  const sb = createAdminClient();
  const duplicateDetector = new DuplicateDetector();
  const knowledgeComposer = new KnowledgeComposer();
  const qualityMetricsCalculator = new QualityMetricsCalculator();
  const dataProcessor = new DataProcessor({ minConfidence: 0.0, allowPlaceholders: false, requireMetadata: true });

  console.log("Phase 34: Knowledge Composition Pilot");
  console.log("=".repeat(60));

  // Get first 10 knowledge packages from database
  const { data: packages } = await sb
    .from("knowledge_packages")
    .select("id, slug")
    .limit(10);

  if (!packages || packages.length === 0) {
    console.log("No knowledge packages found in database");
    return;
  }

  console.log(`Processing ${packages.length} knowledge packages\n`);

  // Load all packages
  const loadedPackages = [];
  for (const pkg of packages) {
    const result = await loadKnowledgePackage({ packageId: pkg.id });
    if (result && result.package) {
      loadedPackages.push(result.package);
    }
  }

  console.log(`Loaded ${loadedPackages.length} packages\n`);

  // Step 1: Duplicate Detection (Before Composition)
  console.log("Step 1: Duplicate Detection (Before Composition)");
  const duplicateReportBefore = duplicateDetector.detectDuplicates(loadedPackages);
  console.log(`  Duplicate definitions: ${duplicateReportBefore.duplicateDefinitions.length}`);
  console.log(`  Duplicate concepts: ${duplicateReportBefore.duplicateConcepts.length}`);
  console.log(`  Duplicate procedures: ${duplicateReportBefore.duplicateProcedures.length}`);
  console.log(`  Duplicate warnings: ${duplicateReportBefore.duplicateWarnings.length}`);
  console.log(`  Duplicate best practices: ${duplicateReportBefore.duplicateBestPractices.length}`);
  console.log(`  Total duplicates: ${duplicateReportBefore.totalDuplicates}\n`);

  // Step 2: Identify Reusable Knowledge
  console.log("Step 2: Identify Reusable Knowledge");
  const reusableKnowledge = knowledgeComposer.identifyReusableKnowledge(loadedPackages);
  let totalReusable = 0;
  for (const [category, items] of reusableKnowledge.entries()) {
    console.log(`  ${category}: ${items.length} reusable items`);
    totalReusable += items.length;
  }
  console.log(`  Total reusable knowledge: ${totalReusable}\n`);

  // Step 3: Compose Packages
  console.log("Step 3: Compose Packages");
  const compositionResults = [];
  for (const pkg of loadedPackages) {
    const result = knowledgeComposer.composePackage(pkg, reusableKnowledge);
    compositionResults.push({
      slug: pkg.slug,
      original: pkg,
      composed: result.composedPackage,
      reusedCount: result.reusedKnowledgeCount,
      topicSpecificCount: result.topicSpecificKnowledgeCount,
      duplicatesEliminated: result.duplicatesEliminated,
    });
    console.log(`  ${pkg.slug}: reused ${result.reusedKnowledgeCount}, eliminated ${result.duplicatesEliminated} duplicates`);
  }
  console.log();

  // Step 4: Duplicate Detection (After Composition)
  console.log("Step 4: Duplicate Detection (After Composition)");
  const composedPackages = compositionResults.map(r => r.composed);
  const duplicateReportAfter = duplicateDetector.detectDuplicates(composedPackages);
  console.log(`  Duplicate definitions: ${duplicateReportAfter.duplicateDefinitions.length}`);
  console.log(`  Duplicate concepts: ${duplicateReportAfter.duplicateConcepts.length}`);
  console.log(`  Duplicate procedures: ${duplicateReportAfter.duplicateProcedures.length}`);
  console.log(`  Duplicate warnings: ${duplicateReportAfter.duplicateWarnings.length}`);
  console.log(`  Duplicate best practices: ${duplicateReportAfter.duplicateBestPractices.length}`);
  console.log(`  Total duplicates: ${duplicateReportAfter.totalDuplicates}\n`);

  // Step 5: Quality Metrics Comparison
  console.log("Step 5: Quality Metrics Comparison");
  let totalCoverageImprovement = 0;
  let totalCompletenessImprovement = 0;
  let totalQualityImprovement = 0;

  for (const result of compositionResults) {
    const originalMetrics = qualityMetricsCalculator.calculateMetrics(result.original);
    const composedMetrics = qualityMetricsCalculator.calculateMetrics(result.composed);

    const coverageImprovement = composedMetrics.coverageScore - originalMetrics.coverageScore;
    const completenessImprovement = composedMetrics.completenessScore - originalMetrics.completenessScore;
    const qualityImprovement = composedMetrics.overallQualityScore - originalMetrics.overallQualityScore;

    totalCoverageImprovement += coverageImprovement;
    totalCompletenessImprovement += completenessImprovement;
    totalQualityImprovement += qualityImprovement;

    console.log(`  ${result.slug}:`);
    console.log(`    Coverage: ${originalMetrics.coverageScore} → ${composedMetrics.coverageScore} (${coverageImprovement >= 0 ? '+' : ''}${coverageImprovement})`);
    console.log(`    Completeness: ${originalMetrics.completenessScore} → ${composedMetrics.completenessScore} (${completenessImprovement >= 0 ? '+' : ''}${completenessImprovement})`);
    console.log(`    Overall Quality: ${originalMetrics.overallQualityScore} → ${composedMetrics.overallQualityScore} (${qualityImprovement >= 0 ? '+' : ''}${qualityImprovement})`);
  }

  console.log();
  console.log(`Average Coverage Improvement: ${Math.round(totalCoverageImprovement / compositionResults.length)}`);
  console.log(`Average Completeness Improvement: ${Math.round(totalCompletenessImprovement / compositionResults.length)}`);
  console.log(`Average Quality Improvement: ${Math.round(totalQualityImprovement / compositionResults.length)}`);

  // Step 6: Validation
  console.log("\nStep 6: Validation of Composed Packages");
  let validationPassed = 0;
  for (const result of compositionResults) {
    const validationResult = dataProcessor.processPackage(result.composed, []);
    if (validationResult.valid) {
      validationPassed++;
      console.log(`  ✅ ${result.slug}: Validation passed`);
    } else {
      console.log(`  ❌ ${result.slug}: Validation failed`);
    }
  }

  console.log();
  console.log("=".repeat(60));
  console.log("PHASE 34 COMPOSITION PILOT RESULTS");
  console.log("=".repeat(60));
  console.log(`Reusable knowledge groups identified: ${reusableKnowledge.size}`);
  console.log(`Duplicated facts detected (before): ${duplicateReportBefore.totalDuplicates}`);
  console.log(`Duplicated facts eliminated: ${duplicateReportBefore.totalDuplicates - duplicateReportAfter.totalDuplicates}`);
  console.log(`Duplicated facts (after): ${duplicateReportAfter.totalDuplicates}`);
  console.log(`Average coverage improvement: ${Math.round(totalCoverageImprovement / compositionResults.length)}`);
  console.log(`Average quality improvement: ${Math.round(totalQualityImprovement / compositionResults.length)}`);
  console.log(`Validation passed: ${validationPassed}/${compositionResults.length}`);
}

runPhase34CompositionPilot()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("Error:", error);
    process.exit(1);
  });
