/**
 * Sprint 2 - Subject-Specific Completeness Profiles
 * 
 * Replace global completeness requirements with subject-specific completeness profiles.
 * A package is COMPLETE when all required collections for that subject are present.
 * Optional collections increase quality but must not block publication.
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

// Subject-specific completeness profiles
interface SubjectCompletenessProfile {
  requiredCollections: string[];
  optionalCollections: string[];
}

const SUBJECT_COMPLETENESS_PROFILES: Record<string, SubjectCompletenessProfile> = {
  "python-programming-fundamentals": {
    requiredCollections: [
      "definitions",
      "concepts",
      "procedures",
      "examples",
      "references",
    ],
    optionalCollections: [
      "commands",
      "warnings",
      "faqs",
      "bestPractices",
      "commonMistakes",
    ],
  },
  "git-version-control": {
    requiredCollections: [
      "definitions",
      "concepts",
      "procedures",
      "commands",
      "examples",
      "references",
    ],
    optionalCollections: [
      "warnings",
      "faqs",
      "bestPractices",
      "commonMistakes",
    ],
  },
  "javascript-fundamentals": {
    requiredCollections: [
      "definitions",
      "concepts",
      "examples",
      "procedures",
      "references",
    ],
    optionalCollections: [
      "commands",
      "warnings",
      "bestPractices",
      "commonMistakes",
    ],
  },
};

interface CompletenessValidationResult {
  topic: string;
  subjectType: string;
  requiredCollections: string[];
  presentCollections: string[];
  missingCollections: string[];
  completenessPercentage: number;
  isComplete: boolean;
  packageStatus: "COMPLETE" | "INCOMPLETE_PACKAGE";
  acquisitionFeedback: string[];
}

function generateKnowledgeHash(data: any): string {
  return createHash("sha256").update(JSON.stringify(data)).digest("hex").substring(0, 16);
}

function validateCompleteness(knowledgePackage: any, subjectSlug: string): CompletenessValidationResult {
  const profile = SUBJECT_COMPLETENESS_PROFILES[subjectSlug] || {
    requiredCollections: ["definitions", "concepts", "procedures", "examples", "references"],
    optionalCollections: [],
  };
  
  const presentCollections: string[] = [];
  const missingCollections: string[] = [];
  const acquisitionFeedback: string[] = [];

  // Check which required collections are present
  profile.requiredCollections.forEach(collection => {
    const collectionData = knowledgePackage[collection];
    if (collectionData && Array.isArray(collectionData) && collectionData.length > 0) {
      presentCollections.push(collection);
    } else {
      missingCollections.push(collection);
      acquisitionFeedback.push(`Acquire ${collection} for ${knowledgePackage.slug || "this topic"}`);
    }
  });

  // Calculate completeness percentage based on required collections only
  const completenessPercentage = Math.round(
    (presentCollections.length / profile.requiredCollections.length) * 100
  );

  const isComplete = missingCollections.length === 0;
  const packageStatus = isComplete ? "COMPLETE" : "INCOMPLETE_PACKAGE";

  return {
    topic: knowledgePackage.slug || "unknown",
    subjectType: "programming", // Default to programming for pilot subjects
    requiredCollections: profile.requiredCollections,
    presentCollections,
    missingCollections,
    completenessPercentage,
    isComplete,
    packageStatus,
    acquisitionFeedback,
  };
}

async function runPhase40CompletenessValidation() {
  const timestamp = new Date().toISOString();
  console.log("Phase 40 - Knowledge Package Completeness Validation");
  console.log("=".repeat(60));
  console.log(`Timestamp: ${timestamp}\n`);

  const extractor = new HTMLDocumentationExtractor();
  const dataProcessor = new DataProcessor({
    minConfidence: 0.0,
    allowPlaceholders: false,
    requireMetadata: true,
  });
  const qualityMetricsCalculator = new QualityMetricsCalculator();

  const pilotTopics = [
    {
      name: "Python Programming Fundamentals",
      slug: "python-programming-fundamentals",
      sources: [
        { url: "https://docs.python.org/3/tutorial/introduction.html", connector: new PythonDocumentationConnector() },
        { url: "https://docs.python.org/3/reference/index.html", connector: new PythonDocumentationConnector() },
      ],
    },
    {
      name: "Git Version Control",
      slug: "git-version-control",
      sources: [
        { url: "https://git-scm.com/book/en/v2/Git-Branching-Branching-Workflows", connector: new GitDocumentationConnector() },
        { url: "https://git-scm.com/docs", connector: new GitDocumentationConnector() },
      ],
    },
    {
      name: "JavaScript Fundamentals",
      slug: "javascript-fundamentals",
      sources: [
        { url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures", connector: new MDNConnector() },
        { url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference", connector: new MDNConnector() },
      ],
    },
  ];

  const validationResults: CompletenessValidationResult[] = [];

  for (const topic of pilotTopics) {
    console.log(`Processing: ${topic.name}`);
    console.log(`Subject Slug: ${topic.slug}`);
    console.log("-".repeat(40));

    try {
      // Acquire knowledge from sources
      const knowledgeArrays: any[] = [];
      for (const source of topic.sources) {
        const connectorResult = await source.connector.connect({
          sourceType: source.connector.sourceType as any,
          sourceUrl: source.url,
        });

        if (connectorResult.data) {
          const extractorResult = await extractor.extract(connectorResult.data, {
            sourceUrl: source.url,
          } as any);

          if (extractorResult.success && extractorResult.knowledge) {
            knowledgeArrays.push(extractorResult.knowledge);
          }
        }
      }

      // Merge knowledge
      const mergedKnowledge = {
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
            (mergedKnowledge.definitions as any[]).push(d);
          }
        });

        knowledge.concepts?.forEach((c: any) => {
          const key = c.name?.toLowerCase() || c.id;
          if (!seenNames.has(key)) {
            seenNames.add(key);
            (mergedKnowledge.concepts as any[]).push(c);
          }
        });

        knowledge.procedures?.forEach((p: any) => {
          const key = p.name?.toLowerCase() || p.id;
          if (!seenNames.has(key)) {
            seenNames.add(key);
            (mergedKnowledge.procedures as any[]).push(p);
          }
        });

        knowledge.examples?.forEach((e: any) => {
          const key = e.title?.toLowerCase() || e.id;
          if (!seenNames.has(key)) {
            seenNames.add(key);
            (mergedKnowledge.examples as any[]).push(e);
          }
        });

        knowledge.comparisons?.forEach((c: any) => {
          const key = c.subject1?.toLowerCase() || c.id;
          if (!seenNames.has(key)) {
            seenNames.add(key);
            (mergedKnowledge.comparisons as any[]).push(c);
          }
        });

        knowledge.commands?.forEach((cmd: any) => {
          const key = cmd.command?.toLowerCase() || cmd.id;
          if (!seenNames.has(key)) {
            seenNames.add(key);
            (mergedKnowledge.commands as any[]).push(cmd);
          }
        });

        knowledge.formulae?.forEach((f: any) => {
          const key = f.name?.toLowerCase() || f.id;
          if (!seenNames.has(key)) {
            seenNames.add(key);
            (mergedKnowledge.formulae as any[]).push(f);
          }
        });

        knowledge.warnings?.forEach((w: any) => {
          const key = w.title?.toLowerCase() || w.id;
          if (!seenNames.has(key)) {
            seenNames.add(key);
            (mergedKnowledge.warnings as any[]).push(w);
          }
        });

        knowledge.bestPractices?.forEach((bp: any) => {
          const key = bp.title?.toLowerCase() || bp.id;
          if (!seenNames.has(key)) {
            seenNames.add(key);
            (mergedKnowledge.bestPractices as any[]).push(bp);
          }
        });

        knowledge.commonMistakes?.forEach((cm: any) => {
          const key = cm.mistake?.toLowerCase() || cm.id;
          if (!seenNames.has(key)) {
            seenNames.add(key);
            (mergedKnowledge.commonMistakes as any[]).push(cm);
          }
        });

        knowledge.faqs?.forEach((faq: any) => {
          const key = faq.question?.toLowerCase() || faq.id;
          if (!seenNames.has(key)) {
            seenNames.add(key);
            (mergedKnowledge.faqs as any[]).push(faq);
          }
        });

        knowledge.references?.forEach((r: any) => {
          const key = r.url?.toLowerCase() || r.id;
          if (!seenUrls.has(key)) {
            seenUrls.add(key);
            (mergedKnowledge.references as any[]).push(r);
          }
        });
      });

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
          relatedDefinitions: e.relatedDefinitions || [],
          relatedConcepts: e.relatedConcepts || [],
          relatedProcedures: e.relatedProcedures || [],
          references: e.references || [],
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
            adapterName: "multi-source-completeness",
            adapterVersion: "1.0",
            sourceType: "completeness" as any,
            retrievedAt: new Date().toISOString(),
            processedAt: new Date().toISOString(),
            validationStatus: "valid" as const,
          },
        },
      };

      // Validate completeness using subject-specific profile
      const validationResult = validateCompleteness(testPackage, topic.slug);
      validationResult.topic = topic.name;
      validationResults.push(validationResult);

      console.log(`  Required Collections: ${validationResult.requiredCollections.length}`);
      console.log(`  Present Collections: ${validationResult.presentCollections.length}`);
      console.log(`  Missing Collections: ${validationResult.missingCollections.join(", ") || "None"}`);
      console.log(`  Completeness: ${validationResult.completenessPercentage}%`);
      console.log(`  Status: ${validationResult.packageStatus}`);

      if (validationResult.acquisitionFeedback.length > 0) {
        console.log(`  Acquisition Feedback:`);
        validationResult.acquisitionFeedback.forEach(feedback => {
          console.log(`    - ${feedback}`);
        });
      }

    } catch (error: any) {
      console.log(`  ❌ Exception: ${error.message}`);
    }

    console.log();
  }

  // Summary
  console.log("=".repeat(60));
  console.log("KNOWLEDGE PACKAGE COMPLETENESS SUMMARY");
  console.log("=".repeat(60));

  validationResults.forEach(r => {
    console.log(`\n${r.topic}:`);
    console.log(`  Subject Type: ${r.subjectType}`);
    console.log(`  Required Collections: ${r.requiredCollections.join(", ")}`);
    console.log(`  Present Collections: ${r.presentCollections.join(", ")}`);
    console.log(`  Missing Collections: ${r.missingCollections.join(", ") || "None"}`);
    console.log(`  Completeness: ${r.completenessPercentage}%`);
    console.log(`  Status: ${r.packageStatus}`);
  });

  return validationResults;
}

runPhase40CompletenessValidation()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("Completeness validation failed:", error);
    process.exit(1);
  });
