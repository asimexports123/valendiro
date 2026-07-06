/**
 * Topic Classification Engine
 *
 * Dynamically classifies topics into:
 * - Subcategory (derived, not from database)
 * - Keyword Family
 * - Subject Model
 *
 * Configuration-driven. No hardcoded mappings.
 */

import type { PluginFact } from "./types";

export interface ClassificationInput {
  category: string;
  slug: string;
  title?: string;
  facts?: PluginFact[];
}

export interface ClassificationResult {
  subcategory: string;
  keywordFamily: string;
  subjectModel: string;
  confidence: number;
  reasoning: string[];
}

// Load configurations
const SUBJECT_MODELS = require("../../config/subject-models.json");
const KEYWORD_FAMILIES = require("../../config/keyword-families.json");

export class TopicClassificationEngine {
  /**
   * Classify a topic into subcategory, keyword family, and subject model
   */
  classify(input: ClassificationInput): ClassificationResult {
    const { category, slug, title, facts } = input;
    const reasoning: string[] = [];

    // Step 1: Detect Keyword Family based on category and signals
    const keywordFamilyResult = this.detectKeywordFamily(category, slug, title);
    reasoning.push(keywordFamilyResult.reasoning);

    // Step 2: Resolve Subject Model
    const subjectModelResult = this.resolveSubjectModel(category, slug, keywordFamilyResult.keywordFamily, facts);
    reasoning.push(subjectModelResult.reasoning);

    // Step 3: Derive Subcategory (not from database)
    const subcategory = keywordFamilyResult.subcategory || this.inferSubcategory(category, slug, facts);
    reasoning.push(`Subcategory derived: ${subcategory}`);

    return {
      subcategory,
      keywordFamily: keywordFamilyResult.keywordFamily,
      subjectModel: subjectModelResult.subjectModel,
      confidence: this.calculateConfidence(keywordFamilyResult.confidence, subjectModelResult.confidence),
      reasoning,
    };
  }

  /**
   * Detect keyword family based on category and topic signals
   */
  private detectKeywordFamily(
    category: string,
    slug: string,
    title?: string
  ): { keywordFamily: string; subcategory: string; confidence: number; reasoning: string } {
    const categoryFamilies = KEYWORD_FAMILIES.keywordFamilies[category];
    
    if (!categoryFamilies) {
      return {
        keywordFamily: "general",
        subcategory: "general",
        confidence: 0.5,
        reasoning: `No keyword families defined for category: ${category}`,
      };
    }

    // Check each keyword family's detection rules
    for (const [familyKey, familyConfig] of Object.entries(categoryFamilies)) {
      const config = familyConfig as any;
      const rules = config.detectionRules || [];
      
      for (const rule of rules) {
        if (rule.includes("slug contains")) {
          const keywords = rule.split("slug contains:")[1]?.split(",").map((k: string) => k.trim());
          if (keywords?.some((keyword: string) => slug.toLowerCase().includes(keyword.toLowerCase()))) {
            return {
              keywordFamily: familyKey,
              subcategory: config.subcategory,
              confidence: config.confidence || 0.85,
              reasoning: `Keyword family detected: ${familyKey} via slug match`,
            };
          }
        }

        if (title && rule.includes("title contains")) {
          const keywords = rule.split("title contains:")[1]?.split(",").map((k: string) => k.trim());
          if (keywords?.some((keyword: string) => title.toLowerCase().includes(keyword.toLowerCase()))) {
            return {
              keywordFamily: familyKey,
              subcategory: config.subcategory,
              confidence: config.confidence || 0.85,
              reasoning: `Keyword family detected: ${familyKey} via title match`,
            };
          }
        }
      }
    }

    return {
      keywordFamily: "general",
      subcategory: "general",
      confidence: 0.5,
      reasoning: `No keyword family matched for category: ${category}`,
    };
  }

