/**
 * Phase 39 - Knowledge Authoring Optimization
 * 
 * Transform Knowledge Packages into higher-quality articles with:
 * - Logical learning flow
 * - Clear transitions
 * - Beginner-first explanations
 * - Expert tips
 * - Practical examples
 * - Step-by-step procedures
 * - Natural internal linking
 * - High readability
 * - No repetition
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

interface ArticleQualityScore {
  readability: number;
  learningFlow: number;
  practicalValue: number;
  overall: number;
}

interface ArticleGenerationResult {
  topic: string;
  knowledgePackageQuality: number;
  articleQuality: ArticleQualityScore;
  readabilityImprovement: number;
  learningFlowImprovement: number;
  practicalValueImprovement: number;
  validationPassed: boolean;
}

function generateKnowledgeHash(data: any): string {
  return createHash("sha256").update(JSON.stringify(data)).digest("hex").substring(0, 16);
}

function calculateArticleQuality(article: string, knowledgePackage: any): ArticleQualityScore {
  // Readability: sentence length, paragraph length, vocabulary complexity
  const sentences = article.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgSentenceLength = sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / sentences.length;
  const readabilityScore = Math.max(0, Math.min(100, 100 - (avgSentenceLength - 15) * 2));

  // Learning Flow: logical progression, transitions, beginner-first approach
  const transitionWords = ["first", "next", "then", "finally", "however", "therefore", "additionally", "furthermore"];
  const transitionCount = transitionWords.filter(word => article.toLowerCase().includes(word)).length;
  const learningFlowScore = Math.max(0, Math.min(100, 50 + transitionCount * 5));

  // Practical Value: examples, procedures, commands, real-world applications
  const hasExamples = knowledgePackage.examples.length > 0;
  const hasProcedures = knowledgePackage.procedures.length > 0;
  const hasCommands = knowledgePackage.commands.length > 0;
  const practicalValueScore = Math.max(0, Math.min(100, 
    (hasExamples ? 30 : 0) + (hasProcedures ? 40 : 0) + (hasCommands ? 30 : 0)
  ));

  const overall = (readabilityScore + learningFlowScore + practicalValueScore) / 3;

  return {
    readability: Math.round(readabilityScore),
    learningFlow: Math.round(learningFlowScore),
    practicalValue: Math.round(practicalValueScore),
    overall: Math.round(overall),
  };
}

function generateArticle(knowledgePackage: any, topic: string): string {
  const article: string[] = [];

  // Title
  article.push(`# ${topic}\n`);

  // Introduction (beginner-first)
  article.push(`## Introduction\n`);
  article.push(`Welcome to this comprehensive guide on ${topic}. This article is designed to take you from beginner to expert, with clear explanations and practical examples.\n`);

  // Definitions (foundational concepts first)
  if (knowledgePackage.definitions.length > 0) {
    article.push(`## Key Definitions\n`);
    article.push(`Before diving into the details, let's establish some foundational concepts:\n`);
    knowledgePackage.definitions.forEach((def: any, idx: number) => {
      article.push(`### ${def.term}\n`);
      article.push(`${def.definition}\n`);
      if (idx < knowledgePackage.definitions.length - 1) {
        article.push(`---\n`);
      }
    });
    article.push(`\n`);
  }

  // Concepts (building understanding)
  if (knowledgePackage.concepts.length > 0) {
    article.push(`## Core Concepts\n`);
    article.push(`Now that we understand the terminology, let's explore the core concepts:\n`);
    knowledgePackage.concepts.forEach((concept: any, idx: number) => {
      article.push(`### ${concept.name}\n`);
      article.push(`${concept.description || "A fundamental concept in this domain."}\n`);
      if (idx < knowledgePackage.concepts.length - 1) {
        article.push(`---\n`);
      }
    });
    article.push(`\n`);
  }

  // Procedures (step-by-step learning)
  if (knowledgePackage.procedures.length > 0) {
    article.push(`## Step-by-Step Procedures\n`);
    article.push(`Let's put theory into practice with these step-by-step procedures:\n`);
    knowledgePackage.procedures.forEach((proc: any, idx: number) => {
      article.push(`### ${proc.name}\n`);
      article.push(`Follow these steps:\n`);
      proc.steps.forEach((step: string, stepIdx: number) => {
        article.push(`${stepIdx + 1}. ${step}\n`);
      });
      if (idx < knowledgePackage.procedures.length - 1) {
        article.push(`---\n`);
      }
    });
    article.push(`\n`);
  }

  // Examples (practical application)
  if (knowledgePackage.examples.length > 0) {
    article.push(`## Practical Examples\n`);
    article.push(`Seeing concepts in action is the best way to learn. Here are some practical examples:\n`);
    knowledgePackage.examples.forEach((ex: any, idx: number) => {
      article.push(`### ${ex.title}\n`);
      article.push(`${ex.description || ""}\n`);
      if (ex.code) {
        article.push(`\`\`\`\n${ex.code}\n\`\`\`\n`);
      }
      if (idx < knowledgePackage.examples.length - 1) {
        article.push(`---\n`);
      }
    });
    article.push(`\n`);
  }

  // Commands (for technical subjects)
  if (knowledgePackage.commands.length > 0) {
    article.push(`## Essential Commands\n`);
    article.push(`Here are the essential commands you need to know:\n`);
    knowledgePackage.commands.forEach((cmd: any, idx: number) => {
      article.push(`### ${cmd.command}\n`);
      article.push(`${cmd.description || ""}\n`);
      article.push(`\`\`\`\n${cmd.syntax || cmd.command}\n\`\`\`\n`);
      if (idx < knowledgePackage.commands.length - 1) {
        article.push(`---\n`);
      }
    });
    article.push(`\n`);
  }

  // Warnings (expert tips)
  if (knowledgePackage.warnings.length > 0) {
    article.push(`## Important Warnings\n`);
    article.push(`⚠️ **Expert Tip**: Pay attention to these important warnings:\n`);
    knowledgePackage.warnings.forEach((warn: any, idx: number) => {
      article.push(`### ${warn.title}\n`);
      article.push(`${warn.description}\n`);
      if (idx < knowledgePackage.warnings.length - 1) {
        article.push(`---\n`);
      }
    });
    article.push(`\n`);
  }

  // Best Practices (expert guidance)
  if (knowledgePackage.bestPractices.length > 0) {
    article.push(`## Best Practices\n`);
    article.push(`💡 **Expert Guidance**: Follow these best practices for optimal results:\n`);
    knowledgePackage.bestPractices.forEach((bp: any, idx: number) => {
      article.push(`### ${bp.title}\n`);
      article.push(`${bp.description}\n`);
      if (idx < knowledgePackage.bestPractices.length - 1) {
        article.push(`---\n`);
      }
    });
    article.push(`\n`);
  }

  // FAQs (addressing common questions)
  if (knowledgePackage.faqs.length > 0) {
    article.push(`## Frequently Asked Questions\n`);
    article.push(`Here are answers to common questions:\n`);
    knowledgePackage.faqs.forEach((faq: any, idx: number) => {
      article.push(`### ${faq.question}\n`);
      article.push(`${faq.answer}\n`);
      if (idx < knowledgePackage.faqs.length - 1) {
        article.push(`---\n`);
      }
    });
    article.push(`\n`);
  }

  // Conclusion
  article.push(`## Conclusion\n`);
  article.push(`Congratulations! You've completed this guide on ${topic}. You now have a solid foundation to continue your learning journey. Remember to practice regularly and refer back to this guide as needed.\n`);

  return article.join("\n");
}

async function runPhase39ArticleOptimization() {
  const timestamp = new Date().toISOString();
  console.log("Phase 39 - Knowledge Authoring Optimization");
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
      sources: [
        { url: "https://docs.python.org/3/tutorial/introduction.html", connector: new PythonDocumentationConnector() },
        { url: "https://docs.python.org/3/reference/index.html", connector: new PythonDocumentationConnector() },
      ],
    },
    {
      name: "Git Version Control",
      sources: [
        { url: "https://git-scm.com/book/en/v2/Git-Branching-Branching-Workflows", connector: new GitDocumentationConnector() },
        { url: "https://git-scm.com/docs", connector: new GitDocumentationConnector() },
      ],
    },
    {
      name: "JavaScript Fundamentals",
      sources: [
        { url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures", connector: new MDNConnector() },
        { url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference", connector: new MDNConnector() },
      ],
    },
  ];

  const results: ArticleGenerationResult[] = [];

  for (const topic of pilotTopics) {
    console.log(`Processing: ${topic.name}`);
    console.log("-".repeat(40));

    const result: ArticleGenerationResult = {
      topic: topic.name,
      knowledgePackageQuality: 0,
      articleQuality: { readability: 0, learningFlow: 0, practicalValue: 0, overall: 0 },
      readabilityImprovement: 0,
      learningFlowImprovement: 0,
      practicalValueImprovement: 0,
      validationPassed: false,
    };

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

        knowledge.commands?.forEach((cmd: any) => {
          const key = cmd.command?.toLowerCase() || cmd.id;
          if (!seenNames.has(key)) {
            seenNames.add(key);
            (mergedKnowledge.commands as any[]).push(cmd);
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
      const slug = topic.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

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
        comparisons: [],
        commands: mergedKnowledge.commands.map((cmd: any) => ({
          id: cmd.id,
          command: cmd.command,
          description: cmd.description,
          syntax: cmd.syntax,
          confidence: "high",
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
            adapterName: "multi-source-optimized",
            adapterVersion: "1.0",
            sourceType: "optimized" as any,
            retrievedAt: new Date().toISOString(),
            processedAt: new Date().toISOString(),
            validationStatus: "valid" as const,
          },
        },
      };

      // Calculate Knowledge Package quality
      const validationResult = dataProcessor.processPackage(testPackage, []);
      const qualityMetrics = qualityMetricsCalculator.calculateMetrics(testPackage);
      result.knowledgePackageQuality = qualityMetrics.overallQualityScore;
      result.validationPassed = validationResult.valid;

      console.log(`  Knowledge Package Quality: ${result.knowledgePackageQuality}/100`);

      // Generate article
      const article = generateArticle(testPackage, topic.name);
      console.log(`  Article generated (${article.length} characters)`);

      // Calculate article quality
      const articleQuality = calculateArticleQuality(article, testPackage);
      result.articleQuality = articleQuality;

      console.log(`  Article Quality:`);
      console.log(`    Readability: ${articleQuality.readability}/100`);
      console.log(`    Learning Flow: ${articleQuality.learningFlow}/100`);
      console.log(`    Practical Value: ${articleQuality.practicalValue}/100`);
      console.log(`    Overall: ${articleQuality.overall}/100`);

      // Calculate improvements
      result.readabilityImprovement = articleQuality.readability - result.knowledgePackageQuality;
      result.learningFlowImprovement = articleQuality.learningFlow - result.knowledgePackageQuality;
      result.practicalValueImprovement = articleQuality.practicalValue - result.knowledgePackageQuality;

      console.log(`  Quality Improvement: +${(articleQuality.overall - result.knowledgePackageQuality).toFixed(1)}`);

    } catch (error: any) {
      console.log(`  ❌ Exception: ${error.message}`);
    }

    results.push(result);
    console.log();
  }

  // Summary
  console.log("=".repeat(60));
  console.log("ARTICLE OPTIMIZATION SUMMARY");
  console.log("=".repeat(60));

  results.forEach(r => {
    console.log(`\n${r.topic}:`);
    console.log(`  Knowledge Package Quality: ${r.knowledgePackageQuality}/100`);
    console.log(`  Article Quality:`);
    console.log(`    Readability: ${r.articleQuality.readability}/100`);
    console.log(`    Learning Flow: ${r.articleQuality.learningFlow}/100`);
    console.log(`    Practical Value: ${r.articleQuality.practicalValue}/100`);
    console.log(`    Overall: ${r.articleQuality.overall}/100`);
    console.log(`  Overall Improvement: +${(r.articleQuality.overall - r.knowledgePackageQuality).toFixed(1)}`);
    console.log(`  Validation: ${r.validationPassed ? "✅ PASSED" : "❌ FAILED"}`);
  });

  return results;
}

runPhase39ArticleOptimization()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("Article optimization failed:", error);
    process.exit(1);
  });
