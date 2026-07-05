/**
 * Phase 44 - Production Stabilization
 * 
 * Production stabilization with:
 * - Connector failure policy (404 → BROKEN → Log → Skip → Continue)
 * - Regression rollback validation
 * - Source status management
 */

import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

import { PythonDocumentationConnector } from "../services/acquisition/connectors/pythonDocumentationConnector";
import { GitDocumentationConnector } from "../services/acquisition/connectors/gitDocumentationConnector";
import { MDNConnector } from "../services/acquisition/connectors/mdnConnector";
import { HTMLDocumentationExtractor } from "../services/acquisition/extractors/htmlDocumentationExtractor";
import { DataProcessor } from "../services/dataProcessor/dataProcessor";
import { QualityMetricsCalculator } from "../services/qualityMetrics/qualityMetrics";
import { getSubjectRegistry, updateSourceStatus, getActiveSources, type SourceStatus } from "../config/subjectSourceRegistry";
import { createHash } from "crypto";

interface ProductionMetrics {
  subject: string;
  quality: number;
  coverage: number;
  completeness: number;
  sourcesConsulted: string[];
  sourcesFailed: string[];
  sourcesActive: string[];
  sourcesBroken: string[];
  registryVersion: number;
}

interface RegressionCheck {
  subject: string;
  qualityBefore: number;
  qualityAfter: number;
  coverageBefore: number;
  coverageAfter: number;
  completenessBefore: number;
  completenessAfter: number;
  regressionDetected: boolean;
  rollbackRequired: boolean;
}

function generateKnowledgeHash(data: any): string {
  return createHash("sha256").update(JSON.stringify(data)).digest("hex").substring(0, 16);
}

function mergeKnowledge(knowledgeArrays: any[]): any {
  const merged = {
    definitions: [],
    concepts: [],
    procedures: [],
    examples: [],
    comparisons: [],
    commands: [],
    formulae: [],
    warnings: [],
    bestPractices: [],
    commonMistakes: [],
    faqs: [],
    references: [],
    metadata: {
      sourceUrl: "",
      extractedAt: new Date().toISOString(),
      confidence: "high",
    },
  };

  const seenTerms = new Set<string>();
  const seenNames = new Set<string>();
  const seenUrls = new Set<string>();

  knowledgeArrays.forEach((knowledge) => {
    knowledge.definitions?.forEach((d: any) => {
      const key = d.term?.toLowerCase() || d.id;
      if (!seenTerms.has(key)) {
        seenTerms.add(key);
        (merged.definitions as any[]).push(d);
      }
    });

    knowledge.concepts?.forEach((c: any) => {
      const key = c.name?.toLowerCase() || c.id;
      if (!seenNames.has(key)) {
        seenNames.add(key);
        (merged.concepts as any[]).push(c);
      }
    });

    knowledge.procedures?.forEach((p: any) => {
      const key = p.name?.toLowerCase() || p.id;
      if (!seenNames.has(key)) {
        seenNames.add(key);
        (merged.procedures as any[]).push(p);
      }
    });

    knowledge.examples?.forEach((e: any) => {
      const key = e.title?.toLowerCase() || e.id;
      if (!seenNames.has(key)) {
        seenNames.add(key);
        (merged.examples as any[]).push(e);
      }
    });

    knowledge.comparisons?.forEach((c: any) => {
      const key = c.subject1?.toLowerCase() || c.id;
      if (!seenNames.has(key)) {
        seenNames.add(key);
        (merged.comparisons as any[]).push(c);
      }
    });

    knowledge.commands?.forEach((cmd: any) => {
      const key = cmd.command?.toLowerCase() || cmd.id;
      if (!seenNames.has(key)) {
        seenNames.add(key);
        (merged.commands as any[]).push(cmd);
      }
    });

    knowledge.formulae?.forEach((f: any) => {
      const key = f.name?.toLowerCase() || f.id;
      if (!seenNames.has(key)) {
        seenNames.add(key);
        (merged.formulae as any[]).push(f);
      }
    });

    knowledge.warnings?.forEach((w: any) => {
      const key = w.title?.toLowerCase() || w.id;
      if (!seenNames.has(key)) {
        seenNames.add(key);
        (merged.warnings as any[]).push(w);
      }
    });

    knowledge.bestPractices?.forEach((bp: any) => {
      const key = bp.title?.toLowerCase() || bp.id;
      if (!seenNames.has(key)) {
        seenNames.add(key);
        (merged.bestPractices as any[]).push(bp);
      }
    });

    knowledge.commonMistakes?.forEach((cm: any) => {
      const key = cm.mistake?.toLowerCase() || cm.id;
      if (!seenNames.has(key)) {
        seenNames.add(key);
        (merged.commonMistakes as any[]).push(cm);
      }
    });

    knowledge.faqs?.forEach((faq: any) => {
      const key = faq.question?.toLowerCase() || faq.id;
      if (!seenNames.has(key)) {
        seenNames.add(key);
        (merged.faqs as any[]).push(faq);
      }
    });

    knowledge.references?.forEach((r: any) => {
      const key = r.url?.toLowerCase() || r.id;
      if (!seenUrls.has(key)) {
        seenUrls.add(key);
        (merged.references as any[]).push(r);
      }
    });
  });

  return merged;
}

