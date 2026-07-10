/**
 * Narrative Ordering Layer — lightweight pedagogical reorder before render (no LLM).
 *
 * Not a new engine: orders existing theses so readers learn NEXT, not highest-score first.
 * Sequence: What → Why → How → Concepts → Applications → Mistakes → Summary
 */

import type { ParagraphThesis } from "./brainReasoning";
import type { UnderstoodClaim } from "./brainUnderstanding";
import { inferJourneyStage, type JourneyStage } from "./brainDiscoursePlanner";
import type { FactKind } from "./languageSystem/types";

const STOP = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "of",
  "to",
  "in",
  "on",
  "for",
  "with",
  "from",
  "that",
  "this",
  "these",
  "those",
  "is",
  "are",
  "was",
  "were",
  "be",
  "as",
  "by",
  "it",
  "its",
  "into",
  "than",
  "then",
  "when",
  "where",
  "which",
  "who",
  "what",
  "how",
  "why",
  "can",
  "may",
  "also",
  "such",
  "other",
  "more",
  "most",
  "some",
  "any",
  "not",
  "only",
  "over",
  "under",
  "between",
  "through",
  "during",
  "before",
  "after",
  "about",
  "again",
  "further",
  "once",
  "here",
  "there",
  "all",
  "each",
  "few",
  "own",
  "same",
  "so",
  "too",
  "very",
  "just",
  "because",
  "while",
  "used",
  "using",
  "use",
  "make",
  "makes",
  "made",
  "like",
  "one",
  "two",
  "many",
  "much",
  "people",
  "person",
  "reader",
  "readers",
]);

/** Pedagogical section order (CEO narrative sequence). */
export const NARRATIVE_SECTION_ORDER = [
  "overview",
  "why",
  "how",
  "keyConcepts",
  "practical",
  "mistakes",
  "summary",
] as const;

const STAGE_ORDER: JourneyStage[] = [
  "definition",
  "why_it_matters",
  "how_it_works",
  "core_ideas",
  "examples",
  "applications",
  "benefits",
  "limitations",
  "mistakes",
  "summary",
];

function stageRank(stage: JourneyStage): number {
  const i = STAGE_ORDER.indexOf(stage);
  return i >= 0 ? i : 35;
}

function kindOf(thesis: ParagraphThesis): FactKind {
  return thesis.sectionKind ?? "property";
}

function primaryClaim(thesis: ParagraphThesis): UnderstoodClaim | undefined {
  return thesis.claims[0];
}

/** Infer narrative stage from thesis + section (generic, not topic-specific). */
export function narrativeStageFor(thesis: ParagraphThesis, sectionId: string): JourneyStage {
  if (sectionId === "why") return "why_it_matters";
  if (sectionId === "how") return "how_it_works";
  if (sectionId === "overview") return "definition";
  if (sectionId === "practical") return "applications";
  if (sectionId === "mistakes") return "mistakes";
  if (sectionId === "summary") return "summary";
  const claim = primaryClaim(thesis);
  if (!claim) return "core_ideas";
  return inferJourneyStage(claim, kindOf(thesis), sectionId);
}

