/**
 * Long Article Renderer — Intent-Aware Knowledge Compositor
 *
 * Philosophy: deliver maximum value to the reader, not word count.
 *
 * Every page has a job: inform, educate, guide, or help decisions.
 * The category determines which templates, headings, and prose style to use.
 * Facts are raw material. The composition policy is the blueprint.
 *
 * No generic filler. No repeated facts. No debug output.
 * Every paragraph must contribute: information, explanation, context,
 * guidance, example, or decision support.
 */

import type {
  DocumentNode,
  PluginFact,
  RendererConfig,
  RenderDecision,
  CitationInput,
  RelationshipInput,
  RenderStrategy,
  SummaryNode,
} from "../types";
import { extractSubject, hashCode } from "../templates";
import { getCompositionPolicy, type CompositionPolicy } from "../compositionPolicy";

export const LONG_ARTICLE_VERSION = "4.0.0";

export const longArticleStrategy: RenderStrategy = {
  name: "long-article",
  version: LONG_ARTICLE_VERSION,
  render: renderLongArticle,
};

// ─── Utilities ────────────────────────────────────────────────────────────────

function pick<T>(arr: T[], seed: string): T {
  const i = Math.abs(hashCode(seed)) % arr.length;
  return arr[i];
}

// ─── Fact Sanitizer ──────────────────────────────────────────────────────────
// Drop junk: source-title stubs, sentence fragments, exact duplicates.
// Never inflate — only keep facts that carry real information.

const VERB_RE = /\b(is|are|was|were|has|have|had|do|does|did|will|can|could|would|should|must|may|might|provides?|uses?|allows?|enables?|helps?|creates?|defines?|describes?|represents?|supports?|contains?|consists?|gives?|makes?|refers?|reads?|removes?|replaces?|applies?|selects?|groups?|combines?|measures?|estimates?|determines?|demonstrates?|deploys?|requires?|reduces?|improves?|stores?|runs?|arranges?|finds?|executes?|processes?|divides?|partitions?|reuses?|links?|models?|identifies?|ensures?|includes?|emphasizes?|isolates?|manages?|handles?|performs?|operates?|implements?|extends?|inherits?|exports?|imports?|installs?|configures?|initializes?|renders?|generates?|fetches?|returns?|accepts?|rejects?|validates?|converts?|maps?|filters?|sorts?|merges?|splits?|wraps?|exposes?|hides?|tracks?|logs?|caches?|indexes?|queries?|inserts?|updates?|deletes?|affects?|involves?|requires?|produces?|develops?|builds?|achieves?|delivers?|drives?|grows?|increases?|decreases?|prevents?|reduces?|eliminates?|treats?|causes?|leads?)\b/i;

