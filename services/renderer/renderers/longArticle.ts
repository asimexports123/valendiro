/**
 * Long Article Renderer — Reading Experience Engine
 *
 * Produces a Document Tree in long-form article format:
 * Title → Lead → ToC → Sections (with intros/transitions/outros) → Summary
 *
 * Pure function. No side effects. Deterministic.
 */

import type {
  DocumentNode,
  PluginFact,
  RendererConfig,
  RenderDecision,
  CitationInput,
  RelationshipInput,
  RenderStrategy,
  TableOfContentsNode,
  SummaryNode,
} from "../types";
import {
  extractSubject,
  renderSentence,
  getSectionIntro,
  getSectionOutro,
  getInterSectionTransition,
  selectTransition,
} from "../templates";
import { getPluginForFactType, renderGenericSection } from "../plugins";

export const LONG_ARTICLE_VERSION = "2.0.0";

export const longArticleStrategy: RenderStrategy = {
  name: "long-article",
  version: LONG_ARTICLE_VERSION,
  render: renderLongArticle,
};

export function renderLongArticle(
  facts: PluginFact[],
  citations: CitationInput[],
  relationships: RelationshipInput[],
  config: RendererConfig,
  decision: RenderDecision
): DocumentNode[] {
  const nodes: DocumentNode[] = [];
  const subject = extractSubject(config.slug);

  // ─── Title ─────────────────────────────────────────────────────────────────
  nodes.push({
    type: "heading",
    level: 1,
    text: subject,
    anchor: "title",
  });

  // ─── Lead Paragraph (concise, compelling summary) ──────────────────────────
  const definitionFacts = facts.filter((f) => f.factType === "definition");
  if (definitionFacts.length > 0) {
    // Use the first definition as the lead — short and direct
    const leadSentence = renderSentence(
      definitionFacts[0].statement, "definition", config.style, 0, config.slug
    );
    nodes.push({
      type: "paragraph",
      children: [leadSentence],
    });
  }

  // ─── Group Facts ───────────────────────────────────────────────────────────
  const factsByType: Record<string, PluginFact[]> = {};
  for (const fact of facts) {
    if (!factsByType[fact.factType]) factsByType[fact.factType] = [];
    factsByType[fact.factType].push(fact);
  }

  // ─── Compute Section Order ─────────────────────────────────────────────────
  const sectionOrder = decision.blockOrder
    .filter((bp) => factsByType[bp.sectionType] && factsByType[bp.sectionType].length >= bp.minFacts)
    .sort((a, b) => a.priority - b.priority);

  // Filter out definition (used in lead)
  const bodySections = sectionOrder.filter((bp) => bp.sectionType !== "definition");

  // ─── Table of Contents ─────────────────────────────────────────────────────
  if (bodySections.length >= 3) {
    const tocEntries = bodySections.map((bp, i) => {
      const plugin = getPluginForFactType(bp.sectionType);
      const anchor = getAnchorForType(bp.sectionType);
      const heading = getSectionHeadingText(bp.sectionType, subject, i, config.slug);
      return { text: heading, anchor, level: 2 };
    });
    // Add summary entry
    tocEntries.push({ text: "Key Takeaways", anchor: "summary", level: 2 });

    const toc: TableOfContentsNode = { type: "table-of-contents", entries: tocEntries };
    nodes.push(toc);
  }

  // ─── Body Sections with Transitions ────────────────────────────────────────
  let sectionIndex = 0;
  const renderedTypes = new Set<string>(["definition"]); // definition used in lead
  let previousType = "definition";

  for (const block of bodySections) {
    const sectionFacts = factsByType[block.sectionType];
    if (!sectionFacts || sectionFacts.length === 0) continue;
    if (renderedTypes.has(block.sectionType)) continue;

    // Inter-section transition
    if (sectionIndex > 0) {
      const transition = getInterSectionTransition(previousType, block.sectionType, sectionIndex, config.slug);
      if (transition) {
        nodes.push({ type: "paragraph", children: [transition] });
      }
    }

    // Section intro (for sections with 3+ facts)
    const plugin = getPluginForFactType(block.sectionType);
    const pluginConfig = {
      style: config.style,
      maxFacts: block.maxFacts,
      slug: config.slug,
      sectionIndex,
    };

    if (plugin) {
      const sectionNodes = plugin(sectionFacts, pluginConfig);

      // Insert section intro after heading (if section has 3+ facts)
      if (sectionFacts.length >= 3 && sectionNodes.length > 0) {
        const introText = getSectionIntro(block.sectionType, sectionIndex, config.slug);
        if (introText) {
          // Insert intro paragraph after the heading
          const headingIdx = sectionNodes.findIndex((n) => n.type === "heading");
          if (headingIdx >= 0) {
            sectionNodes.splice(headingIdx + 1, 0, {
              type: "paragraph",
              children: [introText],
            });
          }
        }
      }

      // Add section outro for substantial sections
      const outroText = getSectionOutro(block.sectionType, sectionFacts.length, sectionIndex, config.slug);
      if (outroText) {
        sectionNodes.push({ type: "paragraph", children: [outroText] });
      }

      nodes.push(...sectionNodes);
    } else {
      nodes.push(...renderGenericSection(sectionFacts, pluginConfig));
    }

    previousType = block.sectionType;
    renderedTypes.add(block.sectionType);
    sectionIndex++;
  }

  // Render remaining types not in block order
  for (const [factType, typeFacts] of Object.entries(factsByType)) {
    if (renderedTypes.has(factType)) continue;
    if (typeFacts.length === 0) continue;

    const plugin = getPluginForFactType(factType);
    const pluginConfig = {
      style: config.style,
      maxFacts: null,
      slug: config.slug,
      sectionIndex,
    };

    if (plugin) {
      nodes.push(...plugin(typeFacts, pluginConfig));
    } else {
      nodes.push(...renderGenericSection(typeFacts, pluginConfig));
    }
    sectionIndex++;
  }

  // ─── Summary Block ─────────────────────────────────────────────────────────
  if (facts.length >= 10) {
    const keyPoints = facts
      .filter((f) => f.confidence === "verified" || f.confidence === "high")
      .slice(0, 5)
      .map((f) => f.statement);

    if (keyPoints.length < 3) {
      // Fill with any facts if not enough high-confidence ones
      const additional = facts
        .filter((f) => !keyPoints.includes(f.statement))
        .slice(0, 5 - keyPoints.length)
        .map((f) => f.statement);
      keyPoints.push(...additional);
    }

    const closingSentence = `${subject} represents a topic with ${facts.length} verified facts across ${sectionIndex} distinct areas of knowledge.`;

    const summary: SummaryNode = {
      type: "summary",
      keyPoints: keyPoints.slice(0, 5),
      closingSentence,
    };
    nodes.push(summary);
  }

  // ─── Missing Knowledge Indicators ──────────────────────────────────────────
  for (const mk of decision.missingKnowledge) {
    if (mk.severity !== "optional") {
      nodes.push({
        type: "missing-knowledge",
        expectedFactType: mk.factType,
        sectionName: mk.sectionName,
        severity: mk.severity,
      });
    }
  }

  return nodes;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

import { getSectionHeading } from "../templates";

function getSectionHeadingText(factType: string, subject: string, index: number, slug: string): string {
  return getSectionHeading(factType, subject, index, slug);
}

function getAnchorForType(factType: string): string {
  const anchors: Record<string, string> = {
    property: "properties",
    historical: "history",
    procedural: "how-to",
    comparison: "comparisons",
    measurement: "statistics",
    warning: "warnings",
    causal: "causes",
    rule: "rules",
  };
  return anchors[factType] ?? factType;
}
