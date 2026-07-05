/**
 * Phase 32: Knowledge Acquisition Pilot
 * 
 * Production Pilot - 10 Topics
 * 
 * Topics:
 * 1. Python Programming Fundamentals
 * 2. Git Version Control
 * 3. Data Structures
 * 4. Investing Basics
 * 5. Cybersecurity Fundamentals
 * 6. Nutrition Fundamentals
 * 7. Diabetes
 * 8. Travel Planning Fundamentals
 * 9. Home Maintenance Basics
 * 10. Leadership Fundamentals
 */

import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

import { createAdminClient } from "../lib/supabase/admin";
import { AcquisitionPipeline, type AcquisitionOptions } from "../services/acquisition/acquisitionAdapter";
import { DataProcessor } from "../services/dataProcessor/dataProcessor";
import { ScoringEngine } from "../services/scoring/scoringEngine";
import type { KnowledgePackage } from "../services/renderer/types";

const PILOT_TOPICS = [
  { slug: "python-programming-fundamentals", category: "technology", officialDocs: "https://docs.python.org/3/tutorial/" },
  { slug: "git-version-control", category: "technology", officialDocs: "https://git-scm.com/doc" },
  { slug: "data-structures", category: "technology", officialDocs: "https://en.wikipedia.org/wiki/Data_structure" },
  { slug: "investing-basics", category: "finance", officialDocs: "https://www.investopedia.com/investing-4427673" },
  { slug: "cybersecurity-fundamentals", category: "technology", officialDocs: "https://www.cisa.gov/cybersecurity-awareness" },
  { slug: "nutrition-fundamentals", category: "health", officialDocs: "https://www.who.int/news-room/fact-sheets/detail/healthy-diet" },
  { slug: "diabetes", category: "health", officialDocs: "https://www.who.int/news-room/fact-sheets/detail/diabetes" },
  { slug: "travel-planning-fundamentals", category: "travel", officialDocs: "https://en.wikipedia.org/wiki/Travel_planning" },
  { slug: "home-maintenance-basics", category: "lifestyle", officialDocs: "https://en.wikipedia.org/wiki/Home_maintenance" },
  { slug: "leadership-fundamentals", category: "business", officialDocs: "https://en.wikipedia.org/wiki/Leadership" },
];

async function runAcquisitionPilot() {
  const sb = createAdminClient();
  const pipeline = new AcquisitionPipeline();
  const dataProcessor = new DataProcessor({
    minConfidence: 0.0,
    allowPlaceholders: false,
    requireMetadata: true,
  });
  const scoringEngine = new ScoringEngine({
    minimumScore: 85,
  });

  console.log("Phase 32: Knowledge Acquisition Pilot");
  console.log("=".repeat(60));
  console.log(`Processing ${PILOT_TOPICS.length} topics\n`);

  const results: any[] = [];

  for (const topic of PILOT_TOPICS) {
    console.log(`\nProcessing: ${topic.slug}`);
    console.log("-".repeat(40));

    try {
      // Step 1: Acquisition
      console.log("Step 1: Knowledge Acquisition...");
      const acquisitionOptions: AcquisitionOptions = {
        topicSlug: topic.slug,
        category: topic.category,
        sources: [
          {
            tier: 1,
            sourceType: "official-docs",
            url: topic.officialDocs,
            authority: "official",
          },
        ],
      };

      const acquisitionResult = await pipeline.acquireForTopic(acquisitionOptions);
      
      console.log(`Acquisition: ${acquisitionResult.success ? "✅" : "❌"}`);
      console.log(`Collections acquired: ${JSON.stringify(acquisitionResult.collectionsAcquired)}`);
      
      if (acquisitionResult.collectionsMarkedAcquisitionRequired.length > 0) {
        console.log(`Marked ACQUISITION_REQUIRED: ${acquisitionResult.collectionsMarkedAcquisitionRequired.join(", ")}`);
      }

      if (!acquisitionResult.success || !acquisitionResult.knowledgePackage) {
        console.log("❌ Acquisition failed - marking as ACQUISITION_REQUIRED");
        results.push({
          slug: topic.slug,
          acquired: false,
          validationPassed: false,
          qualityScore: 0,
          passesThreshold: false,
          error: "Acquisition failed",
        });
        continue;
      }

      // Step 2: Validation
      console.log("Step 2: Validation...");
      const validationResult = dataProcessor.processPackage(acquisitionResult.knowledgePackage, []);
      
      console.log(`Validation: ${validationResult.valid ? "✅" : "❌"}`);
      if (!validationResult.valid) {
        validationResult.errors.forEach(err => console.log(`  - ${err}`));
      }

      if (!validationResult.valid) {
        console.log("❌ Validation failed");
        results.push({
          slug: topic.slug,
          acquired: true,
          validationPassed: false,
          qualityScore: 0,
          passesThreshold: false,
          error: "Validation failed",
        });
        continue;
      }

      // Step 3: Scoring
      console.log("Step 3: Scoring...");
      const scoreResult = scoringEngine.scorePackage(acquisitionResult.knowledgePackage);
      
      console.log(`Quality Score: ${scoreResult.overallScore}/100`);
      console.log(`Threshold: ${scoreResult.passesThreshold ? "✅ PASS" : "❌ FAIL"}`);

      results.push({
        slug: topic.slug,
        acquired: true,
        validationPassed: true,
        qualityScore: scoreResult.overallScore,
        passesThreshold: scoreResult.passesThreshold,
        error: null,
        collectionsAcquired: acquisitionResult.collectionsAcquired,
      });

    } catch (error: any) {
      console.log(`❌ Error: ${error.message}`);
      results.push({
        slug: topic.slug,
        acquired: false,
        validationPassed: false,
        qualityScore: 0,
        passesThreshold: false,
        error: error.message,
      });
    }
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("ACQUISITION PILOT RESULTS");
  console.log("=".repeat(60));
  console.log(`Total topics: ${results.length}`);
  console.log(`Acquired: ${results.filter(r => r.acquired).length}`);
  console.log(`Validation passed: ${results.filter(r => r.validationPassed).length}`);
  console.log(`Score ≥ 85: ${results.filter(r => r.passesThreshold).length}`);

  const acquiredResults = results.filter(r => r.acquired && r.validationPassed);
  if (acquiredResults.length > 0) {
    const avgScore = acquiredResults.reduce((sum, r) => sum + r.qualityScore, 0) / acquiredResults.length;
    console.log(`Average quality score: ${Math.round(avgScore)}/100`);
  }

  const totalCollections = results.reduce((sum, r) => {
    if (r.collectionsAcquired) {
      return sum + Object.values(r.collectionsAcquired).reduce((s: number, c: any) => s + (c as number), 0);
    }
    return sum;
  }, 0);
  const avgCoverage = totalCollections / results.length;
  console.log(`Average collections per topic: ${Math.round(avgCoverage)}`);

  console.log("\nIndividual Results:");
  results.forEach(r => {
    const status = r.passesThreshold ? "✅" : r.acquired ? "⚠️" : "❌";
    console.log(`${status} ${r.slug}: ${r.qualityScore}/100 ${r.error ? `(${r.error})` : ""}`);
  });
}

runAcquisitionPilot()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("Error:", error);
    process.exit(1);
  });
