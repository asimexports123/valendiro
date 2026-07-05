/**
 * Phase 34A: Canonical Knowledge Composition Pilot
 * 
 * Reference-based composition (not copy-based)
 * Validate that duplicates don't increase
 * Composed packages are never persisted
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

  console.log("Phase 34A: Canonical Knowledge Composition Pilot");
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

  // Step 2: Identify Canonical Knowledge
  console.log("Step 2: Identify Canonical Knowledge");
  const canonicalKnowledge = knowledgeComposer.identifyCanonicalKnowledge(loadedPackages);
  console.log(`  Canonical groups created: ${canonicalKnowledge.size}`);
  for (const [category, pkg] of canonicalKnowledge.entries()) {
    const totalItems = pkg.definitions.length + pkg.concepts.length + pkg.warnings.length + pkg.bestPractices.length;
    console.log(`  ${category}: ${totalItems} canonical items`);
  }
  console.log();

  // Step 3: Compose Packages with References (Not Copies)
  console.log("Step 3: Compose Packages with References (Not Copies)");
  const compositionResults = [];
  for (const pkg of loadedPackages) {
    const result = knowledgeComposer.composePackageWithReferences(pkg, canonicalKnowledge);
    compositionResults.push({
      slug: pkg.slug,
      original: pkg,
      topicPackage: result.topicPackage,
      referenceCount: result.referenceCount,
      canonicalGroupsCreated: result.canonicalGroupsCreated,
    });
    console.log(`  ${pkg.slug}: ${result.referenceCount} references created`);
  }
  console.log();

  // Step 4: Duplicate Detection After Reference-Based Composition
  console.log("Step 4: Duplicate Detection (After Reference-Based Composition)");
  const topicPackagesOnly = compositionResults.map(r => r.topicPackage);
  const duplicateReportAfter = duplicateDetector.detectDuplicates(topicPackagesOnly);
  console.log(`  Duplicate definitions: ${duplicateReportAfter.duplicateDefinitions.length}`);
  console.log(`  Duplicate concepts: ${duplicateReportAfter.duplicateConcepts.length}`);
  console.log(`  Duplicate procedures: ${duplicateReportAfter.duplicateProcedures.length}`);
  console.log(`  Duplicate warnings: ${duplicateReportAfter.duplicateWarnings.length}`);
  console.log(`  Duplicate best practices: ${duplicateReportAfter.duplicateBestPractices.length}`);
  console.log(`  Total duplicates: ${duplicateReportAfter.totalDuplicates}\n`);

  // Step 5: Validate Duplicates Don't Increase
  console.log("Step 5: Validate Duplicates Don't Increase");
  const duplicatesIncreased = duplicateReportAfter.totalDuplicates > duplicateReportBefore.totalDuplicates;
  const duplicatesDecreased = duplicateReportAfter.totalDuplicates < duplicateReportBefore.totalDuplicates;
  const duplicatesSame = duplicateReportAfter.totalDuplicates === duplicateReportBefore.totalDuplicates;
  
  if (duplicatesSame) {
    console.log(`  ✅ Duplicates unchanged: ${duplicateReportBefore.totalDuplicates} → ${duplicateReportAfter.totalDuplicates}`);
  } else if (duplicatesDecreased) {
    console.log(`  ✅ Duplicates decreased: ${duplicateReportBefore.totalDuplicates} → ${duplicateReportAfter.totalDuplicates}`);
  } else {
    console.log(`  ❌ Duplicates increased: ${duplicateReportBefore.totalDuplicates} → ${duplicateReportAfter.totalDuplicates}`);
  }
  console.log();

  // Step 6: Authoring-Time Resolution (Temporary Composed Package, Never Persisted)
  console.log("Step 6: Authoring-Time Resolution (Temporary Composed Package, Never Persisted)");
  let totalReferences = 0;
  for (const result of compositionResults) {
    totalReferences += result.referenceCount;
  }
  console.log(`  Total references created: ${totalReferences}`);
  console.log(`  Average references per package: ${Math.round(totalReferences / compositionResults.length)}`);
  console.log();

  // Step 7: Package Size Reduction
  console.log("Step 7: Package Size Reduction");
  let originalTotalSize = 0;
  let composedTotalSize = 0;
  for (const result of compositionResults) {
    const originalSize = JSON.stringify(result.original).length;
    const composedSize = JSON.stringify(result.topicPackage).length;
    originalTotalSize += originalSize;
    composedTotalSize += composedSize;
  }
  console.log(`  Original total size: ${originalTotalSize} bytes`);
  console.log(`  Composed total size: ${composedTotalSize} bytes`);
  console.log(`  Size reduction: ${Math.round((1 - composedTotalSize / originalTotalSize) * 100)}%`);
  console.log();

  // Step 8: Validation of Topic Packages (Not Composed)
  console.log("Step 8: Validation of Topic Packages (Not Composed)");
  let validationPassed = 0;
  for (const result of compositionResults) {
    const validationResult = dataProcessor.processPackage(result.topicPackage, []);
    if (validationResult.valid) {
      validationPassed++;
      console.log(`  ✅ ${result.slug}: Validation passed`);
    } else {
      console.log(`  ❌ ${result.slug}: Validation failed`);
    }
  }

  console.log();
  console.log("=".repeat(60));
  console.log("PHASE 34A CANONICAL COMPOSITION PILOT RESULTS");
  console.log("=".repeat(60));
  console.log(`Canonical reusable groups created: ${canonicalKnowledge.size}`);
  console.log(`References created: ${totalReferences}`);
  console.log(`Duplicate count before: ${duplicateReportBefore.totalDuplicates}`);
  console.log(`Duplicate count after: ${duplicateReportAfter.totalDuplicates}`);
  console.log(`Duplicate change: ${duplicateReportAfter.totalDuplicates - duplicateReportBefore.totalDuplicates}`);
  console.log(`Validation passed: ${validationPassed}/${compositionResults.length}`);
  console.log(`Package size reduction: ${Math.round((1 - composedTotalSize / originalTotalSize) * 100)}%`);
}

runPhase34CompositionPilot()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("Error:", error);
    process.exit(1);
  });
