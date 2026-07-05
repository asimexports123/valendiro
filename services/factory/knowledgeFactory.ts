/**
 * Phase 33.1: Knowledge Factory
 * 
 * Orchestrates the complete pipeline for producing production-quality Knowledge Packages:
 * Knowledge Source → Connector → Extractor → Normalizer → Data Processor → Knowledge Package → Validation → Knowledge Authoring → Renderer → Publication
 */

import { DataProcessor } from "../dataProcessor/dataProcessor";
import { ScoringEngine } from "../scoring/scoringEngine";
import { QualityMetricsCalculator, type QualityMetrics } from "../qualityMetrics/qualityMetrics";
import { InMemoryEnrichmentQueue, type PackageState, type QueueItem } from "../enrichment/enrichmentQueue";
import type { KnowledgePackage } from "../renderer/types";

export interface FactoryOptions {
  dryRun: boolean;
  skipAcquisition: boolean;
  skipAuthoring: boolean;
  skipPublication: boolean;
}

export interface FactoryResult {
  packageId: string;
  slug: string;
  state: PackageState;
  validationPassed: boolean;
  qualityMetrics: QualityMetrics | null;
  scoringResult: any | null;
  published: boolean;
  error: string | null;
}

export class KnowledgeFactory {
  private dataProcessor: DataProcessor;
  private scoringEngine: ScoringEngine;
  private qualityMetricsCalculator: QualityMetricsCalculator;
  private queue: InMemoryEnrichmentQueue;

  constructor() {
    this.dataProcessor = new DataProcessor({
      minConfidence: 0.0,
      allowPlaceholders: false,
      requireMetadata: true,
    });

    this.scoringEngine = new ScoringEngine({
      minimumScore: 85,
    });

    this.qualityMetricsCalculator = new QualityMetricsCalculator();
    this.queue = new InMemoryEnrichmentQueue();
  }

  async processPackage(pkg: KnowledgePackage, options: FactoryOptions): Promise<FactoryResult> {
    console.log(`\nProcessing: ${pkg.slug}`);
    console.log("-".repeat(40));

    try {
      // Step 1: Validation (Data Processor)
      console.log("Step 1: Schema Validation");
      const validationResult = this.dataProcessor.processPackage(pkg, []);

      if (!validationResult.valid) {
        console.log(`❌ Validation failed`);
        validationResult.errors.forEach(err => console.log(`  - ${err}`));

        return {
          packageId: pkg.id,
          slug: pkg.slug,
          state: "ACQUISITION_REQUIRED",
          validationPassed: false,
          qualityMetrics: null,
          scoringResult: null,
          published: false,
          error: "Validation failed",
        };
      }

      console.log(`✅ Validation passed`);

      // Step 2: Quality Metrics Calculation
      console.log("Step 2: Quality Metrics Calculation");
      const qualityMetrics = this.qualityMetricsCalculator.calculateMetrics(pkg);
      console.log(`  Coverage: ${qualityMetrics.coverageScore}/100`);
      console.log(`  Completeness: ${qualityMetrics.completenessScore}/100`);
      console.log(`  Authority: ${qualityMetrics.authorityScore}/100`);
      console.log(`  Freshness: ${qualityMetrics.freshnessScore}/100`);
      console.log(`  Overall Quality: ${qualityMetrics.overallQualityScore}/100`);

      // Step 3: Scoring Engine
      console.log("Step 3: Scoring Engine");
      const scoreResult = this.scoringEngine.scorePackage(pkg);
      console.log(`  Quality Score: ${scoreResult.overallScore}/100`);
      console.log(`  Threshold: ${scoreResult.passesThreshold ? "✅ PASS" : "❌ FAIL"}`);

      // Step 4: Continuous Validation
      console.log("Step 4: Continuous Validation");
      const continuousValidation = this.runContinuousValidation(pkg, qualityMetrics);
      
      if (!continuousValidation.passed) {
        console.log(`❌ Continuous validation failed`);
        continuousValidation.failures.forEach(f => console.log(`  - ${f}`));

        return {
          packageId: pkg.id,
          slug: pkg.slug,
          state: "ENRICHMENT_REQUIRED",
          validationPassed: false,
          qualityMetrics,
          scoringResult: scoreResult,
          published: false,
          error: "Continuous validation failed",
        };
      }

      console.log(`✅ Continuous validation passed`);

      // Step 5: Knowledge Authoring (if not skipped)
      if (!options.skipAuthoring) {
        console.log("Step 5: Knowledge Authoring");
        // TODO: Integrate with Knowledge Authoring Orchestrator
        console.log("  ⚠️  Authoring not yet integrated");
      }

      // Step 6: Publication (if not skipped)
      if (!options.skipPublication) {
        console.log("Step 6: Publication");
        if (options.dryRun) {
          console.log("  🔵 DRY RUN: Skipping publication");
        } else {
          // TODO: Integrate with Publication Pipeline
          console.log("  ⚠️  Publication not yet integrated");
        }
      }

      return {
        packageId: pkg.id,
        slug: pkg.slug,
        state: options.skipPublication ? "VALIDATED" : "PUBLISHED",
        validationPassed: true,
        qualityMetrics,
        scoringResult: scoreResult,
        published: !options.dryRun && !options.skipPublication,
        error: null,
      };

    } catch (error: any) {
      console.log(`❌ Error: ${error.message}`);

      return {
        packageId: pkg.id,
        slug: pkg.slug,
        state: "ACQUISITION_REQUIRED",
        validationPassed: false,
        qualityMetrics: null,
        scoringResult: null,
        published: false,
        error: error.message,
      };
    }
  }

