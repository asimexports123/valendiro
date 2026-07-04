import { classifyIntent } from "../services/renderer/intentClassifier";

async function testClassification() {
  console.log("=== Testing Intent Classification ===\n");

  const testSlugs = [
    "python-programming-fundamentals",
    "javascript-fundamentals",
    "typescript-language",
    "rust-programming-language",
    "go-programming-language",
    "sql-fundamentals",
    "react-library",
    "nextjs-framework",
    "css-fundamentals",
    "restful-apis",
  ];

  for (const slug of testSlugs) {
    const classification = classifyIntent(slug, null);
    console.log(`Slug: ${slug}`);
    console.log(`  Category: ${classification.category}`);
    console.log(`  Intent: ${classification.primaryIntent}`);
    console.log(`  Confidence: ${classification.confidence}`);
    console.log();
  }
}

testClassification().catch(console.error);