function sanitizeFacts(facts: PluginFact[]): PluginFact[] {
  const seen = new Set<string>();
  return facts.filter((f) => {
    const s = f.statement.trim();
    const wordCount = s.split(/\s+/).length;
    if (wordCount <= 4) return false;
    if (wordCount <= 6 && !VERB_RE.test(s)) return false;
    const key = s.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─── Why-it-matters openers (intent-aware) ───────────────────────────────────
// Each intent has its own "why this matters" framing.

const WHY_MATTERS: Record<string, string[]> = {
  inform: [
    "Having an accurate understanding of this is important before exploring the details.",
    "This distinction matters for anyone working with or learning about this topic.",
    "Getting this definition right prevents misunderstandings that compound later.",
    "This is the reference point for everything else covered on this page.",
  ],
  educate: [
    "Understanding this distinction is essential before exploring more advanced aspects of the topic.",
    "This foundational idea underpins nearly every practical application you will encounter.",
    "Grasping this early prevents the most common mistakes practitioners make.",
    "This is the conceptual anchor for everything else in this subject.",
    "Without this grounding, the practical techniques that follow are harder to apply correctly.",
  ],
  guide: [
    "Knowing this clearly up front makes the practical steps much easier to follow.",
    "This is the foundation for the approach covered in this guide.",
    "Getting this right at the start prevents the most common problems later.",
    "Understanding this is the prerequisite for applying the guidance that follows.",
  ],
  decide: [
    "This distinction is central to making an informed choice on this topic.",
    "Understanding this clearly is what separates good decisions from poor ones here.",
    "This framing helps cut through the noise when comparing your options.",
    "This is the core concept that the decision framework on this page is built around.",
  ],
};

// ─── Section Renderers ───────────────────────────────────────────────────────
// All prose templates come from the policy — renderers are format-only.

function renderDefinitions(
  facts: PluginFact[],
  slug: string,
  policy: CompositionPolicy
): DocumentNode[] {
  const nodes: DocumentNode[] = [];
  const subject = extractSubject(slug);
  const intent = policy.intent;

  nodes.push({
    type: "heading", level: 2,
    text: `${policy.primaryHeadingLabel} ${subject}?`,
    anchor: "overview",
  });

  if (facts.length === 0) return nodes;

  // Lead paragraph: opener + first definition + intent-appropriate why-it-matters
  const rawFirst = facts[0].statement.replace(/\.$/, "");
  const firstWord = subject.split(" ")[0].toLowerCase();
  const stmtFirstWord = rawFirst.trim().split(/\s+/)[0].toLowerCase().replace(/[^a-z]/g, "");

  let firstSentence: string;
  if (stmtFirstWord === firstWord) {
    const spaceIdx = rawFirst.indexOf(" ");
    firstSentence = spaceIdx > 0
      ? `**${rawFirst.slice(0, spaceIdx)}**${rawFirst.slice(spaceIdx)}.`
      : `**${rawFirst}**.`;
  } else {
    const opener = pick(policy.definitionOpeners, `${slug}:def-open`)(subject);
    firstSentence = `${opener} ${rawFirst.charAt(0).toLowerCase() + rawFirst.slice(1)}.`;
  }

  const whyPool = WHY_MATTERS[intent] ?? WHY_MATTERS.educate;
  const why = pick(whyPool, `${slug}:why-0`);
  nodes.push({ type: "paragraph", children: [`${firstSentence} ${why}`] });

  // Remaining definitions: 2 per paragraph, woven with connectors
  const rest = facts.slice(1);
  for (let i = 0; i < rest.length; i += 2) {
    const group = rest.slice(i, i + 2);
    const sentences = group.map((f, j) => {
      const s = f.statement.replace(/\.$/, "");
      if (j === 0) return `${s}.`;
      const conn = pick(policy.factConnectors, `${slug}:def-conn:${i + j}`);
      return `${conn} ${s.charAt(0).toLowerCase() + s.slice(1)}.`;
    });
    nodes.push({ type: "paragraph", children: [sentences.join(" ")] });
  }

  return nodes;
}

function renderProperties(
  facts: PluginFact[],
  slug: string,
  policy: CompositionPolicy
): DocumentNode[] {
  const nodes: DocumentNode[] = [];

  nodes.push({
    type: "heading", level: 2,
    text: policy.characteristicsLabel,
    anchor: "characteristics",
  });

  if (facts.length >= 2) {
    const lead = pick(policy.propertyLeads, `${slug}:prop-lead`);
    nodes.push({ type: "paragraph", children: [lead] });
  }

  for (let i = 0; i < facts.length; i += 3) {
    const group = facts.slice(i, i + 3);
    const parts = group.map((f, j) => {
      const s = f.statement.replace(/\.$/, "");
      if (j === 0) return `${s}.`;
      const conn = pick(policy.factConnectors, `${slug}:prop-conn:${i + j}`);
      return `${conn} ${s.charAt(0).toLowerCase() + s.slice(1)}.`;
    });
    nodes.push({ type: "paragraph", children: [parts.join(" ")] });
  }

  return nodes;
}

function renderHistory(
  facts: PluginFact[],
  slug: string,
  policy: CompositionPolicy
): DocumentNode[] {
  const nodes: DocumentNode[] = [];

  nodes.push({
    type: "heading", level: 2,
    text: policy.historyLabel,
    anchor: "history",
  });

  for (let i = 0; i < facts.length; i += 3) {
    const group = facts.slice(i, i + 3);
    const parts = group.map((f, j) => {
      const s = f.statement.replace(/\.$/, "");
      if (j === 0) return `${s}.`;
      const bridge = pick(policy.historyBridges, `${slug}:hist-br:${i + j}`);
      return `${bridge} ${s.charAt(0).toLowerCase() + s.slice(1)}.`;
    });
    nodes.push({ type: "paragraph", children: [parts.join(" ")] });
  }

  return nodes;
}

function renderProcedures(
  facts: PluginFact[],
  slug: string,
  policy: CompositionPolicy
): DocumentNode[] {
  const nodes: DocumentNode[] = [];

  nodes.push({
    type: "heading", level: 2,
    text: policy.practicalLabel,
    anchor: "how-to",
  });

  // Guide/decide intent: numbered steps. Educate/inform: prose list.
  if (policy.intent === "guide" || policy.intent === "decide") {
    nodes.push({
      type: "list",
      ordered: true,
      items: facts.map((f) => ({
        type: "list-item" as const,
        children: [f.statement.replace(/\.$/, "") + "."],
      })),
    });
  } else {
    const parts = facts.map((f, j) => {
      const s = f.statement.replace(/\.$/, "");
      if (j === 0) return `${s}.`;
      const conn = pick(policy.factConnectors, `${slug}:proc-conn:${j}`);
      return `${conn} ${s.charAt(0).toLowerCase() + s.slice(1)}.`;
    });
    nodes.push({ type: "paragraph", children: [parts.join(" ")] });
  }

  return nodes;
}

function renderComparisons(
  facts: PluginFact[],
  slug: string,
  policy: CompositionPolicy
): DocumentNode[] {
  const nodes: DocumentNode[] = [];

  nodes.push({
    type: "heading", level: 2,
    text: policy.comparisonLabel,
    anchor: "comparisons",
  });

  const contrastConnectors = [
    "In contrast,", "Similarly,", "On the other hand,",
    "Unlike alternatives,", "By comparison,", "Where this differs is that",
  ];
  const parts = facts.map((f, j) => {
    const s = f.statement.replace(/\.$/, "");
    if (j === 0) return `${s}.`;
    const conn = pick(contrastConnectors, `${slug}:comp:${j}`);
    return `${conn} ${s.charAt(0).toLowerCase() + s.slice(1)}.`;
  });
  nodes.push({ type: "paragraph", children: [parts.join(" ")] });

  return nodes;
}

function renderWarnings(
  facts: PluginFact[],
  slug: string,
  policy: CompositionPolicy
): DocumentNode[] {
  const nodes: DocumentNode[] = [];

  nodes.push({
    type: "heading", level: 2,
    text: policy.warningLabel,
    anchor: "pitfalls",
  });

  for (const fact of facts) {
    nodes.push({
      type: "callout",
      variant: "warning",
      title: null,
      children: [{ type: "paragraph", children: [fact.statement.replace(/\.$/, "") + "."] }],
    });
  }

  return nodes;
}

function renderRules(
  facts: PluginFact[],
  slug: string,
  policy: CompositionPolicy
): DocumentNode[] {
  const nodes: DocumentNode[] = [];

  nodes.push({
    type: "heading", level: 2,
    text: policy.ruleLabel,
    anchor: "principles",
  });

  // Rules render as callout tips — they are actionable truths, not prose
  for (const fact of facts) {
    nodes.push({
      type: "callout",
      variant: "tip",
      title: null,
      children: [{ type: "paragraph", children: [fact.statement.replace(/\.$/, "") + "."] }],
    });
  }

  return nodes;
}

function renderMeasurements(
  facts: PluginFact[],
  slug: string,
  policy: CompositionPolicy
): DocumentNode[] {
  const nodes: DocumentNode[] = [];

  nodes.push({
    type: "heading", level: 2,
    text: "By the Numbers",
    anchor: "statistics",
  });

  const numConnectors = ["Additionally,", "The data also shows that", "Furthermore,", "Worth noting,"];
  const parts = facts.map((f, j) => {
    const s = f.statement.replace(/\.$/, "");
    if (j === 0) return `${s}.`;
    const conn = pick(numConnectors, `${slug}:meas:${j}`);
    return `${conn} ${s.charAt(0).toLowerCase() + s.slice(1)}.`;
  });
  nodes.push({ type: "paragraph", children: [parts.join(" ")] });

  return nodes;
}

// ─── Main Renderer ────────────────────────────────────────────────────────────

export function renderLongArticle(
  rawFacts: PluginFact[],
  citations: CitationInput[],
  relationships: RelationshipInput[],
  config: RendererConfig,
  decision: RenderDecision
): DocumentNode[] {
  const nodes: DocumentNode[] = [];
  const subject = extractSubject(config.slug);

  // ─── Resolve composition policy ──────────────────────────────────────────
  const policy = getCompositionPolicy(config.category ?? "");

  // ─── Sanitize facts ──────────────────────────────────────────────────────
  const facts = sanitizeFacts(rawFacts);

  // ─── Title ───────────────────────────────────────────────────────────────
  nodes.push({ type: "heading", level: 1, text: subject, anchor: "title" });

  // ─── Group by fact type ──────────────────────────────────────────────────
  const byType: Record<string, PluginFact[]> = {};
  for (const f of facts) {
    if (!byType[f.factType]) byType[f.factType] = [];
    byType[f.factType].push(f);
  }

  // ─── Render sections in policy-defined order ─────────────────────────────
  let prevType = "";

  for (const type of policy.sectionOrder) {
    const typeFacts = byType[type];
    if (!typeFacts || typeFacts.length === 0) continue;

    // Policy-defined transition sentence between sections
    if (prevType) {
      const trans = policy.sectionTransitions[prevType]?.[type] ?? "";
      if (trans) nodes.push({ type: "paragraph", children: [trans] });
    }

    let sectionNodes: DocumentNode[] = [];
    if (type === "definition")  sectionNodes = renderDefinitions(typeFacts, config.slug, policy);
    else if (type === "property")   sectionNodes = renderProperties(typeFacts, config.slug, policy);
    else if (type === "historical") sectionNodes = renderHistory(typeFacts, config.slug, policy);
    else if (type === "procedural") sectionNodes = renderProcedures(typeFacts, config.slug, policy);
    else if (type === "comparison") sectionNodes = renderComparisons(typeFacts, config.slug, policy);
    else if (type === "warning")    sectionNodes = renderWarnings(typeFacts, config.slug, policy);
    else if (type === "rule")       sectionNodes = renderRules(typeFacts, config.slug, policy);
    else if (type === "measurement") sectionNodes = renderMeasurements(typeFacts, config.slug, policy);
    else {
      // causal / any unrecognised type — prose fallback
      const parts = typeFacts.map((f) => f.statement.replace(/\.$/, "") + ".").join(" ");
      sectionNodes = [
        { type: "heading", level: 2, text: type.charAt(0).toUpperCase() + type.slice(1), anchor: type },
        { type: "paragraph", children: [parts] },
      ];
    }

    nodes.push(...sectionNodes);
    prevType = type;
  }

  // ─── Summary ─────────────────────────────────────────────────────────────
  // Key takeaways + reader outcome — what the reader should now feel/know.
  if (facts.length >= 5) {
    const ranked = [...facts].sort((a, b) => {
      const order: Record<string, number> = { verified: 0, high: 1, medium: 2, low: 3 };
      return (order[a.confidence] ?? 4) - (order[b.confidence] ?? 4);
    });

    const keyPoints = ranked.slice(0, 5).map((f) => f.statement.replace(/\.$/, "") + ".");
    const summary: SummaryNode = {
      type: "summary",
      keyPoints,
      closingSentence: policy.summaryCloser(subject),
    };
    nodes.push(summary);
  }

  return nodes;
}
