import type { BrainNotes } from "./catalogBrainUtils";
import { normalizeKey as _normalizeKey } from "./brainReasoning";
import { scoreFactPriority } from "./brainSemanticRank";

export type ConceptType = "definition" | "mechanism" | "term" | "tradeoff" | "property" | "procedure";

export interface Concept {
  id: string;
  title?: string;
  type: ConceptType;
  supportingFacts: string[];
  confidence: number; // 0-100
  beginner: boolean;
  advanced: boolean;
}

export interface Edge {
  from: string;
  to: string;
  relation: "requires" | "enables" | "exampleOf" | "contrast" | string;
  weight: number;
}

export interface Mechanism {
  id: string;
  title?: string;
  steps: string[]; // step facts or concept ids
  supportingFacts: string[];
}

export interface TopicModel {
  concepts: Concept[];
  edges: Edge[];
  mechanisms: Mechanism[];
  contradictions: Array<{ a: string; b: string; reason: string; confidence: number }>;
  provenance: { factCount: number };
}

function normalizeKey(s: string): string {
  return (s || "")
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function idFrom(i: number, prefix = "c") {
  return `${prefix}-${i.toString(36)}`;
}

function stripCitations(s: string) {
  return (s || "").replace(/\[\d+\]/g, "").replace(/\[[a-z]\]/gi, "").replace(/\s+/g, " ").trim();
}

function canonicalizeAssertion(s: string) {
  if (!s) return s;
  let t = stripCitations(s);
  // remove editorial cruft
  t = t.replace(/\s*\(.*?\)\s*/g, " ").replace(/\s+/g, " ").trim();
  // Prefer the first clause up to a full sentence
  const m = t.match(/^[^.?!]+[.?!]?/);
  t = (m ? m[0] : t).trim();
  // Simple active-voice heuristics: lower-case leading "there is/are" constructs
  t = t.replace(/^\s*there (is|are)\s+/i, "");
  // Capitalize first letter and ensure period
  t = t.charAt(0).toUpperCase() + t.slice(1);
  if (!/[.?!]$/.test(t)) t = t + ".";
  return t;
}

function shortLabel(s: string, max = 6) {
  const clean = stripCitations(s).replace(/[^a-zA-Z0-9\s]/g, " ");
  const parts = clean.split(/\s+/).filter(Boolean).slice(0, max);
  if (parts.length === 0) return clean.slice(0, 40);
  let label = parts.join(" ");
  // Capitalize
  label = label.charAt(0).toUpperCase() + label.slice(1);
  return label;
}

/** Build a lightweight TopicModel from BrainNotes.
 * This is intentionally deterministic and conservative — it's a scaffold to make internal
 * understanding explicit and explainable. Improve later with embeddings if needed.
 */
export function buildTopicModel(notes: BrainNotes, title: string, options?: { slug?: string }): TopicModel {
  const allFacts = [
    ...notes.definitions,
    ...notes.procedures,
    ...notes.properties,
    ...notes.warnings,
    ...notes.comparisons,
    ...notes.measurements,
  ].filter(Boolean);

  const concepts: Concept[] = [];
  const edges: Edge[] = [];
  const mechanisms: Mechanism[] = [];
  const contradictions: TopicModel["contradictions"] = [];

  // Seed concepts from definitions first
  let idx = 0;
  for (const def of notes.definitions) {
    const can = canonicalizeAssertion(def);
    concepts.push({
      id: idFrom(idx++, "def"),
      title: shortLabel(def, 6),
      type: "definition",
      supportingFacts: [def],
      confidence: Math.min(100, Math.max(40, scoreFactPriority(def, title, options).priority)),
      beginner: true,
      advanced: false,
      canonicalAssertion: can,
    });
  }

  // Helper: find best matching concept by token overlap
  function bestConceptForFact(fact: string) {
    const factTokens = new Set(normalizeKey(fact).split(/\s+/).filter((w) => w.length > 3));
    let best: { concept: Concept; score: number } | null = null;
    for (const c of concepts) {
      const cTokens = new Set(normalizeKey(c.title || c.supportingFacts[0]).split(/\s+/));
      let shared = 0;
      for (const t of cTokens) if (factTokens.has(t)) shared++;
      if (!best || shared > best.score) best = { concept: c, score: shared };
    }
    return best && best.score >= 2 ? best.concept : null;
  }

  // Add remaining facts into concepts or create new concept nodes
  for (const f of allFacts) {
    // skip if already part of an existing concept's supportingFacts
    if (concepts.some((c) => c.supportingFacts.includes(f))) continue;
    const best = bestConceptForFact(f);
    if (best) {
      best.supportingFacts.push(f);
      // boost confidence a little
      best.confidence = Math.min(100, best.confidence + Math.round(scoreFactPriority(f, title, options).priority / 20));
      continue;
    }
    // create new concept
    const kind = /^(to |how to|first |start |begin |use |apply |implement |build |train |deploy )/i.test(f) || notes.procedures.includes(f)
      ? "procedure"
      : notes.warnings.includes(f)
        ? "tradeoff"
        : "property";
    const can = canonicalizeAssertion(f);
    concepts.push({
      id: idFrom(idx++),
      title: shortLabel(f, 6),
      type: kind as ConceptType,
      supportingFacts: [f],
      confidence: Math.min(100, Math.max(10, scoreFactPriority(f, title, options).priority)),
      beginner: kind !== "tradeoff" && kind !== "procedure",
      advanced: kind === "procedure" || kind === "tradeoff",
      canonicalAssertion: can,
    });
  }

  // Mechanism extraction: group procedural facts into ordered steps when possible
  const procFacts = notes.procedures.slice(0, 40);
  if (procFacts.length > 0) {
    // naive grouping by "first/then/next" or numeric markers
    let mechIdx = 0;
    const visited = new Set<string>();
    for (const f of procFacts) {
      if (visited.has(f)) continue;
      const steps = [f];
      visited.add(f);
      // try to find follow-on steps by textual cues
      const tail = procFacts.filter((p) => !visited.has(p) && /(next|then|after|step|follow)/i.test(p));
      for (const t of tail.slice(0, 4)) {
        steps.push(t);
        visited.add(t);
      }
      mechanisms.push({
        id: `m-${mechIdx++}`,
        title: steps[0].slice(0, 80),
        steps,
        supportingFacts: steps,
      });
    }
  }

  // Contradiction detection: simple negation vs positive with high overlap
  const facts = allFacts;
  for (let i = 0; i < facts.length; i++) {
    for (let j = i + 1; j < facts.length; j++) {
      const a = facts[i];
      const b = facts[j];
      const ak = normalizeKey(a);
      const bk = normalizeKey(b);
      const overlap = ak.split(/\s+/).filter((w) => bk.includes(w)).length;
      if (overlap >= 4) {
        const aNeg = /\b(not|never|no|doesn't|does not|cannot|can't)\b/i.test(a);
        const bNeg = /\b(not|never|no|doesn't|does not|cannot|can't)\b/i.test(b);
        if (aNeg !== bNeg) {
          contradictions.push({
            a,
            b,
            reason: "opposite polarity with high lexical overlap",
            confidence: 70,
          });
        }
      }
    }
  }

  // Build simple edges based on "requires"/"depends on" language between concepts
  for (const c of concepts) {
    for (const f of c.supportingFacts) {
      const m = f.match(/\b(requires|depends on|prerequisite|before|followed by)\b\s+([^.]{3,80})/i);
      if (m?.[2]) {
        const otherText = normalizeKey(m[2]);
        const target = concepts.find((x) => normalizeKey((x.title || x.supportingFacts[0])).includes(otherText.split(" ")[0]));
        if (target && target.id !== c.id) {
          edges.push({ from: c.id, to: target.id, relation: "requires", weight: 80 });
        }
      }
    }
  }

  return {
    concepts,
    edges,
    mechanisms,
    contradictions,
    provenance: { factCount: allFacts.length },
  };
}