  private runContinuousValidation(pkg: KnowledgePackage, metrics: QualityMetrics): {
    passed: boolean;
    failures: string[];
  } {
    const failures: string[] = [];

    // Coverage threshold
    if (metrics.coverageScore < 90) {
      failures.push(`Coverage score ${metrics.coverageScore} < 90`);
    }

    // Completeness threshold
    if (metrics.completenessScore < 90) {
      failures.push(`Completeness score ${metrics.completenessScore} < 90`);
    }

    // Authority threshold
    if (metrics.authorityScore < 90) {
      failures.push(`Authority score ${metrics.authorityScore} < 90`);
    }

    // Freshness threshold
    if (metrics.freshnessScore < 85) {
      failures.push(`Freshness score ${metrics.freshnessScore} < 85`);
    }

    // Overall quality threshold
    if (metrics.overallQualityScore < 90) {
      failures.push(`Overall quality score ${metrics.overallQualityScore} < 90`);
    }

    // Placeholder detection
    const hasPlaceholders = this.detectPlaceholders(pkg);
    if (hasPlaceholders) {
      failures.push("Package contains placeholders");
    }

    // Duplicate detection
    const hasDuplicates = this.detectDuplicates(pkg);
    if (hasDuplicates) {
      failures.push("Package contains duplicate knowledge");
    }

    return {
      passed: failures.length === 0,
      failures,
    };
  }

  private detectPlaceholders(pkg: KnowledgePackage): boolean {
    const placeholderPatterns = ["TODO", "FIXME", "PLACEHOLDER", "TBD", "Coming soon"];

    const checkString = (str: string): boolean => {
      return placeholderPatterns.some(pattern => 
        str.toLowerCase().includes(pattern.toLowerCase())
      );
    };

    // Check definitions
    if (pkg.definitions.some(d => checkString(d.definition))) return true;
    if (pkg.definitions.some(d => checkString(d.term))) return true;

    // Check concepts
    if (pkg.concepts.some(c => checkString(c.description))) return true;

    // Check procedures
    if (pkg.procedures.some(p => p.steps.some(s => checkString(s)))) return true;

    // Check examples
    if (pkg.examples.some(e => checkString(e.description))) return true;

    return false;
  }

  private detectDuplicates(pkg: KnowledgePackage): boolean {
    // Check for duplicate definition terms
    const definitionTerms = pkg.definitions.map(d => d.term.toLowerCase());
    const uniqueTerms = new Set(definitionTerms);
    if (definitionTerms.length !== uniqueTerms.size) return true;

    // Check for duplicate concept names
    const conceptNames = pkg.concepts.map(c => c.name.toLowerCase());
    const uniqueConcepts = new Set(conceptNames);
    if (conceptNames.length !== uniqueConcepts.size) return true;

    return false;
  }

  getQueue(): InMemoryEnrichmentQueue {
    return this.queue;
  }
}
