/**
 * Phase 38 - Subject Acquisition Recipes
 * 
 * Deterministic acquisition recipes describing exactly which authoritative sources are required
 * Each source contributes only the collections assigned to it
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
import { createHash } from "crypto";

interface RecipeSource {
  name: string;
  url: string;
  connector: any;
  extractor: any;
  priority: number; // Lower number = higher priority
}

interface SubjectRecipe {
  subject: string;
  sources: RecipeSource[];
}

interface RecipeExecutionResult {
  subject: string;
  sourcesExecuted: number;
  sourcesFailed: number;
  collectionsPopulated: string[];
  missingCollections: string[];
  coverageScore: number;
  qualityScore: number;
  completenessScore: number;
  authorityScore: number;
  freshnessScore: number;
  validationPassed: boolean;
  recipeCompleteness: number;
}

function generateKnowledgeHash(data: any): string {
  return createHash("sha256").update(JSON.stringify(data)).digest("hex").substring(0, 16);
}

function mergeKnowledge(knowledgeArrays: any[], priorities: number[]): any {
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

  const seenIds = new Set<string>();
  const seenTerms = new Set<string>();
  const seenNames = new Set<string>();
  const seenUrls = new Set<string>();

  knowledgeArrays.forEach((knowledge, idx) => {
    const priority = priorities[idx];

    // Extract ALL semantic knowledge - no filtering
    knowledge.definitions?.forEach((d: any) => {
      const key = d.term?.toLowerCase() || d.id;
      if (!seenTerms.has(key)) {
        seenTerms.add(key);
        (merged.definitions as any[]).push({ ...d, sourcePriority: priority });
      }
    });

    knowledge.concepts?.forEach((c: any) => {
      const key = c.name?.toLowerCase() || c.id;
      if (!seenNames.has(key)) {
        seenNames.add(key);
        (merged.concepts as any[]).push({ ...c, sourcePriority: priority });
      }
    });

    knowledge.procedures?.forEach((p: any) => {
      const key = p.name?.toLowerCase() || p.id;
      if (!seenNames.has(key)) {
        seenNames.add(key);
        (merged.procedures as any[]).push({ ...p, sourcePriority: priority });
      }
    });

    knowledge.examples?.forEach((e: any) => {
      const key = e.title?.toLowerCase() || e.id;
      if (!seenNames.has(key)) {
        seenNames.add(key);
        (merged.examples as any[]).push({ ...e, sourcePriority: priority });
      }
    });

    knowledge.comparisons?.forEach((c: any) => {
      const key = c.subject1?.toLowerCase() || c.id;
      if (!seenNames.has(key)) {
        seenNames.add(key);
        (merged.comparisons as any[]).push({ ...c, sourcePriority: priority });
      }
    });

    knowledge.commands?.forEach((cmd: any) => {
      const key = cmd.command?.toLowerCase() || cmd.id;
      if (!seenNames.has(key)) {
        seenNames.add(key);
        (merged.commands as any[]).push({ ...cmd, sourcePriority: priority });
      }
    });

    knowledge.warnings?.forEach((w: any) => {
      const key = w.title?.toLowerCase() || w.id;
      if (!seenNames.has(key)) {
        seenNames.add(key);
        (merged.warnings as any[]).push({ ...w, sourcePriority: priority });
      }
    });

    knowledge.bestPractices?.forEach((bp: any) => {
      const key = bp.title?.toLowerCase() || bp.id;
      if (!seenNames.has(key)) {
        seenNames.add(key);
        (merged.bestPractices as any[]).push({ ...bp, sourcePriority: priority });
      }
    });

    knowledge.faqs?.forEach((faq: any) => {
      const key = faq.question?.toLowerCase() || faq.id;
      if (!seenNames.has(key)) {
        seenNames.add(key);
        (merged.faqs as any[]).push({ ...faq, sourcePriority: priority });
      }
    });

    knowledge.references?.forEach((r: any) => {
      const key = r.url?.toLowerCase() || r.id;
      if (!seenUrls.has(key)) {
        seenUrls.add(key);
        (merged.references as any[]).push({ ...r, sourcePriority: priority });
      }
    });
  });

  return merged;
}

async function runPhase38RecipeAcquisition() {
  const timestamp = new Date().toISOString();
  console.log("Phase 38 - Subject Acquisition Recipes");
  console.log("=".repeat(60));
  console.log(`Timestamp: ${timestamp}\n`);

  const extractor = new HTMLDocumentationExtractor();
  const dataProcessor = new DataProcessor({
    minConfidence: 0.0,
    allowPlaceholders: false,
    requireMetadata: true,
  });
  const qualityMetricsCalculator = new QualityMetricsCalculator();

  // Define subject recipes
  const subjectRecipes: SubjectRecipe[] = [
    {
      subject: "Python Programming Fundamentals",
      sources: [
        {
          name: "Python Tutorial",
          url: "https://docs.python.org/3/tutorial/introduction.html",
          connector: new PythonDocumentationConnector(),
          extractor,
          priority: 1,
        },
        {
          name: "Python Language Reference",
          url: "https://docs.python.org/3/reference/index.html",
          connector: new PythonDocumentationConnector(),
          extractor,
          priority: 2,
        },
      ],
    },
    {
      subject: "Git Version Control",
      sources: [
        {
          name: "Git Book - Branching",
          url: "https://git-scm.com/book/en/v2/Git-Branching-Branching-Workflows",
          connector: new GitDocumentationConnector(),
          extractor,
          priority: 1,
        },
        {
          name: "Git Reference",
          url: "https://git-scm.com/docs",
          connector: new GitDocumentationConnector(),
          extractor,
          priority: 2,
        },
      ],
    },
    {
      subject: "JavaScript Fundamentals",
      sources: [
        {
          name: "MDN Guide - Closures",
          url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures",
          connector: new MDNConnector(),
          extractor,
          priority: 1,
        },
        {
          name: "MDN Reference",
          url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference",
          connector: new MDNConnector(),
          extractor,
          priority: 2,
        },
      ],
    },
  ];

  const results: RecipeExecutionResult[] = [];

  for (const recipe of subjectRecipes) {
    console.log(`Processing: ${recipe.subject}`);
    console.log(`Recipe Sources: ${recipe.sources.length}`);
    console.log("-".repeat(40));

    const result: RecipeExecutionResult = {
      subject: recipe.subject,
      sourcesExecuted: 0,
      sourcesFailed: 0,
      collectionsPopulated: [],
      missingCollections: [],
      coverageScore: 0,
      qualityScore: 0,
      completenessScore: 0,
      authorityScore: 0,
      freshnessScore: 0,
      validationPassed: false,
      recipeCompleteness: 0,
    };

    try {
      const knowledgeArrays: any[] = [];
      const priorities: number[] = [];
      let successCount = 0;

      // Execute recipe sources
      for (const source of recipe.sources) {
        console.log(`  Acquiring from: ${source.name} (priority: ${source.priority})`);

        const connectorResult = await source.connector.connect({
          sourceType: source.connector.sourceType as any,
          sourceUrl: source.url,
        });

        if (connectorResult.data) {
          const extractorResult = await source.extractor.extract(connectorResult.data, {
            sourceUrl: source.url,
          } as any);

          if (extractorResult.success && extractorResult.knowledge) {
            knowledgeArrays.push(extractorResult.knowledge);
            priorities.push(source.priority);
            successCount++;
            console.log(`    ✅ Success`);
          } else {
            console.log(`    ❌ Extraction failed: ${extractorResult.error}`);
            result.sourcesFailed++;
          }
        } else {
          console.log(`    ❌ Connection failed: ${connectorResult.error}`);
          result.sourcesFailed++;
        }
      }

      result.sourcesExecuted = successCount;
      result.recipeCompleteness = (successCount / recipe.sources.length) * 100;

      console.log(`  Sources executed: ${successCount}/${recipe.sources.length}`);
      console.log(`  Recipe completeness: ${result.recipeCompleteness.toFixed(0)}%`);

      if (knowledgeArrays.length === 0) {
        console.log(`  No knowledge acquired, skipping`);
        results.push(result);
        continue;
      }

      // Merge knowledge according to recipe (prioritized, no filtering)
      const mergedKnowledge = mergeKnowledge(knowledgeArrays, priorities);
      console.log(`  Knowledge merged from ${knowledgeArrays.length} sources`);

      // Create Knowledge Package
      const knowledgePackageId = `pkg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const slug = recipe.subject.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

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
        })),
        formulae: [],
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
        commonMistakes: [],
        faqs: mergedKnowledge.faqs.map((faq: any) => ({
          id: faq.id,
          question: faq.question,
          answer: faq.answer,
          category: faq.category,
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
            adapterName: "multi-source-recipe",
            adapterVersion: "1.0",
            sourceType: "recipe" as any,
            retrievedAt: new Date().toISOString(),
            processedAt: new Date().toISOString(),
            validationStatus: "valid" as const,
          },
        },
      };

      // Validation
      const validationResult = dataProcessor.processPackage(testPackage, []);
      result.validationPassed = validationResult.valid;

      // Quality metrics
      const qualityMetrics = qualityMetricsCalculator.calculateMetrics(testPackage);
      result.coverageScore = qualityMetrics.coverageScore;
      result.qualityScore = qualityMetrics.overallQualityScore;
      result.completenessScore = qualityMetrics.completenessScore;
      result.authorityScore = qualityMetrics.authorityScore;
      result.freshnessScore = qualityMetrics.freshnessScore;

      // Determine collections populated
      if (mergedKnowledge.definitions.length > 0) result.collectionsPopulated.push("definitions");
      if (mergedKnowledge.concepts.length > 0) result.collectionsPopulated.push("concepts");
      if (mergedKnowledge.procedures.length > 0) result.collectionsPopulated.push("procedures");
      if (mergedKnowledge.examples.length > 0) result.collectionsPopulated.push("examples");
      if (mergedKnowledge.commands.length > 0) result.collectionsPopulated.push("commands");
      if (mergedKnowledge.warnings.length > 0) result.collectionsPopulated.push("warnings");
      if (mergedKnowledge.bestPractices.length > 0) result.collectionsPopulated.push("bestPractices");
      if (mergedKnowledge.faqs.length > 0) result.collectionsPopulated.push("faqs");

      // Determine missing collections
      const allCollections = ["definitions", "concepts", "procedures", "examples", "commands", "warnings", "bestPractices", "faqs"];
      result.missingCollections = allCollections.filter(c => !result.collectionsPopulated.includes(c));

      console.log(`  Quality Score: ${result.qualityScore}/100`);
      console.log(`  Coverage Score: ${result.coverageScore}/100`);
      console.log(`  Collections Populated: ${result.collectionsPopulated.join(", ")}`);
      console.log(`  Missing Collections: ${result.missingCollections.join(", ") || "None"}`);
      console.log(`  Validation: ${result.validationPassed ? "✅ PASSED" : "❌ FAILED"}`);

    } catch (error: any) {
      console.log(`  ❌ Exception: ${error.message}`);
    }

    results.push(result);
    console.log();
  }

  // Summary
  console.log("=".repeat(60));
  console.log("SUBJECT RECIPE ACQUISITION SUMMARY");
  console.log("=".repeat(60));

  results.forEach(r => {
    console.log(`\n${r.subject}:`);
    console.log(`  Recipe Completeness: ${r.recipeCompleteness.toFixed(0)}%`);
    console.log(`  Sources Executed: ${r.sourcesExecuted}`);
    console.log(`  Sources Failed: ${r.sourcesFailed}`);
    console.log(`  Collections Populated: ${r.collectionsPopulated.join(", ")}`);
    console.log(`  Missing Collections: ${r.missingCollections.join(", ") || "None"}`);
    console.log(`  Coverage Score: ${r.coverageScore}/100`);
    console.log(`  Quality Score: ${r.qualityScore}/100`);
  });

  return results;
}

runPhase38RecipeAcquisition()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("Recipe acquisition failed:", error);
    process.exit(1);
  });
