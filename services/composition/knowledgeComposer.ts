/**
 * Phase 34A: Canonical Knowledge Composition
 * 
 * Reference-based composition (not copy-based)
 * Topic packages contain only topic-specific knowledge + references to reusable knowledge
 * Authoring resolves references at runtime (temporary composed package, never persisted)
 */

import type { KnowledgePackage } from "../renderer/types";

export interface CompositionResult {
  topicPackage: KnowledgePackage; // Contains only topic-specific knowledge + references
  referenceCount: number;
  canonicalGroupsCreated: number;
}

export interface Reference {
  id: string;
  type: "definition" | "concept" | "procedure" | "warning" | "bestPractice";
  canonicalPackageId: string;
}

export class KnowledgeComposer {
  private canonicalKnowledgeCache: Map<string, KnowledgePackage> = new Map();

  /**
   * Identify canonical reusable knowledge from multiple packages
   * Returns canonical packages (not groups)
   */
  identifyCanonicalKnowledge(packages: KnowledgePackage[]): Map<string, KnowledgePackage> {
    const canonicalPackages = new Map<string, KnowledgePackage>();

    // Group by category to create canonical packages
    const categoryMap = new Map<string, KnowledgePackage[]>();
    for (const pkg of packages) {
      const category = pkg.category || "general";
      if (!categoryMap.has(category)) {
        categoryMap.set(category, []);
      }
      categoryMap.get(category)!.push(pkg);
    }

    // Create canonical packages for each category
    for (const [category, pkgs] of categoryMap.entries()) {
      const canonicalPkg = this.createCanonicalPackage(category, pkgs);
      canonicalPackages.set(category, canonicalPkg);
    }

    this.canonicalKnowledgeCache = canonicalPackages;
    return canonicalPackages;
  }

  /**
   * Create a canonical package from multiple packages of the same category
   */
  private createCanonicalPackage(category: string, packages: KnowledgePackage[]): KnowledgePackage {
    const canonicalPkg: KnowledgePackage = {
      id: `canonical_${category}`,
      slug: `canonical-${category}`,
      knowledgeHash: "",
      topicId: null,
      category: category,
      intent: "educate" as const,
      // Deduplicate and merge all knowledge from category
      definitions: this.deduplicateDefinitions(packages),
      concepts: this.deduplicateConcepts(packages),
      procedures: this.deduplicateProcedures(packages),
      examples: this.deduplicateExamples(packages),
      comparisons: this.deduplicateComparisons(packages),
      commands: this.deduplicateCommands(packages),
      formulae: this.deduplicateFormulae(packages),
      warnings: this.deduplicateWarnings(packages),
      bestPractices: this.deduplicateBestPractices(packages),
      commonMistakes: this.deduplicateCommonMistakes(packages),
      faqs: this.deduplicateFAQs(packages),
      references: this.deduplicateReferences(packages),
      facts: [],
      citations: [],
      relationships: [],
      metadata: {
        sourceCount: packages.length,
        factCount: 0,
        relationshipCount: 0,
        lastUpdated: new Date().toISOString(),
        lastVerified: null,
        confidence: "high",
        sourceMetadata: {
          adapterName: "canonical-composer",
          adapterVersion: "1.0.0",
          sourceType: "canonical" as any,
          retrievedAt: new Date().toISOString(),
          processedAt: new Date().toISOString(),
          validationStatus: "valid",
        },
      },
    };

    return canonicalPkg;
  }

  /**
   * Compose topic package with references (not copies)
   * Topic package contains only topic-specific knowledge + references to canonical knowledge
   */
  composePackageWithReferences(
    topicPackage: KnowledgePackage,
    canonicalKnowledge: Map<string, KnowledgePackage>
  ): CompositionResult {
    const category = topicPackage.category || "general";
    const canonicalPkg = canonicalKnowledge.get(category);

    if (!canonicalPkg) {
      return {
        topicPackage,
        referenceCount: 0,
        canonicalGroupsCreated: 0,
      };
    }

    // Create references to canonical knowledge
    const references: Reference[] = [];

    // Reference canonical definitions
    for (const def of canonicalPkg.definitions) {
      references.push({
        id: def.id,
        type: "definition",
        canonicalPackageId: canonicalPkg.id,
      });
    }

    // Reference canonical concepts
    for (const concept of canonicalPkg.concepts) {
      references.push({
        id: concept.id,
        type: "concept",
        canonicalPackageId: canonicalPkg.id,
      });
    }

    // Reference canonical warnings
    for (const warning of canonicalPkg.warnings) {
      references.push({
        id: warning.id,
        type: "warning",
        canonicalPackageId: canonicalPkg.id,
      });
    }

    // Reference canonical best practices
    for (const bp of canonicalPkg.bestPractices) {
      references.push({
        id: bp.id,
        type: "bestPractice",
        canonicalPackageId: canonicalPkg.id,
      });
    }

    // Store references in a separate structure (not in metadata to avoid type errors)
    // In production, this would be stored in a separate references table
    const topicPackageWithReferences = topicPackage as any;
    topicPackageWithReferences.canonicalReferences = references;

    return {
      topicPackage: topicPackageWithReferences,
      referenceCount: references.length,
      canonicalGroupsCreated: canonicalKnowledge.size,
    };
  }

