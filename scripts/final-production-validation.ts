/**
 * Final Production Validation - Knowledge Authoring Engine
 * 
 * Validates on 5 real production topics:
 * 1. Python Programming Fundamentals
 * 2. Investing Basics
 * 3. Nutrition Fundamentals
 * 4. Travel Planning Fundamentals
 * 5. Marketing Fundamentals
 * 
 * Pipeline for each topic:
 * 1. Build Knowledge Package (facts)
 * 2. Execute Knowledge Authoring Engine
 * 3. Generate HTML
 * 4. Store rendered output
 * 5. Verify results
 */

import { KnowledgeAuthoringOrchestrator, type AuthoringContext } from "../services/renderer/authoring/knowledgeAuthoringOrchestrator";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

interface TopicValidation {
  topic: string;
  category: string;
  intent: "inform" | "educate" | "guide" | "decide";
  complexity: "beginner" | "intermediate" | "advanced";
  facts: Array<{
    id: string;
    statement: string;
    factType: string;
    confidence: number;
    scope: string;
    tags: string[];
    domain: string;
  }>;
}

interface ValidationResult {
  topic: string;
  coldStart: number;
  executionTime: number;
  authoringComplete: boolean;
  qualityScore: number;
  recommendation: string;
  sections: number;
  htmlGenerated: boolean;
  htmlPath: string;
  success: boolean;
  error?: string;
}

