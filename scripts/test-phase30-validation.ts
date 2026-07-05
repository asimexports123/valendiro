/**
 * Phase 30 Validation Test Suite
 * Tests the Data Processor validation capabilities
 */

import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

import { DataProcessor } from "../services/dataProcessor/dataProcessor";
import type { KnowledgePackage } from "../services/renderer/types";

async function runValidationTests() {
  const processor = new DataProcessor({
    minConfidence: 0.5,
    allowPlaceholders: false,
    requireMetadata: true,
  });

  const testResults: { test: string; passed: boolean; errors: string[] }[] = [];

  // Test 1: Schema validation
  console.log("Test 1: Schema validation");
  const invalidPkg: any = {
    id: "",
    slug: "",
    knowledgeHash: "",
    topicId: null,
    category: "",
    intent: "invalid",
    facts: [],
    citations: [],
    relationships: [],
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
    metadata: {},
  };
  const schemaResult = processor.validateSchema(invalidPkg);
  testResults.push({
    test: "Schema validation rejects invalid package",
    passed: !schemaResult.valid && schemaResult.errors.length > 0,
    errors: schemaResult.errors,
  });

  // Test 2: Metadata validation
  console.log("Test 2: Metadata validation");
  const noMetadataPkg: KnowledgePackage = {
    ...invalidPkg,
    id: "test-1",
    slug: "test-slug",
    knowledgeHash: "abc123",
    topicId: null,
    category: "general",
    intent: "inform",
    metadata: {
      sourceCount: 1,
      factCount: 1,
      relationshipCount: 0,
      lastUpdated: new Date().toISOString(),
      lastVerified: null,
      confidence: "high",
      sourceMetadata: null as any,
    },
  };
  const metadataResult = processor.validateMetadata(noMetadataPkg);
  testResults.push({
    test: "Metadata validation rejects missing source metadata",
    passed: !metadataResult.valid && metadataResult.errors.length > 0,
    errors: metadataResult.errors,
  });

  // Test 3: Placeholder detection
  console.log("Test 3: Placeholder detection");
  const placeholderPkg: KnowledgePackage = {
    ...noMetadataPkg,
    metadata: {
      ...noMetadataPkg.metadata,
      sourceMetadata: {
        adapterName: "test",
        adapterVersion: "1.0.0",
        sourceType: "json",
        retrievedAt: new Date().toISOString(),
        processedAt: new Date().toISOString(),
        validationStatus: "valid",
      },
    },
    definitions: [
      {
        id: "def-1",
        term: "Type 1",
        definition: "This is Type 1 placeholder",
        confidence: "high",
      },
    ],
  };
  const placeholderResult = processor.detectPlaceholders(placeholderPkg);
  testResults.push({
    test: "Placeholder detection rejects Type 1 placeholder",
    passed: !placeholderResult.valid && placeholderResult.errors.length > 0,
    errors: placeholderResult.errors,
  });

  // Test 4: Slug validation
  console.log("Test 4: Slug validation");
  const invalidSlugResult = processor.validateSlug("Invalid_Slug", []);
  testResults.push({
    test: "Slug validation rejects uppercase and underscores",
    passed: !invalidSlugResult.valid && invalidSlugResult.errors.length > 0,
    errors: invalidSlugResult.errors,
  });

  // Test 5: Duplicate detection
  console.log("Test 5: Duplicate detection");
  const duplicatePkg: KnowledgePackage = {
    ...placeholderPkg,
    definitions: [
      {
        id: "def-1",
        term: "Python",
        definition: "Programming language",
        confidence: "high",
      },
      {
        id: "def-2",
        term: "Python",
        definition: "Snake species",
        confidence: "high",
      },
    ],
  };
  const duplicateResult = processor.detectDuplicates(duplicatePkg);
  testResults.push({
    test: "Duplicate detection detects duplicate definitions",
    passed: !duplicateResult.valid && duplicateResult.errors.length > 0,
    errors: duplicateResult.errors,
  });

  // Test 6: Confidence validation
  console.log("Test 6: Confidence validation");
  const lowConfidencePkg: KnowledgePackage = {
    ...placeholderPkg,
    definitions: [
      {
        id: "def-1",
        term: "Test",
        definition: "Test definition",
        confidence: "0.1",
      },
    ],
  };
  const confidenceResult = processor.validateConfidence(lowConfidencePkg);
  testResults.push({
    test: "Confidence validation rejects low confidence facts",
    passed: !confidenceResult.valid && confidenceResult.errors.length > 0,
    errors: confidenceResult.errors,
  });

  // Test 7: Valid package passes all validations
  console.log("Test 7: Valid package passes all validations");
  const validPkg: KnowledgePackage = {
    id: "test-2",
    slug: "valid-test-slug",
    knowledgeHash: "def456",
    topicId: null,
    category: "technology",
    intent: "educate",
    definitions: [
      {
        id: "def-1",
        term: "Python",
        definition: "High-level programming language",
        confidence: "0.9",
      },
    ],
    concepts: [
      {
        id: "concept-1",
        name: "Variable",
        description: "Storage location for data",
        confidence: "0.85",
      },
    ],
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
    facts: [],
    citations: [],
    relationships: [],
    metadata: {
      sourceCount: 1,
      factCount: 2,
      relationshipCount: 0,
      lastUpdated: new Date().toISOString(),
      lastVerified: null,
      confidence: "high",
      sourceMetadata: {
        adapterName: "test",
        adapterVersion: "1.0.0",
        sourceType: "json",
        retrievedAt: new Date().toISOString(),
        processedAt: new Date().toISOString(),
        validationStatus: "valid",
      },
    },
  };
  const validResult = processor.processPackage(validPkg, []);
  testResults.push({
    test: "Valid package passes all validations",
    passed: validResult.valid,
    errors: validResult.errors,
  });

  // Print results
  console.log("\n=== Validation Test Results ===\n");
  let passedCount = 0;
  testResults.forEach(result => {
    const status = result.passed ? "✅ PASS" : "❌ FAIL";
    console.log(`${status}: ${result.test}`);
    if (!result.passed && result.errors.length > 0) {
      result.errors.forEach(err => console.log(`  - ${err}`));
    }
    if (result.passed) passedCount++;
  });

  console.log(`\nTotal: ${testResults.length} tests, ${passedCount} passed, ${testResults.length - passedCount} failed`);

  return testResults;
}

runValidationTests()
  .then(results => process.exit(0))
  .catch(error => {
    console.error("Error:", error);
    process.exit(1);
  });