  /**
   * Resolve references at authoring time (temporary composed package, never persisted)
   */
  resolveReferences(
    topicPackage: KnowledgePackage,
    canonicalKnowledge: Map<string, KnowledgePackage>
  ): KnowledgePackage {
    const category = topicPackage.category || "general";
    const canonicalPkg = canonicalKnowledge.get(category);

    if (!canonicalPkg) {
      return topicPackage;
    }

    // Create temporary composed package in memory only
    const composedPackage: KnowledgePackage = {
      ...topicPackage,
      // Merge topic-specific + canonical knowledge
      definitions: [...topicPackage.definitions, ...canonicalPkg.definitions],
      concepts: [...topicPackage.concepts, ...canonicalPkg.concepts],
      procedures: [...topicPackage.procedures, ...canonicalPkg.procedures],
      examples: [...topicPackage.examples, ...canonicalPkg.examples],
      comparisons: [...topicPackage.comparisons, ...canonicalPkg.comparisons],
      commands: [...topicPackage.commands, ...canonicalPkg.commands],
      formulae: [...topicPackage.formulae, ...canonicalPkg.formulae],
      warnings: [...topicPackage.warnings, ...canonicalPkg.warnings],
      bestPractices: [...topicPackage.bestPractices, ...canonicalPkg.bestPractices],
      commonMistakes: [...topicPackage.commonMistakes, ...canonicalPkg.commonMistakes],
      faqs: [...topicPackage.faqs, ...canonicalPkg.faqs],
      references: [...topicPackage.references, ...canonicalPkg.references],
    };

    return composedPackage;
  }

  // Deduplication helpers
  private deduplicateDefinitions(packages: KnowledgePackage[]) {
    const seen = new Set<string>();
    const result = [];
    for (const pkg of packages) {
      for (const def of pkg.definitions) {
        const key = def.term.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          result.push(def);
        }
      }
    }
    return result;
  }

  private deduplicateConcepts(packages: KnowledgePackage[]) {
    const seen = new Set<string>();
    const result = [];
    for (const pkg of packages) {
      for (const concept of pkg.concepts) {
        const key = concept.name.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          result.push(concept);
        }
      }
    }
    return result;
  }

  private deduplicateProcedures(packages: KnowledgePackage[]) {
    const seen = new Set<string>();
    const result = [];
    for (const pkg of packages) {
      for (const proc of pkg.procedures) {
        const key = proc.name.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          result.push(proc);
        }
      }
    }
    return result;
  }

  private deduplicateExamples(packages: KnowledgePackage[]) {
    const seen = new Set<string>();
    const result = [];
    for (const pkg of packages) {
      for (const ex of pkg.examples) {
        const key = ex.title.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          result.push(ex);
        }
      }
    }
    return result;
  }

  private deduplicateComparisons(packages: KnowledgePackage[]) {
    const seen = new Set<string>();
    const result = [];
    for (const pkg of packages) {
      for (const comp of pkg.comparisons) {
        const key = comp.items.map(i => i.name).join(",");
        if (!seen.has(key)) {
          seen.add(key);
          result.push(comp);
        }
      }
    }
    return result;
  }

  private deduplicateCommands(packages: KnowledgePackage[]) {
    const seen = new Set<string>();
    const result = [];
    for (const pkg of packages) {
      for (const cmd of pkg.commands) {
        const key = cmd.command.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          result.push(cmd);
        }
      }
    }
    return result;
  }

  private deduplicateFormulae(packages: KnowledgePackage[]) {
    const seen = new Set<string>();
    const result = [];
    for (const pkg of packages) {
      for (const formula of pkg.formulae) {
        const key = formula.name.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          result.push(formula);
        }
      }
    }
    return result;
  }

  private deduplicateWarnings(packages: KnowledgePackage[]) {
    const seen = new Set<string>();
    const result = [];
    for (const pkg of packages) {
      for (const warning of pkg.warnings) {
        const key = warning.title.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          result.push(warning);
        }
      }
    }
    return result;
  }

  private deduplicateBestPractices(packages: KnowledgePackage[]) {
    const seen = new Set<string>();
    const result = [];
    for (const pkg of packages) {
      for (const bp of pkg.bestPractices) {
        const key = bp.title.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          result.push(bp);
        }
      }
    }
    return result;
  }

  private deduplicateCommonMistakes(packages: KnowledgePackage[]) {
    const seen = new Set<string>();
    const result = [];
    for (const pkg of packages) {
      for (const cm of pkg.commonMistakes) {
        const key = cm.mistake.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          result.push(cm);
        }
      }
    }
    return result;
  }

  private deduplicateFAQs(packages: KnowledgePackage[]) {
    const seen = new Set<string>();
    const result = [];
    for (const pkg of packages) {
      for (const faq of pkg.faqs) {
        const key = faq.question.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          result.push(faq);
        }
      }
    }
    return result;
  }

  private deduplicateReferences(packages: KnowledgePackage[]) {
    const seen = new Set<string>();
    const result = [];
    for (const pkg of packages) {
      for (const ref of pkg.references) {
        const key = (ref.url || "").toLowerCase();
        if (!seen.has(key) && key) {
          seen.add(key);
          result.push(ref);
        }
      }
    }
    return result;
  }
}
