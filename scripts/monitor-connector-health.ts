/**
 * Production Hardening - Phase 2
 * Automated Connector Health Monitoring
 * 
 * Daily health check for all connectors
 * Verifies: HTTP availability, Response time, Extraction success, Knowledge Package generation, Validation success
 * Records failures without stopping the system
 */

import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

import { PythonDocumentationConnector } from "../services/acquisition/connectors/pythonDocumentationConnector";
import { GitDocumentationConnector } from "../services/acquisition/connectors/gitDocumentationConnector";
import { DockerDocumentationConnector } from "../services/acquisition/connectors/dockerDocumentationConnector";
import { NodejsDocumentationConnector } from "../services/acquisition/connectors/nodejsDocumentationConnector";
import { TypeScriptDocumentationConnector } from "../services/acquisition/connectors/typeScriptDocumentationConnector";
import { PostgreSQLDocumentationConnector } from "../services/acquisition/connectors/postgresqlDocumentationConnector";
import { MDNConnector } from "../services/acquisition/connectors/mdnConnector";
import { HTMLDocumentationExtractor } from "../services/acquisition/extractors/htmlDocumentationExtractor";
import { DataProcessor } from "../services/dataProcessor/dataProcessor";
import { createHash } from "crypto";

interface ConnectorHealthCheck {
  connector: string;
  sourceUrl: string;
  httpAvailable: boolean;
  responseTime: number;
  extractionSuccess: boolean;
  packageGenerationSuccess: boolean;
  validationSuccess: boolean;
  timestamp: string;
  error?: string;
}

interface HealthMonitoringResult {
  timestamp: string;
  totalConnectors: number;
  healthyConnectors: number;
  unhealthyConnectors: number;
  checks: ConnectorHealthCheck[];
}

function generateKnowledgeHash(data: any): string {
  return createHash("sha256").update(JSON.stringify(data)).digest("hex").substring(0, 16);
}

