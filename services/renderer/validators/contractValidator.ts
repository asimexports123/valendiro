/**
 * Runtime Validator for Knowledge Authoring → Renderer Contract
 * 
 * Validates that the renderer receives all required properties before rendering.
 * Returns structured errors instead of throwing runtime exceptions.
 */

import type { RendererConfig, RenderDecision } from "../types";

export interface ValidationError {
  field: string;
  message: string;
  severity: "critical" | "warning";
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export class ContractValidator {
  /**
   * Validate renderer configuration before rendering
   */
  static validateRendererConfig(config: RendererConfig): ValidationResult {
    const errors: ValidationError[] = [];

    // Required field validation
    if (!config.slug) {
      errors.push({ field: "slug", message: "slug is required", severity: "critical" });
    }

    if (!config.rendererId) {
      errors.push({ field: "rendererId", message: "rendererId is required", severity: "critical" });
    }

    if (!config.category) {
      errors.push({ field: "category", message: "category is required", severity: "critical" });
    }

    if (!config.intent) {
      errors.push({ field: "intent", message: "intent is required", severity: "critical" });
    }

    if (!config.format) {
      errors.push({ field: "format", message: "format is required", severity: "warning" });
    }

    if (!Array.isArray(config.style)) {
      errors.push({ field: "style", message: "style must be an array", severity: "warning" });
    }

    return {
      valid: errors.filter(e => e.severity === "critical").length === 0,
      errors,
    };
  }

  /**
   * Validate render decision before rendering
   */
  static validateRenderDecision(decision: RenderDecision): ValidationResult {
    const errors: ValidationError[] = [];

    if (!decision.policy) {
      errors.push({ field: "policy", message: "policy is required", severity: "critical" });
    }

    if (!Array.isArray(decision.blockOrder)) {
      errors.push({ field: "blockOrder", message: "blockOrder must be an array", severity: "warning" });
    }

    if (!Array.isArray(decision.missingKnowledge)) {
      errors.push({ field: "missingKnowledge", message: "missingKnowledge must be an array", severity: "warning" });
    }

    return {
      valid: errors.filter(e => e.severity === "critical").length === 0,
      errors,
    };
  }

  /**
   * Validate that sections have content (actual structure from Knowledge Authoring Engine)
   */
  static validateSectionsWithContent(sections: any[]): ValidationResult {
    const errors: ValidationError[] = [];

    if (!Array.isArray(sections)) {
      errors.push({ field: "sections", message: "sections must be an array", severity: "critical" });
      return { valid: false, errors };
    }

    if (sections.length === 0) {
      errors.push({ field: "sections", message: "sections must contain at least one section", severity: "critical" });
      return { valid: false, errors };
    }

    sections.forEach((section, index) => {
      if (!section.content || typeof section.content !== 'string') {
        errors.push({ 
          field: `sections[${index}].content`, 
          message: `section ${index} must have content string`, 
          severity: "critical" 
        });
      } else if (section.content.trim().length === 0) {
        errors.push({ 
          field: `sections[${index}].content`, 
          message: `section ${index} has empty content`, 
          severity: "critical" 
        });
      }
    });

    return {
      valid: errors.filter(e => e.severity === "critical").length === 0,
      errors,
    };
  }

  /**
   * Validate complete authoring result before rendering
   */
  static validateAuthoringResult(authoringResult: any): ValidationResult {
    const errors: ValidationError[] = [];

    if (!authoringResult) {
      errors.push({ field: "authoringResult", message: "authoringResult is required", severity: "critical" });
      return { valid: false, errors };
    }

    if (!authoringResult.document) {
      errors.push({ field: "document", message: "document is required in authoring result", severity: "critical" });
      return { valid: false, errors };
    }

    if (!authoringResult.document.sections || !Array.isArray(authoringResult.document.sections)) {
      errors.push({ field: "document.sections", message: "document.sections must be an array", severity: "critical" });
      return { valid: false, errors };
    }

    if (authoringResult.document.sections.length === 0) {
      errors.push({ field: "document.sections", message: "document must contain at least one section", severity: "critical" });
    }

    // Validate that all sections have content (actual structure from Knowledge Authoring Engine)
    const sectionsValidation = this.validateSectionsWithContent(authoringResult.document.sections);
    errors.push(...sectionsValidation.errors);

    return {
      valid: errors.filter(e => e.severity === "critical").length === 0,
      errors,
    };
  }
}