async function runPhase44ProductionStabilization() {
  const timestamp = new Date().toISOString();
  console.log("Phase 44 - Production Stabilization");
  console.log("=".repeat(60));
  console.log(`Timestamp: ${timestamp}\n`);

  const extractor = new HTMLDocumentationExtractor();
  const dataProcessor = new DataProcessor({
    minConfidence: 0.0,
    allowPlaceholders: false,
    requireMetadata: true,
  });
  const qualityMetricsCalculator = new QualityMetricsCalculator();

  // Baseline metrics from Phase 43
  const baselineMetrics: Record<string, { quality: number; coverage: number; completeness: number }> = {
    "python-programming-fundamentals": { quality: 76, coverage: 50, completeness: 67 },
    "git-version-control": { quality: 64, coverage: 42, completeness: 56 },
    "javascript-fundamentals": { quality: 64, coverage: 33, completeness: 44 },
  };

  const productionMetrics: ProductionMetrics[] = [];
  const regressionChecks: RegressionCheck[] = [];

  const pilotTopics = [
    { slug: "python-programming-fundamentals" },
    { slug: "git-version-control" },
    { slug: "javascript-fundamentals" },
  ];

  for (const topic of pilotTopics) {
    console.log(`Processing: ${topic.slug}`);
    console.log("-".repeat(40));

    const metrics: ProductionMetrics = {
      subject: topic.slug,
      quality: 0,
      coverage: 0,
      completeness: 0,
      sourcesConsulted: [],
      sourcesFailed: [],
      sourcesActive: [],
      sourcesBroken: [],
      registryVersion: 0,
    };

    const regressionCheck: RegressionCheck = {
      subject: topic.slug,
      qualityBefore: baselineMetrics[topic.slug].quality,
      qualityAfter: 0,
      coverageBefore: baselineMetrics[topic.slug].coverage,
      coverageAfter: 0,
      completenessBefore: baselineMetrics[topic.slug].completeness,
      completenessAfter: 0,
      regressionDetected: false,
      rollbackRequired: false,
    };

    try {
      const registry = getSubjectRegistry(topic.slug);
      if (!registry) {
        console.log(`  No registry found for ${topic.slug}`);
        continue;
      }

      metrics.registryVersion = registry.version;
      console.log(`  Registry Version: ${registry.version}`);

      // Get only active sources (skip BROKEN sources per connector failure policy)
      const activeSources = getActiveSources(topic.slug);
      metrics.sourcesActive = activeSources.map(s => s.name);
      console.log(`  Active Sources: ${activeSources.length}`);

      // Track broken sources
      const brokenSources = registry.sources.filter(s => s.status === "BROKEN");
      metrics.sourcesBroken = brokenSources.map(s => s.name);
      if (brokenSources.length > 0) {
        console.log(`  Broken Sources (skipped): ${brokenSources.map(s => s.name).join(", ")}`);
      }

      const knowledgeArrays: any[] = [];

      // Acquire from active sources only (connector failure policy: skip broken sources)
      for (const source of activeSources) {
        console.log(`  Consulting: ${source.name} (${source.status})`);
        metrics.sourcesConsulted.push(source.name);

        let connector: any;
        if (source.connector === "PythonDocumentationConnector") {
          connector = new PythonDocumentationConnector();
        } else if (source.connector === "GitDocumentationConnector") {
          connector = new GitDocumentationConnector();
        } else if (source.connector === "MDNConnector") {
          connector = new MDNConnector();
        } else {
          console.log(`    Unknown connector: ${source.connector}`);
          continue;
        }

        const connectorResult = await connector.connect({
          sourceType: connector.sourceType as any,
          sourceUrl: source.url,
        });

        if (connectorResult.error) {
          // Connector failure policy: 404 → BROKEN → Log → Skip → Continue
          if (connectorResult.error.includes("404") || connectorResult.error.includes("Not Found")) {
            console.log(`    ❌ 404 Error - Marking as BROKEN`);
            updateSourceStatus(topic.slug, source.name, "BROKEN", connectorResult.error);
            metrics.sourcesFailed.push(source.name);
          } else {
            console.log(`    ❌ Connection failed: ${connectorResult.error}`);
            metrics.sourcesFailed.push(source.name);
          }
          continue; // Skip and continue batch
        }

        if (connectorResult.data) {
          const extractorResult = await extractor.extract(connectorResult.data, {
            sourceUrl: source.url,
          } as any);

          if (extractorResult.success && extractorResult.knowledge) {
            knowledgeArrays.push(extractorResult.knowledge);
            console.log(`    ✅ Acquired`);
          } else {
            console.log(`    ❌ Extraction failed: ${extractorResult.error}`);
            metrics.sourcesFailed.push(source.name);
          }
        } else {
          console.log(`    ❌ No data returned`);
          metrics.sourcesFailed.push(source.name);
        }
      }

      // Merge knowledge
      const mergedKnowledge = mergeKnowledge(knowledgeArrays);
      console.log(`  Knowledge merged from ${knowledgeArrays.length} sources`);

      // Create Knowledge Package
      const knowledgePackageId = `pkg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const slug = topic.slug;

      const uniqueConcepts = mergedKnowledge.concepts.filter((concept: any, index: number, self: any[]) => 
        index === self.findIndex((c: any) => c.name === concept.name)
      );

      const testPackage = {
        id: knowledgePackageId,
        slug,
        knowledgeHash: generateKnowledgeHash(mergedKnowledge),
        topicId: null,
        category: "technology",
        intent: "educate" as const,
        definitions: mergedKnowledge.definitions.map((d: any) => ({
          id: d.id,
          term: d.term,
          definition: d.definition,
          confidence: "high",
        })),
        concepts: uniqueConcepts.map((c: any) => ({
          id: c.id,
          name: c.name,
          description: c.description,
          confidence: "high",
        })),
        procedures: mergedKnowledge.procedures.map((p: any) => ({
          id: p.id,
          name: p.name,
          steps: p.steps,
          confidence: "high",
        })),
        examples: mergedKnowledge.examples.map((e: any) => ({
          id: e.id,
          title: e.title,
          description: e.description,
          code: e.code,
          confidence: "high",
        })),
        comparisons: mergedKnowledge.comparisons.map((c: any) => ({
          id: c.id,
          subject1: c.subject1,
          subject2: c.subject2,
          criteria: c.criteria,
          comparisonData: c.comparisonData,
        })),
        commands: mergedKnowledge.commands.map((cmd: any) => ({
          id: cmd.id,
          command: cmd.command,
          description: cmd.description,
          syntax: cmd.syntax,
          confidence: "high",
        })),
        formulae: mergedKnowledge.formulae.map((f: any) => ({
          id: f.id,
          name: f.name,
          formula: f.formula,
          description: f.description,
          variables: f.variables,
          confidence: "high",
        })),
        warnings: mergedKnowledge.warnings.map((w: any) => ({
          id: w.id,
          title: w.title,
          description: w.description,
          severity: w.severity,
          confidence: "high",
        })),
        bestPractices: mergedKnowledge.bestPractices.map((bp: any) => ({
          id: bp.id,
          title: bp.title,
          description: bp.description,
          confidence: "high",
        })),
        commonMistakes: mergedKnowledge.commonMistakes.map((cm: any) => ({
          id: cm.id,
          mistake: cm.mistake,
          correction: cm.correction,
          confidence: "high",
        })),
        faqs: mergedKnowledge.faqs.map((faq: any) => ({
          id: faq.id,
          question: faq.question,
          answer: faq.answer,
          category: faq.category,
          confidence: "high",
        })),
        references: mergedKnowledge.references.map((r: any) => ({
          id: r.id,
          url: r.url,
          title: r.title,
        })),
        facts: [],
        citations: [],
        relationships: [],
        metadata: {
          sourceCount: knowledgeArrays.length,
          factCount: 0,
          relationshipCount: 0,
          lastUpdated: new Date().toISOString(),
          lastVerified: null,
          confidence: "high",
          sourceMetadata: {
            adapterName: "production-stabilization",
            adapterVersion: "1.0",
            sourceType: "stabilization" as any,
            retrievedAt: new Date().toISOString(),
            processedAt: new Date().toISOString(),
            validationStatus: "valid" as const,
          },
        },
      };

      // Calculate quality metrics
      const validationResult = dataProcessor.processPackage(testPackage, []);
      const qualityMetrics = qualityMetricsCalculator.calculateMetrics(testPackage);
      metrics.quality = qualityMetrics.overallQualityScore;
      metrics.coverage = qualityMetrics.coverageScore;

      // Calculate completeness
      const requiredCollections = ["definitions", "concepts", "procedures", "examples", "commands", "bestPractices", "commonMistakes", "warnings", "references"];
      const presentCollections = requiredCollections.filter(c => (testPackage as any)[c] && (testPackage as any)[c].length > 0);
      metrics.completeness = Math.round((presentCollections.length / requiredCollections.length) * 100);

      regressionCheck.qualityAfter = metrics.quality;
      regressionCheck.coverageAfter = metrics.coverage;
      regressionCheck.completenessAfter = metrics.completeness;

      // Regression rollback validation
      const qualityRegression = metrics.quality < regressionCheck.qualityBefore;
      const coverageRegression = metrics.coverage < regressionCheck.coverageBefore;
      const completenessRegression = metrics.completeness < regressionCheck.completenessBefore;

      if (qualityRegression || coverageRegression || completenessRegression) {
        regressionCheck.regressionDetected = true;
        regressionCheck.rollbackRequired = true;
        console.log(`  ❌ REGRESSION DETECTED - Rollback required`);
        if (qualityRegression) console.log(`    Quality decreased: ${regressionCheck.qualityBefore} → ${metrics.quality}`);
        if (coverageRegression) console.log(`    Coverage decreased: ${regressionCheck.coverageBefore} → ${metrics.coverage}`);
        if (completenessRegression) console.log(`    Completeness decreased: ${regressionCheck.completenessBefore}% → ${metrics.completeness}%`);
      } else {
        console.log(`  ✅ No regression detected`);
      }

      console.log(`  Quality Score: ${metrics.quality}/100`);
      console.log(`  Coverage Score: ${metrics.coverage}/100`);
      console.log(`  Completeness: ${metrics.completeness}%`);

    } catch (error: any) {
      console.log(`  ❌ Exception: ${error.message}`);
    }

    productionMetrics.push(metrics);
    regressionChecks.push(regressionCheck);
    console.log();
  }

  // Summary
  console.log("=".repeat(60));
  console.log("PRODUCTION STABILIZATION SUMMARY");
  console.log("=".repeat(60));

  productionMetrics.forEach(m => {
    console.log(`\n${m.subject}:`);
    console.log(`  Registry Version: ${m.registryVersion}`);
    console.log(`  Sources Consulted: ${m.sourcesConsulted.join(", ")}`);
    console.log(`  Sources Failed: ${m.sourcesFailed.join(", ") || "None"}`);
    console.log(`  Active Sources: ${m.sourcesActive.join(", ")}`);
    console.log(`  Broken Sources: ${m.sourcesBroken.join(", ") || "None"}`);
    console.log(`  Quality Score: ${m.quality}/100`);
    console.log(`  Coverage Score: ${m.coverage}/100`);
    console.log(`  Completeness: ${m.completeness}%`);
  });

  console.log("\n" + "=".repeat(60));
  console.log("REGRESSION ROLLBACK VALIDATION");
  console.log("=".repeat(60));

  regressionChecks.forEach(r => {
    console.log(`\n${r.subject}:`);
    console.log(`  Quality: ${r.qualityBefore} → ${r.qualityAfter} ${r.qualityAfter >= r.qualityBefore ? "✅" : "❌"}`);
    console.log(`  Coverage: ${r.coverageBefore} → ${r.coverageAfter} ${r.coverageAfter >= r.coverageBefore ? "✅" : "❌"}`);
    console.log(`  Completeness: ${r.completenessBefore}% → ${r.completenessAfter}% ${r.completenessAfter >= r.completenessBefore ? "✅" : "❌"}`);
    console.log(`  Regression Detected: ${r.regressionDetected ? "Yes" : "No"}`);
    console.log(`  Rollback Required: ${r.rollbackRequired ? "Yes" : "No"}`);
  });

  return {
    productionMetrics,
    regressionChecks,
  };
}

runPhase44ProductionStabilization()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("Production stabilization failed:", error);
    process.exit(1);
  });
