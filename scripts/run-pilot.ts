/**
 * Phase 31: Production Pilot Execution
 * 
 * Dry Run Mode: Validates pipeline without affecting production
 * 
 * Mandatory Pipeline:
 * Keyword Database → Source Adapter → Data Processor → Knowledge Package → 
 * Knowledge Authoring → Quality Validation → Scoring Engine → Renderer → Publication → Static/ISR Page
 */

import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

import { DataProcessor } from "../services/dataProcessor/dataProcessor";
import { ScoringEngine } from "../services/scoring/scoringEngine";
import { loadKnowledgePackage } from "../services/renderer/knowledgePackageLoader";
import type { KnowledgePackage } from "../services/renderer/types";

interface PilotOptions {
  dryRun: boolean;
  limit?: number;
  slug?: string;
}

interface PilotResult {
  slug: string;
  knowledgePackageId: string;
  validationPassed: boolean;
  validationErrors: string[];
  validationWarnings: string[];
  qualityScore: number;
  passesThreshold: boolean;
  breakdown: {
    subjectAccuracy: number;
    knowledgeCoverage: number;
    readability: number;
    practicalValue: number;
    examples: number;
    internalLinking: number;
    seoMetadata: number;
    validationIntegrity: number;
  };
  published: boolean;
  dryRun: boolean;
}

async function runPilot(options: PilotOptions): Promise<PilotResult[]> {
  const results: PilotResult[] = [];
  const dryRun = options.dryRun;
  const limit = options.limit || 10;
  const specificSlug = options.slug;

  console.log(`\n${dryRun ? "DRY RUN MODE" : "PRODUCTION MODE"}`);
  console.log(`Limit: ${limit}`);
  if (specificSlug) console.log(`Specific slug: ${specificSlug}`);
  console.log("=".repeat(50));

  // Phase 31.4: Validation Gates
  const dataProcessor = new DataProcessor({
    minConfidence: 0.5,
    allowPlaceholders: false,
    requireMetadata: true,
  });

  // Phase 31.3: Scoring Engine
  const scoringEngine = new ScoringEngine({
    minimumScore: 85,
  });

  // Get topics to process
  const topics = await getTopicsToProcess(specificSlug, limit);
  console.log(`\nProcessing ${topics.length} topics...\n`);

  for (const topic of topics) {
    console.log(`\nProcessing: ${topic.slug}`);
    console.log("-".repeat(40));

    try {
      // Step 1: Load Knowledge Package from database
      const loadResult = await loadKnowledgePackage({ packageId: topic.package_id });
      if (!loadResult.package || loadResult.error) {
        console.log(`❌ Failed to load Knowledge Package: ${loadResult.error}`);
        results.push({
          slug: topic.slug,
          knowledgePackageId: topic.package_id,
          validationPassed: false,
          validationErrors: [loadResult.error || "Failed to load package"],
          validationWarnings: [],
          qualityScore: 0,
          passesThreshold: false,
          breakdown: {
            subjectAccuracy: 0,
            knowledgeCoverage: 0,
            readability: 0,
            practicalValue: 0,
            examples: 0,
            internalLinking: 0,
            seoMetadata: 0,
            validationIntegrity: 0,
          },
          published: false,
          dryRun,
        });
        continue;
      }

      const pkg = loadResult.package;
      console.log(`✅ Knowledge Package loaded: ${pkg.id}`);

      // Step 2: Validation Gates (Phase 31.4)
      console.log("Running validation gates...");
      const validationResult = dataProcessor.processPackage(pkg, []);
      
      console.log(`Validation: ${validationResult.valid ? "✅ PASS" : "❌ FAIL"}`);
      if (validationResult.errors.length > 0) {
        validationResult.errors.forEach(err => console.log(`  - ERROR: ${err}`));
      }
      if (validationResult.warnings.length > 0) {
        validationResult.warnings.forEach(warn => console.log(`  - WARNING: ${warn}`));
      }

      if (!validationResult.valid) {
        console.log("❌ Validation failed - blocking before scoring");
        results.push({
          slug: topic.slug,
          knowledgePackageId: pkg.id,
          validationPassed: false,
          validationErrors: validationResult.errors,
          validationWarnings: validationResult.warnings,
          qualityScore: 0,
          passesThreshold: false,
          breakdown: {
            subjectAccuracy: 0,
            knowledgeCoverage: 0,
            readability: 0,
            practicalValue: 0,
            examples: 0,
            internalLinking: 0,
            seoMetadata: 0,
            validationIntegrity: 0,
          },
          published: false,
          dryRun,
        });
        continue;
      }

      // Step 3: Scoring (Phase 31.3)
      console.log("Running scoring engine...");
      const scoreResult = scoringEngine.scorePackage(pkg);
      
      console.log(`Overall Score: ${scoreResult.overallScore}/100`);
      console.log(`Threshold: ${scoreResult.passesThreshold ? "✅ PASS" : "❌ FAIL"}`);
      console.log("Breakdown:");
      console.log(`  Subject Accuracy: ${scoreResult.breakdown.subjectAccuracy}`);
      console.log(`  Knowledge Coverage: ${scoreResult.breakdown.knowledgeCoverage}`);
      console.log(`  Readability: ${scoreResult.breakdown.readability}`);
      console.log(`  Practical Value: ${scoreResult.breakdown.practicalValue}`);
      console.log(`  Examples: ${scoreResult.breakdown.examples}`);
      console.log(`  Internal Linking: ${scoreResult.breakdown.internalLinking}`);
      console.log(`  SEO Metadata: ${scoreResult.breakdown.seoMetadata}`);
      console.log(`  Validation Integrity: ${scoreResult.breakdown.validationIntegrity}`);

      if (!scoreResult.passesThreshold) {
        console.log("❌ Score below threshold (85) - blocking publication");
        results.push({
          slug: topic.slug,
          knowledgePackageId: pkg.id,
          validationPassed: true,
          validationErrors: [],
          validationWarnings: validationResult.warnings,
          qualityScore: scoreResult.overallScore,
          passesThreshold: false,
          breakdown: scoreResult.breakdown,
          published: false,
          dryRun,
        });
        continue;
      }

      // Step 4: Publication (skip in dry run mode)
      if (dryRun) {
        console.log("🔵 DRY RUN: Skipping publication");
        results.push({
          slug: topic.slug,
          knowledgePackageId: pkg.id,
          validationPassed: true,
          validationErrors: [],
          validationWarnings: validationResult.warnings,
          qualityScore: scoreResult.overallScore,
          passesThreshold: true,
          breakdown: scoreResult.breakdown,
          published: false,
          dryRun: true,
        });
      } else {
        console.log("Publishing...");
        // TODO: Implement actual publication logic
        // This would call the renderer and update the database
        console.log("🔵 Publication not yet implemented in pilot script");
        results.push({
          slug: topic.slug,
          knowledgePackageId: pkg.id,
          validationPassed: true,
          validationErrors: [],
          validationWarnings: validationResult.warnings,
          qualityScore: scoreResult.overallScore,
          passesThreshold: true,
          breakdown: scoreResult.breakdown,
          published: false,
          dryRun: false,
        });
      }

    } catch (error: any) {
      console.log(`❌ Error processing ${topic.slug}: ${error.message}`);
      results.push({
        slug: topic.slug,
        knowledgePackageId: topic.package_id,
        validationPassed: false,
        validationErrors: [error.message],
        validationWarnings: [],
        qualityScore: 0,
        passesThreshold: false,
        breakdown: {
          subjectAccuracy: 0,
          knowledgeCoverage: 0,
          readability: 0,
          practicalValue: 0,
          examples: 0,
          internalLinking: 0,
          seoMetadata: 0,
          validationIntegrity: 0,
        },
        published: false,
        dryRun,
      });
    }
  }

  return results;
}

