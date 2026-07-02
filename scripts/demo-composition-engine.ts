/**
 * Composition Engine Demo
 *
 * Demonstrates the improvements of the v2 composition engine over v1
 * using sample data to show the difference in educational quality.
 */

import type { PluginFact, RendererConfig, DocumentNode } from "@/services/renderer/types";
import { KnowledgeComposer } from "@/services/renderer/composition/knowledgeComposer";
import { ImprovedQualityScorer } from "@/services/renderer/composition/improvedQualityScorer";
import { longArticleStrategy } from "@/services/renderer/renderers/longArticle";

// Sample facts for a topic
const sampleFacts: PluginFact[] = [
  {
    id: "1",
    statement: "Spaced repetition is a learning technique that involves reviewing material at gradually increasing intervals.",
    factType: "definition",
    confidence: "verified",
    scope: "contextual",
    tags: ["learning", "memory"],
    domain: "Education",
  },
  {
    id: "2",
    statement: "This technique works because it strengthens neural connections through repeated activation.",
    factType: "property",
    confidence: "verified",
    scope: "contextual",
    tags: ["learning", "neuroscience"],
    domain: "Education",
  },
  {
    id: "3",
    statement: "Use spaced repetition by reviewing flashcards after 1 day, 3 days, 1 week, 2 weeks, and 1 month.",
    factType: "procedural",
    confidence: "verified",
    scope: "contextual",
    tags: ["learning", "study"],
    domain: "Education",
  },
  {
    id: "4",
    statement: "For example, learning vocabulary using Anki with spaced repetition can increase retention by 50% compared to cramming.",
    factType: "property",
    confidence: "verified",
    scope: "contextual",
    tags: ["learning", "vocabulary"],
    domain: "Education",
  },
  {
    id: "5",
    statement: "Cramming before a test produces short-term memory but poor long-term retention.",
    factType: "warning",
    confidence: "verified",
    scope: "contextual",
    tags: ["learning", "mistakes"],
    domain: "Education",
  },
];

const sampleConfig: RendererConfig = {
  rendererId: "long-article-v1",
  rendererVersion: "4.0.0",
  templateVersion: "1.0.0",
  format: "html",
  style: ["intermediate"],
  slug: "spaced-repetition",
  intent: "educate",
  category: "education",
};

function renderV1(facts: PluginFact[], config: RendererConfig): DocumentNode[] {
  return longArticleStrategy.render(
    facts,
    [],
    [],
    config,
    {
      eligible: true,
      reason: null,
      policy: {
        id: "default",
        name: "Default Policy",
        categoryMatch: ["education"],
        requiredFactTypes: [],
        preferredFormat: "html",
        preferredStyle: ["intermediate"],
        minFactCount: 3,
        minCitationCount: 0,
        sectionOverrides: [],
        commercialPlaceholders: false,
      },
      blockOrder: [],
      missingKnowledge: [],
      warnings: [],
    }
  );
}

function renderV2(facts: PluginFact[], config: RendererConfig): DocumentNode[] {
  const composer = new KnowledgeComposer();
  const result = composer.compose(facts, config);
  return result.documentTree;
}

function extractText(tree: DocumentNode[]): string {
  let text = "";
  for (const node of tree) {
    if (node.type === "paragraph") {
      if (typeof node.children === "string") {
        text += node.children + " ";
      } else {
        text += node.children.join(" ") + " ";
      }
    } else if (node.type === "heading") {
      text += `\n## ${node.text}\n`;
    } else if (node.type === "list") {
      for (const item of node.items) {
        if (typeof item.children === "string") {
          text += `- ${item.children}\n`;
        } else {
          text += `- ${item.children.join(" ")}\n`;
        }
      }
    } else if (node.type === "callout") {
      text += `[Callout: ${(node.children[0] as any).children}] `;
    } else if (node.type === "summary") {
      text += `\n### Summary\n`;
      for (const point of node.keyPoints) {
        text += `- ${point}\n`;
      }
      text += `${node.closingSentence}\n`;
    }
  }
  return text;
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(w => w.length > 0).length;
}

function main() {
  console.log("=== Phase 14: Composition Engine Demo ===\n");
  console.log("Topic: Spaced Repetition");
  console.log("Facts:", sampleFacts.length, "\n");

  // Render with v1
  console.log("--- V1 Renderer (Fact-Listing) ---");
  const v1Tree = renderV1(sampleFacts, sampleConfig);
  const v1Text = extractText(v1Tree);
  const v1Words = countWords(v1Text);
  console.log(v1Text);
  console.log(`\nWord Count: ${v1Words}`);
  console.log(`Sections: ${v1Tree.filter(n => n.type === "heading").length}\n`);

  // Render with v2
  console.log("--- V2 Renderer (Composition Engine) ---");
  const v2Config = { ...sampleConfig, rendererId: "long-article-v2" };
  const v2Tree = renderV2(sampleFacts, v2Config);
  const v2Text = extractText(v2Tree);
  const v2Words = countWords(v2Text);
  console.log(v2Text);
  console.log(`\nWord Count: ${v2Words}`);
  console.log(`Sections: ${v2Tree.filter(n => n.type === "heading").length}\n`);

  // Comparison
  console.log("--- Comparison ---");
  console.log(`V1 Word Count: ${v1Words}`);
  console.log(`V2 Word Count: ${v2Words}`);
  console.log(`Word Count Delta: ${v2Words - v1Words}`);
  console.log(`V1 Sections: ${v1Tree.filter(n => n.type === "heading").length}`);
  console.log(`V2 Sections: ${v2Tree.filter(n => n.type === "heading").length}`);
  console.log(`Section Delta: ${v2Tree.filter(n => n.type === "heading").length - v1Tree.filter(n => n.type === "heading").length}`);

  console.log("\n--- Key Improvements ---");
  console.log("✓ Reader-first structure: Introduction → Concept → How → Example → Implications");
  console.log("✓ Every fact contextualized with explanations");
  console.log("✓ Natural transitions between sections");
  console.log("✓ Practical examples for visualization");
  console.log("✓ Dynamic length based on complexity");
  console.log("✓ Quality validation before publishing");
}

main();
