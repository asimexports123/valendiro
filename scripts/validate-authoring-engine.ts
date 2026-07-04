/**
 * Validate Knowledge Authoring Engine with Mock Data
 *
 * Tests the engine without requiring database access.
 */

import { KnowledgeAuthoringOrchestrator, type AuthoringContext } from "../services/renderer/authoring/knowledgeAuthoringOrchestrator";

const MOCK_FACTS = [
  {
    id: "1",
    statement: "Python is a high-level, interpreted programming language known for its readability and simplicity.",
    factType: "definition",
    confidence: "high",
    scope: "general",
    tags: ["programming", "language"],
    domain: "technology",
  },
  {
    id: "2",
    statement: "Python supports multiple programming paradigms including procedural, object-oriented, and functional programming.",
    factType: "property",
    confidence: "high",
    scope: "general",
    tags: ["paradigms"],
    domain: "technology",
  },
  {
    id: "3",
    statement: "Python is widely used for web development, data science, machine learning, automation, and scientific computing.",
    factType: "property",
    confidence: "high",
    scope: "general",
    tags: ["applications"],
    domain: "technology",
  },
  {
    id: "4",
    statement: "The Python interpreter reads and executes code line by line, making it easy to test and debug.",
    factType: "procedural",
    confidence: "high",
    scope: "general",
    tags: ["execution"],
    domain: "technology",
  },
  {
    id: "5",
    statement: "Python uses indentation to define code blocks instead of braces or keywords.",
    factType: "property",
    confidence: "high",
    scope: "general",
    tags: ["syntax"],
    domain: "technology",
  },
];

async function validateEngine() {
  console.log("=== Knowledge Authoring Engine Validation ===\n");

  const orchestrator = new KnowledgeAuthoringOrchestrator();

  const context: AuthoringContext = {
    topic: "python-programming-fundamentals",
    category: "technology",
    intent: "educate",
    complexity: "intermediate",
    facts: MOCK_FACTS,
  };

  try {
    console.log("Running Knowledge Authoring Engine...\n");
    const result = await orchestrator.authorDocument(context);

    console.log("✓ Engine completed successfully\n");
    console.log("--- Results ---");
    console.log(`Sections: ${result.document.sections.length}`);
    console.log(`Introduction: ${result.document.introduction.substring(0, 150)}...`);
    console.log(`Conclusion: ${result.document.conclusion.substring(0, 150)}...`);
    
    console.log("\n--- Sections ---");
    for (const section of result.document.sections) {
      console.log(`  ${section.heading} (${section.content.length} chars)`);
      console.log(`    ${section.content.substring(0, 100)}...`);
    }

    console.log("\n--- Quality Metrics ---");
    console.log(`Reader questions: ${result.readerQuestions.length}`);
    console.log(`Gaps identified: ${result.gapCompletion.gaps.length}`);
    console.log(`Gaps filled: ${result.gapCompletion.filledGacts.length}`);
    console.log(`Reader readiness: ${result.gapCompletion.readerReadinessScore}/100`);
    console.log(`Editorial quality: ${result.editorialResult.qualityScore}/100`);
    console.log(`Passes editorial: ${result.editorialResult.passesEditorial}`);
    console.log(`Acceptance test passed: ${result.acceptanceTest.allPassed}`);
    console.log(`Acceptance confidence: ${result.acceptanceTest.overallConfidence}/100`);
    console.log(`Recommendation: ${result.acceptanceTest.recommendation}`);
    console.log(`Passes all checks: ${result.passesAllChecks}`);

    console.log("\n--- Acceptance Test Details ---");
    for (const question of result.acceptanceTest.questions) {
      console.log(`  ${question.question}: ${question.answer} (${question.confidence}%)`);
    }

    console.log("\n=== Validation Complete ===");

    if (result.passesAllChecks) {
      console.log("✓ Engine passes all acceptance criteria");
    } else {
      console.log("✗ Engine needs improvement");
    }

  } catch (error) {
    console.error("ERROR:", error);
    process.exit(1);
  }
}

validateEngine().catch(console.error);
