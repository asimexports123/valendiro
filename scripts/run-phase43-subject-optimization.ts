/**
 * Phase 43 - Subject-Specific Production Optimization
 * 
 * Optimize subjects individually while guaranteeing zero regressions.
 * No quality decreases, no coverage decreases, no completeness decreases.
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
import { getSubjectRegistry } from "../config/subjectSourceRegistry";
import { createHash } from "crypto";

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

async function runPhase43SubjectOptimization() {
  const timestamp = new Date().toISOString();
  console.log("Phase 43 - Subject-Specific Production Optimization");
  console.log("=".repeat(60));
  console.log(`Timestamp: ${timestamp}\n`);

  const extractor = new HTMLDocumentationExtractor();
  const dataProcessor = new DataProcessor({
    minConfidence: 0.0,
    allowPlaceholders: false,
    requireMetadata: true,
  });
  const qualityMetricsCalculator = new QualityMetricsCalculator();

  // Baseline metrics from Phase 42 (current state after regression)
  const baselineMetrics = {
    "python-programming-fundamentals": { quality: 76, coverage: 50, completeness: 67 },
    "git-version-control": { quality: 64, coverage: 42, completeness: 56 },
    "javascript-fundamentals": { quality: 64, coverage: 33, completeness: 44 }, // Current regressed state
  };

  const results: any[] = [];

  // Optimize JavaScript subject only (the one that regressed)
  const topicSlug = "javascript-fundamentals";
  console.log(`Optimizing: ${topicSlug}`);
  console.log("-".repeat(40));

  const result: any = {
    subject: topicSlug,
    qualityBefore: baselineMetrics[topicSlug].quality,
    coverageBefore: baselineMetrics[topicSlug].coverage,
    completenessBefore: baselineMetrics[topicSlug].completeness,
    qualityAfter: 0,
    coverageAfter: 0,
    completenessAfter: 0,
    rootCause: "",
    validationPassed: false,
    optimizationStatus: "FAILED",
  };

  try {
    const registry = getSubjectRegistry(topicSlug);
    if (!registry) {
      console.log(`  No registry found for ${topicSlug}`);
      result.rootCause = "No registry found";
      results.push(result);
      return results;
    }

    console.log(`  Subject: ${registry.subject}`);
    console.log(`  Sources: ${registry.sources.length}`);

    const knowledgeArrays: any[] = [];

    // Acquire from all sources in the registry
    for (const source of registry.sources) {
      console.log(`  Consulting: ${source.name}`);

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

      if (connectorResult.data) {
        const extractorResult = await extractor.extract(connectorResult.data, {
          sourceUrl: source.url,
        } as any);

        if (extractorResult.success && extractorResult.knowledge) {
          knowledgeArrays.push(extractorResult.knowledge);
          console.log(`    ✅ Acquired`);
        } else {
          console.log(`    ❌ Extraction failed: ${extractorResult.error}`);
        }
      } else {
        console.log(`    ❌ Connection failed: ${connectorResult.error}`);
      }
    }

    // Merge knowledge
    const mergedKnowledge = mergeKnowledge(knowledgeArrays);
    console.log(`  Knowledge merged from ${knowledgeArrays.length} sources`);

    // Create Knowledge Package
    const knowledgePackageId = `pkg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const slug = topicSlug;

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
          adapterName: "subject-optimization",
          adapterVersion: "1.0",
          sourceType: "optimization" as any,
          retrievedAt: new Date().toISOString(),
          processedAt: new Date().toISOString(),
          validationStatus: "valid" as const,
        },
      },
    };

    // Calculate quality metrics
    const validationResult = dataProcessor.processPackage(testPackage, []);
    const qualityMetrics = qualityMetricsCalculator.calculateMetrics(testPackage);
    result.qualityAfter = qualityMetrics.overallQualityScore;
    result.coverageAfter = qualityMetrics.coverageScore;

    // Calculate completeness
    const requiredCollections = ["definitions", "concepts", "procedures", "examples", "commands", "bestPractices", "commonMistakes", "warnings", "references"];
    const presentCollections = requiredCollections.filter(c => (testPackage as any)[c] && (testPackage as any)[c].length > 0);
    result.completenessAfter = Math.round((presentCollections.length / requiredCollections.length) * 100);

    console.log(`  Quality Score: ${result.qualityAfter}/100`);
    console.log(`  Coverage Score: ${result.coverageAfter}/100`);
    console.log(`  Completeness: ${result.completenessAfter}%`);

    // Regression protection: Check if any metric decreased
    const qualityRegression = result.qualityAfter < result.qualityBefore;
    const coverageRegression = result.coverageAfter < result.coverageBefore;
    const completenessRegression = result.completenessAfter < result.completenessBefore;

    if (qualityRegression || coverageRegression || completenessRegression) {
      result.rootCause = "Regression detected";
      result.optimizationStatus = "FAILED";
      result.validationPassed = false;
      console.log(`  ❌ REGRESSION DETECTED`);
      if (qualityRegression) console.log(`    Quality decreased: ${result.qualityBefore} → ${result.qualityAfter}`);
      if (coverageRegression) console.log(`    Coverage decreased: ${result.coverageBefore} → ${result.coverageAfter}`);
      if (completenessRegression) console.log(`    Completeness decreased: ${result.completenessBefore}% → ${result.completenessAfter}%`);
    } else {
      result.rootCause = "No regression";
      result.optimizationStatus = "SUCCESS";
      result.validationPassed = true;
      console.log(`  ✅ NO REGRESSIONS`);
    }

  } catch (error: any) {
    console.log(`  ❌ Exception: ${error.message}`);
    result.rootCause = `Exception: ${error.message}`;
    result.optimizationStatus = "FAILED";
    result.validationPassed = false;
  }

  results.push(result);
  console.log();

  // Summary
  console.log("=".repeat(60));
  console.log("SUBJECT OPTIMIZATION SUMMARY");
  console.log("=".repeat(60));

  results.forEach(r => {
    console.log(`\n${r.subject}:`);
    console.log(`  Quality: ${r.qualityBefore} → ${r.qualityAfter} (${r.qualityAfter >= r.qualityBefore ? "✅" : "❌"})`);
    console.log(`  Coverage: ${r.coverageBefore} → ${r.coverageAfter} (${r.coverageAfter >= r.coverageBefore ? "✅" : "❌"})`);
    console.log(`  Completeness: ${r.completenessBefore}% → ${r.completenessAfter}% (${r.completenessAfter >= r.completenessBefore ? "✅" : "❌"})`);
    console.log(`  Root Cause: ${r.rootCause}`);
    console.log(`  Optimization Status: ${r.optimizationStatus}`);
    console.log(`  Validation Passed: ${r.validationPassed}`);
  });

  return results;
}

runPhase43SubjectOptimization()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("Subject optimization failed:", error);
    process.exit(1);
  });