async function runConnectorHealthMonitoring(): Promise<HealthMonitoringResult> {
  const timestamp = new Date().toISOString();
  console.log("Connector Health Monitoring");
  console.log("=".repeat(60));
  console.log(`Timestamp: ${timestamp}\n`);

  const connectors = [
    {
      name: "Python Official Documentation",
      connector: new PythonDocumentationConnector(),
      sourceUrl: "https://docs.python.org/3/tutorial/introduction.html",
    },
    {
      name: "Git Official Documentation",
      connector: new GitDocumentationConnector(),
      sourceUrl: "https://git-scm.com/book/en/v2/Git-Branching-Branching-Workflows",
    },
    {
      name: "Docker Official Documentation",
      connector: new DockerDocumentationConnector(),
      sourceUrl: "https://docs.docker.com/get-started/overview/",
    },
    {
      name: "Node.js Documentation",
      connector: new NodejsDocumentationConnector(),
      sourceUrl: "https://nodejs.org/en/docs/",
    },
    {
      name: "TypeScript Documentation",
      connector: new TypeScriptDocumentationConnector(),
      sourceUrl: "https://www.typescriptlang.org/docs/handbook/interfaces.html",
    },
    {
      name: "PostgreSQL Documentation",
      connector: new PostgreSQLDocumentationConnector(),
      sourceUrl: "https://www.postgresql.org/docs/current/indexes-types.html",
    },
    {
      name: "MDN",
      connector: new MDNConnector(),
      sourceUrl: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures",
    },
  ];

  const checks: ConnectorHealthCheck[] = [];
  const extractor = new HTMLDocumentationExtractor();
  const dataProcessor = new DataProcessor({
    minConfidence: 0.0,
    allowPlaceholders: false,
    requireMetadata: true,
  });

  for (const { name, connector, sourceUrl } of connectors) {
    console.log(`Checking: ${name}`);
    const check: ConnectorHealthCheck = {
      connector: name,
      sourceUrl,
      httpAvailable: false,
      responseTime: 0,
      extractionSuccess: false,
      packageGenerationSuccess: false,
      validationSuccess: false,
      timestamp,
    };

    try {
      // HTTP availability and response time
      const startTime = Date.now();
      const connectorResult = await connector.connect({
        sourceType: connector.sourceType as any,
        sourceUrl,
      });
      const responseTime = Date.now() - startTime;

      check.httpAvailable = connectorResult.status === "READY";
      check.responseTime = responseTime;

      if (!check.httpAvailable) {
        check.error = connectorResult.error || "HTTP connection failed";
        console.log(`  ❌ HTTP failed: ${check.error}`);
        checks.push(check);
        continue;
      }

      console.log(`  ✅ HTTP available (${responseTime}ms)`);

      // Extraction success
      const extractorResult = await extractor.extract(connectorResult.data!, {
        sourceUrl,
      } as any);

      check.extractionSuccess = extractorResult.success;

      if (!check.extractionSuccess) {
        check.error = extractorResult.error || "Extraction failed";
        console.log(`  ❌ Extraction failed: ${check.error}`);
        checks.push(check);
        continue;
      }

      console.log(`  ✅ Extraction succeeded`);

      // Package generation success
      const knowledge = extractorResult.knowledge!;
      const knowledgePackageId = `pkg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const uniqueConcepts = knowledge.concepts.filter((concept: any, index: number, self: any[]) => 
        index === self.findIndex((c: any) => c.name === concept.name)
      );

      const testPackage = {
        id: knowledgePackageId,
        slug: name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
        knowledgeHash: generateKnowledgeHash(knowledge),
        topicId: null,
        category: "technology",
        intent: "educate" as const,
        definitions: knowledge.definitions.map((d: any) => ({
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
        procedures: knowledge.procedures.map((p: any) => ({
          id: p.id,
          name: p.name,
          steps: p.steps,
          confidence: "high",
        })),
        examples: knowledge.examples.map((e: any) => ({
          id: e.id,
          title: e.title,
          description: e.description,
          code: e.code,
          confidence: "high",
        })),
        comparisons: [],
        commands: [],
        formulae: [],
        warnings: knowledge.warnings.map((w: any) => ({
          id: w.id,
          title: w.title,
          description: w.description,
          severity: w.severity,
          confidence: "high",
        })),
        bestPractices: knowledge.bestPractices.map((bp: any) => ({
          id: bp.id,
          title: bp.title,
          description: bp.description,
          confidence: "high",
        })),
        commonMistakes: [],
        faqs: [],
        references: knowledge.references.map((r: any) => ({
          id: r.id,
          url: r.url,
          title: r.title,
        })),
        facts: [],
        citations: [],
        relationships: [],
        metadata: {
          sourceCount: 1,
          factCount: 0,
          relationshipCount: 0,
          lastUpdated: new Date().toISOString(),
          lastVerified: null,
          confidence: "high",
          sourceMetadata: {
            adapterName: connector.sourceType,
            adapterVersion: connector.version,
            sourceType: connector.sourceType as any,
            retrievedAt: connectorResult.metadata.retrievedAt,
            processedAt: new Date().toISOString(),
            validationStatus: "valid" as const,
          },
        },
      };

      check.packageGenerationSuccess = true;
      console.log(`  ✅ Package generation succeeded`);

      // Validation success
      const validationResult = dataProcessor.processPackage(testPackage, []);
      check.validationSuccess = validationResult.valid;

      if (!check.validationSuccess) {
        check.error = validationResult.errors.join(", ");
        console.log(`  ❌ Validation failed: ${check.error}`);
      } else {
        console.log(`  ✅ Validation succeeded`);
      }

    } catch (error: any) {
      check.error = `Exception: ${error.message}`;
      console.log(`  ❌ Exception: ${error.message}`);
    }

    checks.push(check);
    console.log();
  }

  const healthyConnectors = checks.filter(c => 
    c.httpAvailable && c.extractionSuccess && c.packageGenerationSuccess && c.validationSuccess
  ).length;

  const unhealthyConnectors = checks.length - healthyConnectors;

  console.log("=".repeat(60));
  console.log("HEALTH MONITORING SUMMARY");
  console.log("=".repeat(60));
  console.log(`Total Connectors: ${connectors.length}`);
  console.log(`Healthy: ${healthyConnectors}`);
  console.log(`Unhealthy: ${unhealthyConnectors}`);

  if (unhealthyConnectors > 0) {
    console.log(`\nUnhealthy Connectors:`);
    checks.filter(c => !(c.httpAvailable && c.extractionSuccess && c.packageGenerationSuccess && c.validationSuccess)).forEach(c => {
      console.log(`  ❌ ${c.connector}: ${c.error}`);
    });
  }

  return {
    timestamp,
    totalConnectors: connectors.length,
    healthyConnectors,
    unhealthyConnectors,
    checks,
  };
}

runConnectorHealthMonitoring()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("Health monitoring failed:", error);
    process.exit(1);
  });