function extractTerms(text: string): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOP.has(w));
  const multi: string[] = [];
  const tokens = text
    .replace(/[^a-zA-Z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  for (let i = 0; i < tokens.length - 1; i++) {
    const a = tokens[i].toLowerCase();
    const b = tokens[i + 1].toLowerCase();
    if (a.length > 2 && b.length > 2 && !STOP.has(a) && !STOP.has(b)) {
      multi.push(`${a} ${b}`);
    }
  }
  return [...new Set([...multi, ...words])];
}

function introducedTerms(thesis: ParagraphThesis): string[] {
  const claim = primaryClaim(thesis);
  if (!claim) return extractTerms(thesis.centralIdea);
  const subj = claim.subject?.trim().toLowerCase();
  const fromAssert = extractTerms(claim.assertion || claim.sourceFact || "");
  if (subj && subj.length > 2 && !STOP.has(subj)) {
    return [...new Set([subj, ...fromAssert.slice(0, 6)])];
  }
  return fromAssert.slice(0, 8);
}

function referencedTerms(thesis: ParagraphThesis): string[] {
  const claim = primaryClaim(thesis);
  const blob = [thesis.centralIdea, claim?.assertion, claim?.object, claim?.sourceFact]
    .filter(Boolean)
    .join(" ");
  return extractTerms(blob);
}

function isExampleThesis(thesis: ParagraphThesis): boolean {
  const fact = primaryClaim(thesis)?.sourceFact ?? thesis.mainIdea;
  return /\b(such as|for example|e\.g\.|including|includes)\b/i.test(fact);
}

function isWhyShaped(fact: string): boolean {
  return /\b(because|matters|purpose|exists to|solves|helps|enables|allows|reason|benefit|important|need for|designed to)\b/i.test(
    fact
  );
}

function isHowShaped(fact: string): boolean {
  return /\b(works by|works when|process|mechanism|step|first |then |through|by using|algorithm|pipeline|flow|operates|composed of|consists of|made of)\b/i.test(
    fact
  );
}

export function classifyFactNarrativeRole(
  fact: string
): "why" | "how" | "example" | "other" {
  if (/\b(such as|for example|e\.g\.|including)\b/i.test(fact)) return "example";
  if (isWhyShaped(fact)) return "why";
  if (isHowShaped(fact)) return "how";
  return "other";
}

/**
 * Build concept dependency edges: B depends on A when B references A's subject,
 * or claim relation is "requires". Sparse on purpose — false edges destroy order.
 */
export function buildConceptDependencies(
  theses: ParagraphThesis[]
): Array<{ from: number; to: number }> {
  const edges: Array<{ from: number; to: number }> = [];

  for (let b = 0; b < theses.length; b++) {
    const bClaim = primaryClaim(theses[b]);
    const bText = `${bClaim?.assertion ?? ""} ${bClaim?.sourceFact ?? ""} ${theses[b].mainIdea}`.toLowerCase();

    if (bClaim?.relation === "requires" && bClaim.object) {
      const need = bClaim.object.toLowerCase();
      for (let a = 0; a < theses.length; a++) {
        if (a === b) continue;
        const aSubj = (primaryClaim(theses[a])?.subject ?? "").toLowerCase();
        if (aSubj.length > 3 && (need.includes(aSubj) || aSubj.includes(need))) {
          edges.push({ from: a, to: b });
        }
      }
    }

    for (let a = 0; a < theses.length; a++) {
      if (a === b) continue;
      const aClaim = primaryClaim(theses[a]);
      const aSubj = (aClaim?.subject ?? "").toLowerCase().trim();
      if (aSubj.length < 4) continue;
      const aDefines =
        theses[a].sectionKind === "definition" ||
        aClaim?.relation === "defines" ||
        /\b(is a|is an|means|refers to)\b/i.test(aClaim?.assertion ?? "");
      if (!aDefines) continue;
      // B uses A's subject as a term but is not itself defining that subject
      const bSubj = (bClaim?.subject ?? "").toLowerCase();
      if (bSubj === aSubj) continue;
      if (bText.includes(aSubj)) {
        edges.push({ from: a, to: b });
      }
    }
  }

  const uniq = new Map<string, { from: number; to: number }>();
  for (const e of edges) {
    if (e.from === e.to) continue;
    // Drop mutual pairs — keep earlier→later by stage preference later
    const rev = `${e.to}->${e.from}`;
    if (uniq.has(rev)) {
      uniq.delete(rev);
      continue;
    }
    uniq.set(`${e.from}->${e.to}`, e);
  }
  return [...uniq.values()];
}

/** Topological order respecting dependencies; stable for ties via stage rank. */
export function orderByConceptDependencies(
  theses: ParagraphThesis[],
  sectionId: string
): ParagraphThesis[] {
  if (theses.length <= 1) return [...theses];
  const edges = buildConceptDependencies(theses);
  const n = theses.length;
  const indeg = new Array(n).fill(0);
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const { from, to } of edges) {
    if (from === to) continue;
    adj[from].push(to);
    indeg[to]++;
  }

  const rank = (i: number) => {
    const stage = narrativeStageFor(theses[i], sectionId);
    let r = stageRank(stage) * 100 + i;
    if (isExampleThesis(theses[i])) r += 5;
    return r;
  };

  const ready = indeg
    .map((d, i) => (d === 0 ? i : -1))
    .filter((i) => i >= 0)
    .sort((a, b) => rank(a) - rank(b));
  const out: number[] = [];
  const seen = new Set<number>();

  while (ready.length > 0) {
    const i = ready.shift()!;
    if (seen.has(i)) continue;
    seen.add(i);
    out.push(i);
    for (const j of adj[i]) {
      indeg[j]--;
      if (indeg[j] === 0) {
        ready.push(j);
        ready.sort((a, b) => rank(a) - rank(b));
      }
    }
  }
  // Cycles / leftovers — append by stage rank (never random)
  const leftovers = [];
  for (let i = 0; i < n; i++) {
    if (!seen.has(i)) leftovers.push(i);
  }
  leftovers.sort((a, b) => rank(a) - rank(b));
  out.push(...leftovers);
  return out.map((i) => theses[i]);
}

