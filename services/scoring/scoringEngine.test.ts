import { describe, expect, it } from "vitest";
import { ScoringEngine } from "@/services/scoring/scoringEngine";
import type {
  KnowledgePackage,
  StructuredDefinition,
  StructuredExample,
} from "@/services/renderer/types";

function makeDefinition(
  overrides: Partial<StructuredDefinition> = {}
): StructuredDefinition {
  return {
    id: "def-1",
    term: "Term",
    definition: "A definition",
    confidence: "0.9",
    ...overrides,
  };
}

function makeExample(
  overrides: Partial<StructuredExample> = {}
): StructuredExample {
  return {
    id: "ex-1",
    title: "Example",
    description: "An example",
    confidence: "0.9",
    ...overrides,
  };
}

function makePackage(
  overrides: Partial<KnowledgePackage> = {}
): KnowledgePackage {
  return {
    id: "pkg-1",
    slug: "pkg",
    knowledgeHash: "hash",
    topicId: null,
    category: "general",
    intent: "inform",
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
    facts: [],
    citations: [],
    relationships: [],
    metadata: {
      sourceCount: 0,
      factCount: 0,
      relationshipCount: 0,
      lastUpdated: "2024-01-01",
      lastVerified: null,
      confidence: "",
      sourceMetadata: {
        adapterName: "",
        adapterVersion: "",
        sourceType: "json",
        retrievedAt: "",
        processedAt: "",
        validationStatus: "valid",
      },
    },
    ...overrides,
  };
}

describe("ScoringEngine.scorePackage", () => {
  it("returns rounded integer scores within 0-100", () => {
    const result = new ScoringEngine().scorePackage(makePackage());

    expect(Number.isInteger(result.overallScore)).toBe(true);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    for (const value of Object.values(result.breakdown)) {
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(100);
    }
  });

  it("scores an empty package below the publication threshold", () => {
    const result = new ScoringEngine().scorePackage(makePackage());
    expect(result.passesThreshold).toBe(false);
  });

  it("scores a rich package higher than an empty one", () => {
    const engine = new ScoringEngine();
    const empty = engine.scorePackage(makePackage());
    const rich = engine.scorePackage(
      makePackage({
        definitions: [makeDefinition()],
        concepts: [
          { id: "c1", name: "Concept", description: "desc", confidence: "0.9" },
        ],
        procedures: [
          { id: "p1", name: "Proc", steps: ["a", "b"], confidence: "0.9" },
        ],
        examples: [
          makeExample({ code: "console.log(1)" }),
          makeExample({ id: "ex-2" }),
          makeExample({ id: "ex-3" }),
        ],
        commands: [
          { id: "cmd1", command: "ls", description: "list", confidence: "0.9" },
        ],
        warnings: [
          { id: "w1", title: "Warn", description: "d", severity: "high" },
        ],
        bestPractices: [
          { id: "bp1", title: "BP", description: "d", confidence: "0.9" },
        ],
        commonMistakes: [
          { id: "cm1", mistake: "m", correction: "c", confidence: "0.9" },
        ],
        faqs: [{ id: "f1", question: "q", answer: "a", confidence: "0.9" }],
      })
    );

    expect(rich.overallScore).toBeGreaterThan(empty.overallScore);
  });

  it("awards examples points that scale with example count and code presence", () => {
    const engine = new ScoringEngine();
    const one = engine.scorePackage(
      makePackage({ examples: [makeExample()] })
    );
    const many = engine.scorePackage(
      makePackage({
        examples: [
          makeExample({ code: "x" }),
          makeExample({ id: "ex-2" }),
          makeExample({ id: "ex-3" }),
        ],
      })
    );

    expect(one.breakdown.examples).toBe(40);
    expect(many.breakdown.examples).toBe(100);
  });

  it("uses validation integrity based on high-confidence items", () => {
    const engine = new ScoringEngine();
    const highConfidence = engine.scorePackage(
      makePackage({ definitions: [makeDefinition({ confidence: "0.9" })] })
    );
    const lowConfidence = engine.scorePackage(
      makePackage({ definitions: [makeDefinition({ confidence: "0.1" })] })
    );

    expect(highConfidence.breakdown.validationIntegrity).toBeGreaterThan(
      lowConfidence.breakdown.validationIntegrity
    );
  });
});

describe("ScoringEngine options", () => {
  it("passes the threshold when a low minimum score is configured", () => {
    const result = new ScoringEngine({ minimumScore: 1 }).scorePackage(
      makePackage()
    );
    expect(result.passesThreshold).toBe(true);
  });

  it("honors custom weights", () => {
    const engine = new ScoringEngine({
      weights: {
        subjectAccuracy: 1,
        knowledgeCoverage: 0,
        readability: 0,
        practicalValue: 0,
        examples: 0,
        internalLinking: 0,
        seoMetadata: 0,
        validationIntegrity: 0,
      },
    });
    const result = engine.scorePackage(makePackage());
    // Empty package subject accuracy base score is 70.
    expect(result.overallScore).toBe(70);
  });
});
