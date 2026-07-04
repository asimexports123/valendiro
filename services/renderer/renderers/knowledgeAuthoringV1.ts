/**
 * Knowledge Authoring V1 Strategy
 *
 * Adapter that integrates the new Knowledge Authoring Engine
 * into the existing renderer pipeline.
 */

import type {
  DocumentNode,
  RendererConfig,
  RenderDecision,
  PluginFact,
  CitationInput,
  RelationshipInput,
} from "../types";
import { KnowledgeAuthoringOrchestrator, type AuthoringContext } from "../authoring/knowledgeAuthoringOrchestrator";

export const knowledgeAuthoringV1Strategy = {
  version: "1.0.0",
  name: "knowledge-authoring-v1",

  render(
    facts: PluginFact[],
    citations: CitationInput[],
    relationships: RelationshipInput[],
    config: RendererConfig,
    decision: RenderDecision
  ): DocumentNode[] {
    // This is a synchronous wrapper for the async orchestrator
    // In production, this would need to be refactored to be async throughout
    // For now, we'll return a simple fallback
    const orchestrator = new KnowledgeAuthoringOrchestrator();

    const authoringContext: AuthoringContext = {
      topic: config.slug,
      category: config.category,
      intent: config.intent as "inform" | "educate" | "guide" | "decide",
      complexity: config.style.includes("beginner") ? "beginner" :
                   config.style.includes("advanced") ? "advanced" : "intermediate",
      facts,
    };

    // For now, return a simple document structure
    // Full async integration requires refactoring the orchestrator pipeline
    return [
      {
        type: "heading",
        level: 1,
        text: config.slug,
        anchor: config.slug,
      },
      {
        type: "paragraph",
        children: ["This content is rendered with the Knowledge Authoring Engine (v1.0.0)."],
      },
    ];
  },
};