/**
 * Place example theses immediately after the nearest prior non-example idea
 * that shares terms; otherwise keep stage order.
 */
export function placeExamplesAfterIdeas(
  theses: ParagraphThesis[],
  sectionId: string
): ParagraphThesis[] {
  const ideas = theses.filter((t) => !isExampleThesis(t));
  const examples = theses.filter((t) => isExampleThesis(t));
  if (examples.length === 0) return orderByConceptDependencies(theses, sectionId);

  const orderedIdeas = orderByConceptDependencies(ideas, sectionId);
  const result: ParagraphThesis[] = [];
  const usedEx = new Set<number>();

  for (const idea of orderedIdeas) {
    result.push(idea);
    const ideaTerms = new Set(introducedTerms(idea));
    for (let ei = 0; ei < examples.length; ei++) {
      if (usedEx.has(ei)) continue;
      const refs = referencedTerms(examples[ei]);
      if (
        refs.some(
          (r) => ideaTerms.has(r) || [...ideaTerms].some((t) => t.includes(r) || r.includes(t))
        )
      ) {
        result.push(examples[ei]);
        usedEx.add(ei);
      }
    }
  }
  for (let ei = 0; ei < examples.length; ei++) {
    if (!usedEx.has(ei)) result.push(examples[ei]);
  }
  return result;
}

/** Summary must reinforce — drop theses that introduce fresh definitional subjects. */
export function filterSummaryToReinforce(
  summary: ParagraphThesis[],
  prior: ParagraphThesis[]
): ParagraphThesis[] {
  const known = new Set<string>();
  for (const t of prior) {
    for (const term of introducedTerms(t)) known.add(term);
  }
  return summary.filter((t) => {
    if (/\b(new|additionally|another|furthermore)\b/i.test(t.mainIdea)) return false;
    const claim = primaryClaim(t);
    if (claim?.relation === "defines" && prior.length > 0) {
      const subj = (claim.subject || "").toLowerCase();
      if (subj && ![...known].some((k) => subj.includes(k) || k.includes(subj))) return false;
    }
    return true;
  });
}

/**
 * Reader confusion check: unexplained terms appearing before introduction.
 */
export function readerConfusionReasons(
  ordered: ParagraphThesis[],
  sectionId: string
): string[] {
  const reasons: string[] = [];
  const introduced = new Set<string>();
  for (let i = 0; i < ordered.length; i++) {
    const t = ordered[i];
    const refs = referencedTerms(t).filter((r) => r.includes(" ") || r.length > 7);
    for (const r of refs.slice(0, 4)) {
      if (introduced.has(r)) continue;
      const claim = primaryClaim(t);
      const definesNow =
        claim?.relation === "defines" ||
        /\b(is|are|means|refers to|defined as)\b/i.test(claim?.assertion ?? "");
      if (!definesNow && i > 0 && r.split(" ").length >= 2) {
        const laterDefines = ordered.slice(i + 1).some((later) => {
          const c = primaryClaim(later);
          return (
            (c?.relation === "defines" || /\bis\b/i.test(c?.assertion ?? "")) &&
            introducedTerms(later).includes(r)
          );
        });
        if (laterDefines) {
          reasons.push(`term "${r}" used before it is explained`);
        }
      }
    }
    for (const term of introducedTerms(t)) introduced.add(term);

    if (i > 0) {
      const prev = narrativeStageFor(ordered[i - 1], sectionId);
      const cur = narrativeStageFor(t, sectionId);
      if (stageRank(cur) + 2 < stageRank(prev) && sectionId !== "summary") {
        reasons.push(`abrupt stage jump ${prev} → ${cur}`);
      }
    }
  }
  return [...new Set(reasons)].slice(0, 6);
}

/** Order theses for one section: dependencies → examples after ideas → stage. */
export function orderSectionNarratively(
  theses: ParagraphThesis[],
  sectionId: string
): ParagraphThesis[] {
  if (theses.length <= 1) return [...theses];
  let ordered = placeExamplesAfterIdeas(theses, sectionId);
  const confusion = readerConfusionReasons(ordered, sectionId);
  if (confusion.some((c) => c.startsWith("abrupt"))) {
    ordered = orderByConceptDependencies(theses, sectionId);
  }
  return ordered;
}

/**
 * Article-wide narrative ordering pass — call after planArticleReasoning, before render.
 */
