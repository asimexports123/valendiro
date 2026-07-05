/**
 * Phase 34: Knowledge Composition
 * 
 * Composes reusable knowledge + topic-specific knowledge = Complete Knowledge Package
 * Uses existing Knowledge Graph relationships for composition
 */

import type { KnowledgePackage } from "../renderer/types";

export interface CompositionResult {
  composedPackage: KnowledgePackage;
  reusedKnowledgeCount: number;
  topicSpecificKnowledgeCount: number;
  duplicatesEliminated: number;
}

export interface ReusableKnowledge {
  id: string;
  type: "definition" | "concept" | "procedure" | "warning" | "bestPractice";
  content: any;
  sourcePackageId: string;
  categories: string[];
}

export class KnowledgeComposer {
  private reusableKnowledgeCache: Map<string, ReusableKnowledge[]> = new Map();

  /**
   * Identify reusable knowledge from multiple packages
   */
  identifyReusableKnowledge(packages: KnowledgePackage[]): Map<string, ReusableKnowledge[]> {
    const reusableByCategory = new Map<string, ReusableKnowledge[]>();

    // Group by category (simplified - in production would use Knowledge Graph)
    for (const pkg of packages) {
      const category = pkg.category || "general";
      
      if (!reusableByCategory.has(category)) {
        reusableByCategory.set(category, []);
      }

      // Identify reusable definitions
      for (const def of pkg.definitions) {
        reusableByCategory.get(category)!.push({
          id: def.id,
          type: "definition",
          content: def,
          sourcePackageId: pkg.id,
          categories: [category],
        });
      }

      // Identify reusable concepts
      for (const concept of pkg.concepts) {
        reusableByCategory.get(category)!.push({
          id: concept.id,
          type: "concept",
          content: concept,
          sourcePackageId: pkg.id,
          categories: [category],
        });
      }

      // Identify reusable warnings
      for (const warning of pkg.warnings) {
        reusableByCategory.get(category)!.push({
          id: warning.id,
          type: "warning",
          content: warning,
          sourcePackageId: pkg.id,
          categories: [category],
        });
      }

      // Identify reusable best practices
      for (const bp of pkg.bestPractices) {
        reusableByCategory.get(category)!.push({
          id: bp.id,
          type: "bestPractice",
          content: bp,
          sourcePackageId: pkg.id,
          categories: [category],
        });
      }
    }

    this.reusableKnowledgeCache = reusableByCategory;
    return reusableByCategory;
  }

  /**
   * Compose a complete Knowledge Package from reusable + topic-specific knowledge
   */
  composePackage(
    topicPackage: KnowledgePackage,
    reusableKnowledge: Map<string, ReusableKnowledge[]>
  ): CompositionResult {
    const category = topicPackage.category || "general";
    const reusableItems = reusableKnowledge.get(category) || [];

    const composedPackage: KnowledgePackage = {
      ...topicPackage,
      // Start with topic-specific knowledge
      definitions: [...topicPackage.definitions],
      concepts: [...topicPackage.concepts],
      procedures: [...topicPackage.procedures],
      examples: [...topicPackage.examples],
      comparisons: [...topicPackage.comparisons],
      commands: [...topicPackage.commands],
      formulae: [...topicPackage.formulae],
      warnings: [...topicPackage.warnings],
      bestPractices: [...topicPackage.bestPractices],
      commonMistakes: [...topicPackage.commonMistakes],
      faqs: [...topicPackage.faqs],
      references: [...topicPackage.references],
    };

    let reusedCount = 0;
    let duplicatesEliminated = 0;

    // Add reusable knowledge (avoiding duplicates)
    for (const reusable of reusableItems) {
      // Skip if from the same package
      if (reusable.sourcePackageId === topicPackage.id) {
        continue;
      }

      // Check for duplicates
      if (!this.isDuplicate(reusable, composedPackage)) {
        switch (reusable.type) {
          case "definition":
            composedPackage.definitions.push(reusable.content);
            break;
          case "concept":
            composedPackage.concepts.push(reusable.content);
            break;
          case "procedure":
            composedPackage.procedures.push(reusable.content);
            break;
          case "warning":
            composedPackage.warnings.push(reusable.content);
            break;
          case "bestPractice":
            composedPackage.bestPractices.push(reusable.content);
            break;
        }
        reusedCount++;
      } else {
        duplicatesEliminated++;
      }
    }

    return {
      composedPackage,
      reusedKnowledgeCount: reusedCount,
      topicSpecificKnowledgeCount: topicPackage.definitions.length + topicPackage.concepts.length + topicPackage.procedures.length,
      duplicatesEliminated,
    };
  }

  /**
   * Check if reusable knowledge already exists in package
   */
  private isDuplicate(reusable: ReusableKnowledge, pkg: KnowledgePackage): boolean {
    const content = reusable.content;
    const type = reusable.type;

    switch (type) {
      case "definition":
        return pkg.definitions.some(d => d.term.toLowerCase() === content.term.toLowerCase());
      case "concept":
        return pkg.concepts.some(c => c.name.toLowerCase() === content.name.toLowerCase());
      case "procedure":
        return pkg.procedures.some(p => p.name.toLowerCase() === content.name.toLowerCase());
      case "warning":
        return pkg.warnings.some(w => w.title.toLowerCase() === content.title.toLowerCase());
      case "bestPractice":
        return pkg.bestPractices.some(bp => bp.title.toLowerCase() === content.title.toLowerCase());
      default:
        return false;
    }
  }
}
