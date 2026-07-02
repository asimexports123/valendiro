/**
 * Plugin Registry — maps fact types to section renderers
 */

import type { DocumentNode, PluginFact, PluginConfig } from "../types";
import { renderDefinitionSection } from "./definitionPlugin";
import { renderPropertySection } from "./propertyPlugin";
import { renderHistorySection } from "./historyPlugin";
import { renderProcedureSection } from "./procedurePlugin";
import { renderWarningSection } from "./warningPlugin";
import { renderMeasurementSection } from "./measurementPlugin";
import { renderComparisonSection } from "./comparisonPlugin";

export type PluginRenderer = (facts: PluginFact[], config: PluginConfig) => DocumentNode[];

const PLUGIN_REGISTRY: Record<string, PluginRenderer> = {
  definition: renderDefinitionSection,
  property: renderPropertySection,
  historical: renderHistorySection,
  procedural: renderProcedureSection,
  warning: renderWarningSection,
  measurement: renderMeasurementSection,
  comparison: renderComparisonSection,
};

export function getPluginForFactType(factType: string): PluginRenderer | null {
  return PLUGIN_REGISTRY[factType] ?? null;
}

export function getRegisteredFactTypes(): string[] {
  return Object.keys(PLUGIN_REGISTRY);
}

// Generic fallback plugin for unregistered fact types
export function renderGenericSection(facts: PluginFact[], config: PluginConfig): DocumentNode[] {
  const nodes: DocumentNode[] = [];
  const heading = config.sectionIndex > 0
    ? facts[0]?.factType.charAt(0).toUpperCase() + facts[0]?.factType.slice(1)
    : "Additional Information";

  nodes.push({
    type: "heading",
    level: 2,
    text: heading,
    anchor: `section-${config.sectionIndex}`,
  });

  nodes.push({
    type: "list",
    ordered: false,
    items: facts.map((f) => ({
      type: "list-item" as const,
      children: [f.statement],
    })),
  });

  return nodes;
}