export function applyNarrativeOrdering(
  reasoning: Map<string, ParagraphThesis[]>
): Map<string, ParagraphThesis[]> {
  const result = new Map<string, ParagraphThesis[]>();
  const prior: ParagraphThesis[] = [];

  for (const sectionId of NARRATIVE_SECTION_ORDER) {
    const theses = reasoning.get(sectionId) ?? [];
    let ordered = orderSectionNarratively(theses, sectionId);
    if (sectionId === "summary") {
      ordered = filterSummaryToReinforce(ordered, prior);
    }
    const confusion = readerConfusionReasons(ordered, sectionId);
    if (confusion.length >= 2) {
      ordered = [...ordered].sort(
        (a, b) =>
          stageRank(narrativeStageFor(a, sectionId)) -
          stageRank(narrativeStageFor(b, sectionId))
      );
      if (sectionId === "summary") ordered = filterSummaryToReinforce(ordered, prior);
    }
    result.set(sectionId, ordered);
    prior.push(...ordered);
  }

  for (const [id, theses] of reasoning) {
    if (!result.has(id)) result.set(id, orderSectionNarratively(theses, id));
  }
  return result;
}

export interface NarrativeQualityReport {
  narrativeFlowScore: number;
  conceptDependencyScore: number;
  readerUnderstandingScore: number;
  ceoEditorialScore: number;
  pass: boolean;
  reasons: string[];
}

/** Score composed article markdown + thesis arc for CEO narrative metrics. */
export function scoreNarrativeQuality(
  markdown: string,
  arc: Map<string, ParagraphThesis[]>
): NarrativeQualityReport {
  const reasons: string[] = [];
  const allTheses: ParagraphThesis[] = [];
  for (const id of NARRATIVE_SECTION_ORDER) {
    allTheses.push(...(arc.get(id) ?? []));
  }

  let flow = 40;
  const present = NARRATIVE_SECTION_ORDER.filter((id) => (arc.get(id)?.length ?? 0) > 0);
  flow += Math.min(40, present.length * 6);
  const bodyParas = markdown
    .split(/\n{2,}/)
    .map((p) => p.replace(/^#+\s+.+$/m, "").trim())
    .filter((p) => p.length > 40 && !p.startsWith("#"));
  let forward = 0;
  let pairs = 0;
  for (const id of NARRATIVE_SECTION_ORDER) {
    const theses = arc.get(id) ?? [];
    for (let i = 1; i < theses.length; i++) {
      pairs++;
      const a = stageRank(narrativeStageFor(theses[i - 1], id));
      const b = stageRank(narrativeStageFor(theses[i], id));
      if (b >= a - 1) forward++;
      else reasons.push(`flow regression in ${id}`);
    }
  }
  if (pairs > 0) flow += Math.round((forward / pairs) * 20);
  flow = Math.min(100, flow);

  let depScore = 100;
  let edgeCount = 0;
  let respected = 0;
  for (const id of NARRATIVE_SECTION_ORDER) {
    const theses = arc.get(id) ?? [];
    const edges = buildConceptDependencies(theses);
    for (const { from, to } of edges) {
      edgeCount++;
      if (from < to) respected++;
      else {
        reasons.push(`dependency inverted in ${id}`);
      }
    }
  }
  if (edgeCount > 0) depScore = Math.round((respected / edgeCount) * 100);
  else depScore = 90; // no edges detected — neutral-high
  depScore = Math.max(0, Math.min(100, depScore));

  let understand = 100;
  for (const id of NARRATIVE_SECTION_ORDER) {
    const conf = readerConfusionReasons(arc.get(id) ?? [], id);
    understand -= conf.length * 8;
    reasons.push(...conf.map((c) => `${id}: ${c}`));
  }
  const summary = arc.get("summary") ?? [];
  const prior = allTheses.filter((t) => t.sectionId !== "summary");
  const summaryLeak = summary.length - filterSummaryToReinforce(summary, prior).length;
  if (summaryLeak > 0) {
    understand -= summaryLeak * 10;
    reasons.push("summary introduces new concepts");
  }
  if (bodyParas.length < 4) {
    understand -= 15;
    reasons.push("too few body paragraphs for a narrative arc");
  }
  understand = Math.max(0, Math.min(100, understand));

  const ceoEditorialScore = Math.round(flow * 0.35 + depScore * 0.3 + understand * 0.35);
  const pass = ceoEditorialScore >= 80 && flow >= 70 && understand >= 70;

  return {
    narrativeFlowScore: flow,
    conceptDependencyScore: depScore,
    readerUnderstandingScore: understand,
    ceoEditorialScore,
    pass,
    reasons: [...new Set(reasons)].slice(0, 10),
  };
}
