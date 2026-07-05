/**
 * Sprint 3 - Relationship Enrichment for Examples Collection
 * 
 * Extend Examples schema with relationship arrays while keeping Examples as independent canonical collection.
 * Relationships: relatedDefinitions[], relatedConcepts[], relatedProcedures[], references[]
 * No duplication, no embedding, no schema redesign, only relationship enrichment.
 */

import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

interface Example {
  id: string;
  title: string;
  description: string;
  code: string;
  relatedDefinitions: string[];
  relatedConcepts: string[];
  relatedProcedures: string[];
  references: string[];
  confidence: string;
}

interface RelationshipEnrichmentResult {
  totalExamples: number;
  examplesWithRelationships: number;
  examplesWithoutRelationships: number;
  relationshipDistribution: {
    avgRelatedDefinitions: number;
    avgRelatedConcepts: number;
    avgRelatedProcedures: number;
    avgReferences: number;
  };
}

function enrichExampleWithRelationships(example: any): Example {
  return {
    id: example.id,
    title: example.title,
    description: example.description,
    code: example.code,
    relatedDefinitions: example.relatedDefinitions || [],
    relatedConcepts: example.relatedConcepts || [],
    relatedProcedures: example.relatedProcedures || [],
    references: example.references || [],
    confidence: example.confidence || "high",
  };
}

function validateRelationshipModel(examples: Example[]): RelationshipEnrichmentResult {
  const totalExamples = examples.length;
  const examplesWithRelationships = examples.filter(e => 
    e.relatedDefinitions.length > 0 || 
    e.relatedConcepts.length > 0 || 
    e.relatedProcedures.length > 0 ||
    e.references.length > 0
  ).length;
  
  const examplesWithoutRelationships = totalExamples - examplesWithRelationships;

  const totalRelatedDefinitions = examples.reduce((sum, e) => sum + e.relatedDefinitions.length, 0);
  const totalRelatedConcepts = examples.reduce((sum, e) => sum + e.relatedConcepts.length, 0);
  const totalRelatedProcedures = examples.reduce((sum, e) => sum + e.relatedProcedures.length, 0);
  const totalReferences = examples.reduce((sum, e) => sum + e.references.length, 0);

  return {
    totalExamples,
    examplesWithRelationships,
    examplesWithoutRelationships,
    relationshipDistribution: {
      avgRelatedDefinitions: totalExamples > 0 ? totalRelatedDefinitions / totalExamples : 0,
      avgRelatedConcepts: totalExamples > 0 ? totalRelatedConcepts / totalExamples : 0,
      avgRelatedProcedures: totalExamples > 0 ? totalRelatedProcedures / totalExamples : 0,
      avgReferences: totalExamples > 0 ? totalReferences / totalExamples : 0,
    },
  };
}

async function runSprint3RelationshipEnrichment() {
  const timestamp = new Date().toISOString();
  console.log("Sprint 3 - Relationship Enrichment for Examples Collection");
  console.log("=".repeat(60));
  console.log(`Timestamp: ${timestamp}\n`);

  // Simulate example data for validation
  const sampleExamples: any[] = [
    {
      id: "ex1",
      title: "Python Hello World",
      description: "Simple Python program",
      code: "print('Hello, World!')",
      relatedDefinitions: ["def1"],
      relatedConcepts: ["concept1"],
      relatedProcedures: ["proc1"],
      references: ["ref1"],
      confidence: "high",
    },
    {
      id: "ex2",
      title: "Git Clone Command",
      description: "Clone a repository",
      code: "git clone https://github.com/user/repo.git",
      relatedDefinitions: ["def2"],
      relatedConcepts: ["concept2"],
      relatedProcedures: [],
      references: ["ref2"],
      confidence: "high",
    },
    {
      id: "ex3",
      title: "JavaScript Variable Declaration",
      description: "Declare variables in JavaScript",
      code: "const x = 10;",
      relatedDefinitions: [],
      relatedConcepts: [],
      relatedProcedures: [],
      references: [],
      confidence: "high",
    },
  ];

  console.log("Enriching examples with relationship arrays...");
  const enrichedExamples = sampleExamples.map(enrichExampleWithRelationships);
  
  console.log(`Processed ${enrichedExamples.length} examples\n`);

  console.log("Sample enriched example:");
  console.log(JSON.stringify(enrichedExamples[0], null, 2));
  console.log();

  const validationResult = validateRelationshipModel(enrichedExamples);

  console.log("Relationship Model Validation Results:");
  console.log("-".repeat(40));
  console.log(`Total Examples: ${validationResult.totalExamples}`);
  console.log(`Examples with Relationships: ${validationResult.examplesWithRelationships}`);
  console.log(`Examples without Relationships: ${validationResult.examplesWithoutRelationships}`);
  console.log();
  console.log("Relationship Distribution:");
  console.log(`  Avg Related Definitions: ${validationResult.relationshipDistribution.avgRelatedDefinitions.toFixed(2)}`);
  console.log(`  Avg Related Concepts: ${validationResult.relationshipDistribution.avgRelatedConcepts.toFixed(2)}`);
  console.log(`  Avg Related Procedures: ${validationResult.relationshipDistribution.avgRelatedProcedures.toFixed(2)}`);
  console.log(`  Avg References: ${validationResult.relationshipDistribution.avgReferences.toFixed(2)}`);

  return {
    enrichedExamples,
    validationResult,
  };
}

runSprint3RelationshipEnrichment()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("Relationship enrichment failed:", error);
    process.exit(1);
  });