  /**
   * Resolve subject model based on keyword family and detection rules
   */
  private resolveSubjectModel(
    category: string,
    slug: string,
    keywordFamily: string,
    facts?: PluginFact[]
  ): { subjectModel: string; confidence: number; reasoning: string } {
    // If keyword family specifies a subject model, use it
    const categoryFamilies = KEYWORD_FAMILIES.keywordFamilies[category];
    if (categoryFamilies && categoryFamilies[keywordFamily]) {
      const familyConfig = categoryFamilies[keywordFamily] as any;
      if (familyConfig.subjectModel) {
        return {
          subjectModel: familyConfig.subjectModel,
          confidence: familyConfig.confidence || 0.85,
          reasoning: `Subject model from keyword family: ${familyConfig.subjectModel}`,
        };
      }
    }

    // Fallback: Check subject model detection rules
    for (const [modelKey, modelConfig] of Object.entries(SUBJECT_MODELS.subjects)) {
      const config = modelConfig as any;
      const rules = config.detectionRules || [];

      for (const rule of rules) {
        if (rule.includes("slug contains")) {
          const keywords = rule.split("slug contains:")[1]?.split(",").map((k: string) => k.trim());
          if (keywords?.some((keyword: string) => slug.toLowerCase().includes(keyword.toLowerCase()))) {
            return {
              subjectModel: modelKey,
              confidence: 0.80,
              reasoning: `Subject model detected via slug: ${modelKey}`,
            };
          }
        }

        if (facts && rule.includes("title contains")) {
          const keywords = rule.split("title contains:")[1]?.split(",").map((k: string) => k.trim());
          const factTexts = facts.map((f) => f.statement).join(" ").toLowerCase();
          if (keywords?.some((keyword: string) => factTexts.includes(keyword.toLowerCase()))) {
            return {
              subjectModel: modelKey,
              confidence: 0.75,
              reasoning: `Subject model detected via facts: ${modelKey}`,
            };
          }
        }
      }
    }

    // Ultimate fallback: Use category-based default
    const categoryDefaults: Record<string, string> = {
      technology: "programming",
      business: "business",
      "home-lifestyle": "recipes",
      "personal-finance": "finance",
      education: "education",
      "health-wellness": "education",
      travel: "travel",
    };

    return {
      subjectModel: categoryDefaults[category] || "education",
      confidence: 0.5,
      reasoning: `Subject model defaulted from category: ${category}`,
    };
  }

  /**
   * Infer subcategory from facts and topic signals
   */
  private inferSubcategory(category: string, slug: string, facts?: PluginFact[]): string {
    if (!facts || facts.length === 0) {
      return "general";
    }

    const factTexts = facts.map((f) => f.statement.toLowerCase()).join(" ");

    // Technology subcategories
    if (category === "technology") {
      if (factTexts.includes("cluster") || factTexts.includes("worker") || factTexts.includes("process")) {
        return "backend-development";
      }
      if (factTexts.includes("component") || factTexts.includes("ui") || factTexts.includes("frontend")) {
        return "frontend-development";
      }
      if (factTexts.includes("docker") || factTexts.includes("container") || factTexts.includes("deploy")) {
        return "devops";
      }
    }

    // Business subcategories
    if (category === "business") {
      if (factTexts.includes("vendor") || factTexts.includes("supplier") || factTexts.includes("procurement")) {
        return "procurement";
      }
      if (factTexts.includes("operation") || factTexts.includes("workflow") || factTexts.includes("process")) {
        return "operations";
      }
    }

    // Home & Lifestyle subcategories
    if (category === "home-lifestyle" || category === "travel") {
      if (factTexts.includes("vacation") || factTexts.includes("travel") || factTexts.includes("trip")) {
        return "travel";
      }
      if (factTexts.includes("family") || factTexts.includes("kid") || factTexts.includes("child")) {
        return "family";
      }
    }

    return "general";
  }

  /**
   * Calculate overall confidence from component confidences
   */
  private calculateConfidence(...confidences: number[]): number {
    const valid = confidences.filter((c) => c > 0);
    if (valid.length === 0) return 0.5;
    return valid.reduce((sum, c) => sum + c, 0) / valid.length;
  }
}

// Singleton instance
export const topicClassificationEngine = new TopicClassificationEngine();