const topics: TopicValidation[] = [
  {
    topic: "Python Programming Fundamentals",
    category: "education",
    intent: "educate",
    complexity: "beginner",
    facts: [
      {
        id: "python-1",
        statement: "Python is a high-level, interpreted programming language known for its readability and simplicity.",
        factType: "definition",
        confidence: 0.95,
        scope: "general",
        tags: ["python", "definition"],
        domain: "technology",
      },
      {
        id: "python-2",
        statement: "Python was created by Guido van Rossum and first released in 1991.",
        factType: "historical",
        confidence: 0.98,
        scope: "general",
        tags: ["python", "history"],
        domain: "technology",
      },
      {
        id: "python-3",
        statement: "Python uses indentation to define code blocks instead of curly braces.",
        factType: "procedural",
        confidence: 0.99,
        scope: "general",
        tags: ["python", "syntax"],
        domain: "technology",
      },
      {
        id: "python-4",
        statement: "Python supports multiple programming paradigms including procedural, object-oriented, and functional programming.",
        factType: "property",
        confidence: 0.95,
        scope: "general",
        tags: ["python", "paradigms"],
        domain: "technology",
      },
      {
        id: "python-5",
        statement: "Python has a large standard library and extensive third-party package ecosystem (PyPI).",
        factType: "property",
        confidence: 0.97,
        scope: "general",
        tags: ["python", "ecosystem"],
        domain: "technology",
      },
    ],
  },
  {
    topic: "Investing Basics",
    category: "finance",
    intent: "educate",
    complexity: "beginner",
    facts: [
      {
        id: "invest-1",
        statement: "Investing is the act of allocating money or resources with the expectation of generating income or profit.",
        factType: "definition",
        confidence: 0.95,
        scope: "general",
        tags: ["investing", "definition"],
        domain: "finance",
      },
      {
        id: "invest-2",
        statement: "The primary difference between saving and investing is the level of risk and potential return.",
        factType: "comparison",
        confidence: 0.92,
        scope: "general",
        tags: ["investing", "saving"],
        domain: "finance",
      },
      {
        id: "invest-3",
        statement: "Diversification is a risk management strategy that spreads investments across different asset classes.",
        factType: "property",
        confidence: 0.97,
        scope: "general",
        tags: ["investing", "diversification"],
        domain: "finance",
      },
      {
        id: "invest-4",
        statement: "Compound interest allows investments to grow exponentially over time by earning interest on interest.",
        factType: "property",
        confidence: 0.99,
        scope: "general",
        tags: ["investing", "compound-interest"],
        domain: "finance",
      },
      {
        id: "invest-5",
        statement: "Time horizon is the length of time an investor expects to hold an investment before needing the money.",
        factType: "property",
        confidence: 0.94,
        scope: "general",
        tags: ["investing", "time-horizon"],
        domain: "finance",
      },
    ],
  },
  {
    topic: "Nutrition Fundamentals",
    category: "health",
    intent: "educate",
    complexity: "beginner",
    facts: [
      {
        id: "nutrition-1",
        statement: "Nutrition is the science of how food affects the body and provides nutrients for health.",
        factType: "definition",
        confidence: 0.96,
        scope: "general",
        tags: ["nutrition", "definition"],
        domain: "health",
      },
      {
        id: "nutrition-2",
        statement: "Macronutrients include carbohydrates, proteins, and fats, which provide energy in calories.",
        factType: "property",
        confidence: 0.99,
        scope: "general",
        tags: ["nutrition", "macronutrients"],
        domain: "health",
      },
      {
        id: "nutrition-3",
        statement: "Micronutrients include vitamins and minerals, which are needed in smaller amounts for proper bodily functions.",
        factType: "property",
        confidence: 0.97,
        scope: "general",
        tags: ["nutrition", "micronutrients"],
        domain: "health",
      },
      {
        id: "nutrition-4",
        statement: "Water is essential for life and makes up about 60% of human body weight.",
        factType: "property",
        confidence: 0.98,
        scope: "general",
        tags: ["nutrition", "hydration"],
        domain: "health",
      },
      {
        id: "nutrition-5",
        statement: "Balanced nutrition involves consuming appropriate amounts of all food groups for optimal health.",
        factType: "property",
        confidence: 0.95,
        scope: "general",
        tags: ["nutrition", "balance"],
        domain: "health",
      },
    ],
  },
  {
    topic: "Travel Planning Fundamentals",
    category: "travel",
    intent: "guide",
    complexity: "beginner",
    facts: [
      {
        id: "travel-1",
        statement: "Research your destination thoroughly before booking. Check visa requirements, local customs, and seasonal weather patterns.",
        factType: "procedural",
        confidence: 0.97,
        scope: "general",
        tags: ["travel", "research"],
        domain: "travel",
      },
      {
        id: "travel-2",
        statement: "Set a realistic budget including flights, accommodation, food, activities, and emergency funds. Track expenses during planning.",
        factType: "procedural",
        confidence: 0.98,
        scope: "general",
        tags: ["travel", "budget"],
        domain: "travel",
      },
      {
        id: "travel-3",
        statement: "Book flights and accommodation early for better prices. Compare multiple booking sites and read recent reviews.",
        factType: "procedural",
        confidence: 0.96,
        scope: "general",
        tags: ["travel", "booking"],
        domain: "travel",
      },
      {
        id: "travel-4",
        statement: "Purchase travel insurance covering medical emergencies, trip cancellation, and lost luggage. Read policy details carefully.",
        factType: "procedural",
        confidence: 0.99,
        scope: "general",
        tags: ["travel", "insurance"],
        domain: "travel",
      },
      {
        id: "travel-5",
        statement: "Pack essential documents (passport, tickets, insurance), appropriate clothing for weather, medications, and chargers. Leave copies of documents at home.",
        factType: "procedural",
        confidence: 0.98,
        scope: "general",
        tags: ["travel", "packing"],
        domain: "travel",
      },
    ],
  },
  {
    topic: "Marketing Fundamentals",
    category: "business",
    intent: "educate",
    complexity: "beginner",
    facts: [
      {
        id: "marketing-1",
        statement: "Marketing is the process of creating, communicating, and delivering value to customers.",
        factType: "definition",
        confidence: 0.95,
        scope: "general",
        tags: ["marketing", "definition"],
        domain: "business",
      },
      {
        id: "marketing-2",
        statement: "The 4 Ps of marketing are Product, Price, Place, and Promotion.",
        factType: "property",
        confidence: 0.99,
        scope: "general",
        tags: ["marketing", "4ps"],
        domain: "business",
      },
      {
        id: "marketing-3",
        statement: "Target market is the specific group of customers a business aims to reach with its marketing efforts.",
        factType: "property",
        confidence: 0.97,
        scope: "general",
        tags: ["marketing", "target-market"],
        domain: "business",
      },
      {
        id: "marketing-4",
        statement: "Brand positioning is how a company differentiates itself from competitors in customers' minds.",
        factType: "property",
        confidence: 0.94,
        scope: "general",
        tags: ["marketing", "branding"],
        domain: "business",
      },
      {
        id: "marketing-5",
        statement: "Digital marketing includes online channels like social media, email, search engines, and websites.",
        factType: "property",
        confidence: 0.98,
        scope: "general",
        tags: ["marketing", "digital"],
        domain: "business",
      },
    ],
  },
];

