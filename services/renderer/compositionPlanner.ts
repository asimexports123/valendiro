/**
 * Composition Planner
 *
 * Replaces CompositionPolicy as the primary decision engine.
 * 
 * Consumes:
 * - Subject Model
 * - Editorial Blueprint
 * - Knowledge Package
 * - Intent
 * - Topic
 *
 * Produces:
 * - Sections
 * - Flow
 * - Ordering
 * - Required content
 * - Optional content
 * - Rendering strategy
 */

import type { PluginFact, CitationInput, RelationshipInput } from "./types";
import { topicClassificationEngine, type ClassificationResult } from "./topicClassificationEngine";
import { inferIntent } from "./compositionPolicy";

const EDITORIAL_BLUEPRINTS = require("../../config/subject-models.json");
const BLUEPRINT_CONFIG = require("../../config/editorial-blueprints.json");

export interface CompositionInput {
  topic: string;
  category: string;
  slug: string;
  title?: string;
  knowledgePackage: {
    facts: PluginFact[];
    citations: CitationInput[];
    relationships: RelationshipInput[];
  };
}

export interface CompositionPlan {
  subjectModel: string;
  editorialBlueprint: string;
  intent: string;
  sections: SectionPlan[];
  renderingStrategy: string;
  proseStyle: string;
  audience: string;
}

export interface SectionPlan {
  type: string;
  heading: string;
  required: boolean;
  order: number;
  factTypes: string[];
  minFacts: number;
}

export class CompositionPlanner {
  /**
   * Plan the composition for a topic
   */
  plan(input: CompositionInput): CompositionPlan {
    // Step 1: Classify the topic
    const classification = topicClassificationEngine.classify({
      category: input.category,
      slug: input.slug,
      title: input.title,
      facts: input.knowledgePackage.facts,
    });

    // Step 2: Get editorial blueprint
    const blueprint = this.getEditorialBlueprint(classification.subjectModel);
    
    // Step 3: Infer intent
    const intent = inferIntent(input.category, input.slug);

    // Step 4: Build section plan from blueprint
    const sections = this.buildSectionPlan(blueprint, input.slug);

    // Step 5: Determine rendering strategy
    const renderingStrategy = this.selectRenderingStrategy(classification.subjectModel, intent);

    return {
      subjectModel: classification.subjectModel,
      editorialBlueprint: blueprint.name,
      intent,
      sections,
      renderingStrategy,
      proseStyle: blueprint.proseStyle || "educational",
      audience: blueprint.audience || "general",
    };
  }

  /**
   * Get editorial blueprint for a subject model
   */
  private getEditorialBlueprint(subjectModel: string): any {
    const blueprint = BLUEPRINT_CONFIG.blueprints[subjectModel];
    
    if (!blueprint) {
      // Fallback to programming blueprint
      return BLUEPRINT_CONFIG.blueprints.programming || {
        name: "Default Technical Guide",
        subjectModel: "programming",
        requiredSections: [],
        proseStyle: "educational",
        audience: "general",
      };
    }

    return blueprint;
  }

  /**
   * Build section plan from blueprint
   */
  private buildSectionPlan(blueprint: any, slug: string): SectionPlan[] {
    const sections: SectionPlan[] = [];
    const requiredSections = blueprint.requiredSections || [];

    for (const sectionConfig of requiredSections) {
      const heading = sectionConfig.heading.replace("{subject}", this.extractSubject(slug));
      
      sections.push({
        type: sectionConfig.type,
        heading,
        required: sectionConfig.required || false,
        order: sectionConfig.order || sections.length + 1,
        factTypes: this.getFactTypesForSection(sectionConfig.type),
        minFacts: sectionConfig.required ? 2 : 0,
      });
    }

    return sections.sort((a, b) => a.order - b.order);
  }

  /**
   * Map section types to fact types
   */
  private getFactTypesForSection(sectionType: string): string[] {
    const mapping: Record<string, string[]> = {
      definition: ["definition"],
      architecture: ["property", "causal"],
      design: ["property", "causal"],
      implementation: ["procedure", "property"],
      usage: ["procedure", "property"],
      performance: ["measurement", "property"],
      "best-practices": ["rule", "principle"],
      "common-mistakes": ["warning", "causal"],
      debugging: ["procedure", "property", "causal"],
      selection: ["property", "comparison"],
      evaluation: ["measurement", "comparison", "property"],
      governance: ["rule", "principle"],
      risk: ["warning", "causal"],
      preparation: ["procedure", "property"],
      planning: ["procedure", "property"],
      maintenance: ["procedure", "rule"],
      seasonal: ["property", "procedure"],
      benefits: ["property", "causal"],
      "getting-started": ["procedure", "property"],
      process: ["procedure", "property"],
      tools: ["property", "definition"],
      tips: ["rule", "property"],
      considerations: ["warning", "property"],
      evidence: ["property", "causal"],
    };

    return mapping[sectionType] || ["property"];
  }

  /**
   * Select rendering strategy based on subject model and intent
   */
  private selectRenderingStrategy(subjectModel: string, intent: string): string {
    // Knowledge Authoring Engine for high-confidence classifications
    if (["programming", "business", "gardening"].includes(subjectModel)) {
      return "knowledge-authoring-v1";
    }

    // Long article for educational content
    if (intent === "educate" || intent === "inform") {
      return "long-article-v2";
    }

    // Guide for practical content
    if (intent === "guide") {
      return "long-article";
    }

    // Default
    return "long-article";
  }

  /**
   * Extract subject from slug
   */
  private extractSubject(slug: string): string {
    return slug
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }
}

// Singleton instance
export const compositionPlanner = new CompositionPlanner();