async function getTopicsToProcess(specificSlug?: string, limit?: number): Promise<any[]> {
  // For the pilot, we'll use existing knowledge packages from the database
  const { createAdminClient } = await import("../lib/supabase/admin");
  const sb = createAdminClient();

  let query = sb.from("knowledge_packages").select("id, slug, topic_id").limit(limit || 10);

  if (specificSlug) {
    query = query.eq("slug", specificSlug);
  } else {
    query = query.order("created_at", { ascending: false }).limit(limit || 10);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching topics:", error);
    return [];
  }

  return data.map((pkg: any) => ({
    package_id: pkg.id,
    slug: pkg.slug,
    topic_id: pkg.topic_id,
  }));
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const limitIndex = args.indexOf("--limit");
  const limit = limitIndex !== -1 ? parseInt(args[limitIndex + 1]) : undefined;
  const slugIndex = args.indexOf("--slug");
  const slug = slugIndex !== -1 ? args[slugIndex + 1] : undefined;

  if (!dryRun) {
    console.log("⚠️  WARNING: Running in PRODUCTION mode");
    console.log("This will publish pages to production.");
    console.log("Use --dry-run for validation without publication.\n");
  }

  const results = await runPilot({
    dryRun,
    limit,
    slug,
  });

  console.log("\n" + "=".repeat(50));
  console.log("PILOT RESULTS SUMMARY");
  console.log("=".repeat(50));
  console.log(`Total processed: ${results.length}`);
  console.log(`Validation passed: ${results.filter(r => r.validationPassed).length}`);
  console.log(`Score ≥ 85: ${results.filter(r => r.passesThreshold).length}`);
  console.log(`Published: ${results.filter(r => r.published).length}`);
  console.log(`Failed: ${results.filter(r => !r.validationPassed || !r.passesThreshold).length}`);

  console.log("\nIndividual Results:");
  results.forEach(result => {
    const status = result.passesThreshold ? "✅" : "❌";
    console.log(`${status} ${result.slug}: ${result.qualityScore}/100 ${result.published ? "(PUBLISHED)" : "(NOT PUBLISHED)"}`);
  });
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("Error:", error);
    process.exit(1);
  });