function generateHTML(result: any, topic: string): string {
  const sectionsHTML = result.document.sections
    .map((section: any) => `
      <section>
        <h2>${section.heading}</h2>
        <div class="content">${section.content}</div>
      </section>
    `)
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${topic} - Knowledge Authoring Engine</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      line-height: 1.6;
      color: #333;
    }
    h1 {
      color: #2563eb;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 0.5rem;
    }
    h2 {
      color: #1e40af;
      margin-top: 2rem;
    }
    .introduction {
      background: #f3f4f6;
      padding: 1.5rem;
      border-radius: 8px;
      margin-bottom: 2rem;
    }
    .content {
      white-space: pre-wrap;
    }
    .conclusion {
      background: #dbeafe;
      padding: 1.5rem;
      border-radius: 8px;
      margin-top: 2rem;
    }
    .metadata {
      background: #fef3c7;
      padding: 1rem;
      border-radius: 8px;
      margin-top: 2rem;
      font-size: 0.9rem;
    }
  </style>
</head>
<body>
  <h1>${topic}</h1>
  
  <div class="introduction">
    <h2>Introduction</h2>
    <div class="content">${result.document.introduction}</div>
  </div>

  ${sectionsHTML}

  <div class="conclusion">
    <h2>Conclusion</h2>
    <div class="content">${result.document.conclusion}</div>
  </div>

  <div class="metadata">
    <h3>Article Metadata</h3>
    <p><strong>Quality Score:</strong> ${result.editorialResult.qualityScore}/100</p>
    <p><strong>Passes Editorial:</strong> ${result.editorialResult.passesEditorial}</p>
    <p><strong>Acceptance Test:</strong> ${result.acceptanceTest.allPassed ? "Passed" : "Failed"}</p>
    <p><strong>Confidence:</strong> ${result.acceptanceTest.overallConfidence}/100</p>
    <p><strong>Recommendation:</strong> ${result.acceptanceTest.recommendation}</p>
    <p><strong>Sections:</strong> ${result.document.sections.length}</p>
    <p><strong>Generated by:</strong> Knowledge Authoring Engine v1.0.0</p>
  </div>
