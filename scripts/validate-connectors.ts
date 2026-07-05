/**
 * Phase 32B: Validate Connector Architecture
 * 
 * Tests:
 * - Connector interface
 * - Extractor interface
 * - Normalizer interface
 * - Wikipedia connector
 * - Local JSON connector
 */

import { LocalJsonConnector } from "../services/acquisition/connectors/localJsonConnector";
import { WikipediaConnector } from "../services/acquisition/connectors/wikipediaConnector";
import { JsonExtractor } from "../services/acquisition/extractors/jsonExtractor";
import { WikipediaExtractor } from "../services/acquisition/extractors/wikipediaExtractor";
import { KnowledgeNormalizer } from "../services/acquisition/normalizers/knowledgeNormalizer";
import type { IConnector, IExtractor, INormalizer } from "../services/acquisition/connectors/connector";

async function validateConnectors() {
  console.log("Phase 32B: Connector Architecture Validation");
  console.log("=".repeat(60));

  const results = {
    interfaces: {
      connector: false,
      extractor: false,
      normalizer: false,
    },
    connectors: {
      localJson: false,
      wikipedia: false,
    },
    extractors: {
      json: false,
      wikipedia: false,
    },
    normalizer: false,
  };

  // Test 1: Connector Interface
  console.log("\nTest 1: Connector Interface");
  try {
    const localJsonConnector: IConnector = new LocalJsonConnector();
    const config = {
      sourceType: "local-json" as const,
      sourceUrl: "test.json",
    };
    const isValid = localJsonConnector.validateSource(config);
    console.log(`Local JSON connector validation: ${isValid ? "✅" : "❌"}`);
    results.interfaces.connector = true;
    results.connectors.localJson = isValid;
  } catch (error: any) {
    console.log(`❌ Error: ${error.message}`);
  }

  // Test 2: Extractor Interface
  console.log("\nTest 2: Extractor Interface");
  try {
    const jsonExtractor: IExtractor = new JsonExtractor();
    const isValid = jsonExtractor.validateData("{}");
    console.log(`JSON extractor validation: ${isValid ? "✅" : "❌"}`);
    results.interfaces.extractor = true;
    results.extractors.json = isValid;
  } catch (error: any) {
    console.log(`❌ Error: ${error.message}`);
  }

  // Test 3: Normalizer Interface
  console.log("\nTest 3: Normalizer Interface");
  try {
    const normalizer: INormalizer = new KnowledgeNormalizer();
    const isValid = normalizer.validateKnowledge({
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
        confidence: 0.9,
      },
    });
    console.log(`Normalizer validation: ${isValid ? "✅" : "❌"}`);
    results.interfaces.normalizer = true;
    results.normalizer = isValid;
  } catch (error: any) {
    console.log(`❌ Error: ${error.message}`);
  }

  // Test 4: Wikipedia Connector (API call - may fail in restricted environment)
  console.log("\nTest 4: Wikipedia Connector");
  try {
    const wikipediaConnector: IConnector = new WikipediaConnector();
    const config = {
      sourceType: "wikipedia" as const,
      sourceUrl: "Python_(programming_language)",
    };
    const isValid = wikipediaConnector.validateSource(config);
    console.log(`Wikipedia connector validation: ${isValid ? "✅" : "❌"}`);
    results.interfaces.connector = true;
    results.connectors.wikipedia = isValid;
  } catch (error: any) {
    console.log(`❌ Error: ${error.message}`);
  }

  // Test 5: Wikipedia Extractor
  console.log("\nTest 5: Wikipedia Extractor");
  try {
    const wikipediaExtractor: IExtractor = new WikipediaExtractor();
    const isValid = wikipediaExtractor.validateData({
      query: {
        pages: {
          test: { title: "Test", extract: "This is a test" },
        },
      },
    });
    console.log(`Wikipedia extractor validation: ${isValid ? "✅" : "❌"}`);
    results.interfaces.extractor = true;
    results.extractors.wikipedia = isValid;
  } catch (error: any) {
    console.log(`❌ Error: ${error.message}`);
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("VALIDATION RESULTS");
  console.log("=".repeat(60));
  console.log(`Connector Interface: ${results.interfaces.connector ? "✅" : "❌"}`);
  console.log(`Extractor Interface: ${results.interfaces.extractor ? "✅" : "❌"}`);
  console.log(`Normalizer Interface: ${results.interfaces.normalizer ? "✅" : "❌"}`);
  console.log(`Local JSON Connector: ${results.connectors.localJson ? "✅" : "❌"}`);
  console.log(`Wikipedia Connector: ${results.connectors.wikipedia ? "✅" : "❌"}`);
  console.log(`JSON Extractor: ${results.extractors.json ? "✅" : "❌"}`);
  console.log(`Wikipedia Extractor: ${results.extractors.wikipedia ? "✅" : "❌"}`);
  console.log(`Normalizer: ${results.normalizer ? "✅" : "❌"}`);

  const totalTests = Object.values(results.interfaces).length + 
                     Object.values(results.connectors).length + 
                     Object.values(results.extractors).length + 
                     (results.normalizer ? 1 : 0);
  const passedTests = Object.values(results.interfaces).filter(Boolean).length + 
                      Object.values(results.connectors).filter(Boolean).length + 
                      Object.values(results.extractors).filter(Boolean).length + 
                      (results.normalizer ? 1 : 0);

  console.log(`\nTotal: ${passedTests}/${totalTests} tests passed`);
}

validateConnectors()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("Error:", error);
    process.exit(1);
  });