</body>
</html>`;
}

async function validateTopic(topic: TopicValidation): Promise<ValidationResult> {
  console.log(`\n${"=".repeat(70)}`);
  console.log(`VALIDATING: ${topic.topic}`);
  console.log(`Category: ${topic.category}`);
  console.log(`Intent: ${topic.intent}`);
  console.log(`Complexity: ${topic.complexity}`);
  console.log(`${"=".repeat(70)}\n`);

  const startTime = performance.now();

  try {
    // Step 1: Cold start - Instantiate orchestrator
    const orchestrator = new KnowledgeAuthoringOrchestrator();
    const coldStart = performance.now() - startTime;

    console.log(`[Step 1] Cold Start: ${coldStart.toFixed(2)}ms`);
    console.log(`[Step 2] Knowledge Package: ${topic.facts.length} facts`);

    // Step 2: Execute Knowledge Authoring Engine
    const context: AuthoringContext = {
      topic: topic.topic,
      category: topic.category,
      intent: topic.intent,
      complexity: topic.complexity,
      facts: topic.facts.map(f => ({
        id: f.id,
        statement: f.statement,
        factType: f.factType,
        confidence: String(f.confidence),
        scope: f.scope,
        tags: f.tags,
        domain: f.domain,
      })),
    };

    const result = await orchestrator.authorDocument(context);
    const executionTime = performance.now() - startTime;

    console.log(`[Step 3] Authoring Complete: ${result.passesAllChecks}`);
    console.log(`[Step 4] Quality Score: ${result.editorialResult.qualityScore}/100`);
    console.log(`[Step 5] Acceptance Test: ${result.acceptanceTest.allPassed ? "PASSED" : "FAILED"}`);
    console.log(`[Step 6] Sections Generated: ${result.document.sections.length}`);
    console.log(`[Step 7] Execution Time: ${executionTime.toFixed(2)}ms`);

    // Step 3: Generate HTML
    const html = generateHTML(result, topic.topic);
    
    // Step 4: Store rendered output
    const outputDir = join(process.cwd(), "output", "production-validation");
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    const safeTopicName = topic.topic.toLowerCase().replace(/\s+/g, "-");
    const htmlPath = join(outputDir, `${safeTopicName}.html`);
    writeFileSync(htmlPath, html);

    console.log(`[Step 8] HTML Generated: ✓`);
    console.log(`[Step 9] Stored to: ${htmlPath}`);

    // Step 5: Verify results
    // Production pipeline success = quality >= 80 AND HTML generated AND stored
    const success = result.editorialResult.qualityScore >= 80;

    console.log(`\n[VERIFICATION]`);
    console.log(`  Cold Start: ${coldStart.toFixed(2)}ms ${coldStart < 3000 ? "✓ PASS" : "✗ FAIL"}`);
    console.log(`  Execution: ${executionTime.toFixed(2)}ms ${executionTime < 5000 ? "✓ PASS" : "✗ FAIL"}`);
    console.log(`  Quality: ${result.editorialResult.qualityScore}/100 ${result.editorialResult.qualityScore >= 80 ? "✓ PASS" : "✗ FAIL"}`);
    console.log(`  Acceptance: ${result.acceptanceTest.allPassed ? "✓ PASS" : "✗ FAIL"}`);
    console.log(`  Overall: ${success ? "✓ PASS" : "✗ FAIL"}`);

    return {
      topic: topic.topic,
      coldStart,
      executionTime,
      authoringComplete: result.passesAllChecks,
      qualityScore: result.editorialResult.qualityScore,
      recommendation: result.acceptanceTest.recommendation,
      sections: result.document.sections.length,
      htmlGenerated: true,
      htmlPath,
      success,
    };

  } catch (error) {
    const errorTime = performance.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[ERROR] ${errorMessage}`);

    return {
      topic: topic.topic,
      coldStart: errorTime,
      executionTime: 0,
      authoringComplete: false,
      qualityScore: 0,
      recommendation: "reject",
      sections: 0,
      htmlGenerated: false,
      htmlPath: "",
      success: false,
      error: errorMessage,
    };
  }
}

async function main() {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║  KNOWLEDGE AUTHORING ENGINE - FINAL PRODUCTION VALIDATION ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  const results: ValidationResult[] = [];

  for (const topic of topics) {
    const result = await validateTopic(topic);
    results.push(result);
  }

  console.log(`\n${"=".repeat(70)}`);
  console.log("FINAL VALIDATION SUMMARY");
  console.log(`${"=".repeat(70)}\n`);

  let passed = 0;
  let failed = 0;

  for (const result of results) {
    const status = result.success ? "✓ PASS" : "✗ FAIL";
    console.log(`${result.topic}: ${status}`);
    console.log(`  Cold Start: ${result.coldStart.toFixed(2)}ms`);
    console.log(`  Execution: ${result.executionTime.toFixed(2)}ms`);
    console.log(`  Quality: ${result.qualityScore}/100`);
    console.log(`  HTML: ${result.htmlGenerated ? "✓" : "✗"}`);
    console.log(`  Path: ${result.htmlPath}`);
    console.log("");

    if (result.success) passed++;
    else failed++;
  }

  console.log(`${"=".repeat(70)}`);
  console.log(`TOTAL: ${results.length} topics`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log(`SUCCESS RATE: ${((passed / results.length) * 100).toFixed(1)}%`);
  console.log(`${"=".repeat(70)}`);

  const allPassed = passed === results.length;
  process.exit(allPassed ? 0 : 1);
}

main();
