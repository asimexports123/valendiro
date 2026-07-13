/**
 * Brain reasoning — group understood claims into paragraph theses (no LLM).
 */

import type { BrainNotes } from "./catalogBrainUtils";
import type { FactKind } from "./languageSystem/types";
import { planArticleSections } from "./languageSystem/rhetoric";
import { understandFact, type UnderstoodClaim } from "./brainUnderstanding";
import { buildTopicModel } from "./topicModel";
import { selectPrimaryDefinitionFact } from "./brainReaderIntent";

import { deriveQuestion } from "./brainQuestion";
import { deriveCentralIdea } from "./brainDiscourse";
import { trimAssertion } from "./brainDiscoursePlanner";

export interface ParagraphThesis {
  mainIdea: string;
  centralIdea: string;
  question: string;
  claims: UnderstoodClaim[];
  sectionKind: FactKind;
  sectionId?: string;
}

function normalizeKey(s: string): string {
  return s.toLowerCase().replace(/[^\w\s]/g, "").replace(/\s+/g, " ").trim();
}

function claimOverlap(a: UnderstoodClaim, b: UnderstoodClaim): boolean {
  if (normalizeKey(a.subject) === normalizeKey(b.subject) && a.subject.trim().length > 2) {
    return true;
  }
  const aWords = new Set(normalizeKey(a.assertion).split(/\s+/).filter((w) => w.length > 3));
  const bWords = normalizeKey(b.assertion).split(/\s+/).filter((w) => w.length > 3);
  let shared = 0;
  for (const w of bWords) {
    if (aWords.has(w)) shared++;
  }
  // Require real topical overlap — weak 2-word matches stitch unrelated facts
  return shared >= 3;
}

function mergeMainIdea(claims: UnderstoodClaim[]): string {
  if (claims.length === 1) return claims[0].assertion;
  // Primary assertion; secondary is rendered as teaching support, not a second main idea
  return claims[0].assertion;
}

/** How many related claims may share one teaching paragraph. */
function maxClaimsPerParagraph(sectionId: string): number {
  // Definition / mistakes / summary stay one-idea-tight; body sections may develop with a follow-on claim
  if (sectionId === "overview" || sectionId === "mistakes" || sectionId === "summary") return 1;
  return 3;
}

function groupClaims(
  claims: UnderstoodClaim[],
  sectionKind: FactKind,
  sectionId: string,
  topicLabel: string,
  seed: number,
  maxPerGroup = 1,
  startIndex = 0
): ParagraphThesis[] {
  if (claims.length === 0) return [];

  // Greedy clustering within a lookahead window so related but non-adjacent
  // claims can be merged into a single teaching paragraph. This increases
  // paragraph depth while keeping relevance high.
  const groups: UnderstoodClaim[][] = [];
  const usedIdx = new Set<number>();
  const window = Math.max(2, maxPerGroup + 1);

  function contradicts(a: UnderstoodClaim, b: UnderstoodClaim): boolean {
    const A = (a.assertion || "").toLowerCase();
    const B = (b.assertion || "").toLowerCase();
    // simple contradiction heuristic: same core phrase with negation
    if (A.includes(" not ") && B.includes(A.replace(/\s+not\s+/g, " "))) return true;
    if (B.includes(" not ") && A.includes(B.replace(/\s+not\s+/g, " "))) return true;
    if (/^(never|no|cannot|can't|don't|doesn't)\b/.test(A) && B.includes(A.replace(/^(never|no|cannot|can't|don't|doesn't)\b/, "").trim())) return true;
    return false;
  }

  for (let i = 0; i < claims.length; i++) {
    if (usedIdx.has(i)) continue;
    const base = claims[i];
    const group: UnderstoodClaim[] = [base];
    usedIdx.add(i);
    // look ahead to find related claims up to maxPerGroup within window
    for (let j = i + 1; j < Math.min(claims.length, i + 1 + window) && group.length < maxPerGroup; j++) {
      if (usedIdx.has(j)) continue;
      const candidate = claims[j];
      if (contradicts(base, candidate)) continue;
      // merge if candidate overlaps with base or with any already in group
      const related = claimOverlap(base, candidate) || group.some((g) => claimOverlap(g, candidate));
      if (related) {
        group.push(candidate);
        usedIdx.add(j);
      }
    }
    groups.push(group);
  }

  return groups.map((group, gi) => {
    // Build a slightly richer mainIdea when multiple claims are present without adding filler.
    const mainIdea =
      group.length === 1
        ? group[0].assertion
        : `${group[0].assertion}. ${group
            .slice(1)
            .map((c) => trimAssertion(c.assertion || c.sourceFact, 80))
            .filter(Boolean)
            .join("; ")}`;

    return {
      mainIdea,
      centralIdea: deriveCentralIdea(group[0], sectionId, topicLabel),
      question: deriveQuestion(group[0], sectionId, topicLabel, startIndex + gi),
      claims: group,
      sectionKind,
      sectionId,
    };
  });
}

function takeUnused(facts: string[], used: Set<string>, max: number): string[] {
  const out: string[] = [];
  for (const fact of facts) {
    const key = normalizeKey(fact);
    if (!key || used.has(key)) continue;
    used.add(key);
    out.push(fact);
    if (out.length >= max) break;
  }
  return out;
}

function takeOrReuse(
  facts: string[],
  used: Set<string>,
  max: number,
  allowReuse = false
): string[] {
  const out = takeUnused(facts, used, max);
  if (out.length >= max || !allowReuse) return out;
  for (const fact of facts) {
    if (out.length >= max) break;
    if (!out.includes(fact)) out.push(fact);
  }
  return out.slice(0, max);
}

function factsForSection(
  notes: BrainNotes,
  sectionId: string,
  maxFacts: number,
  used: Set<string>,
  topicLabel: string,
  reservedFacts: string[] = []
): Array<{ fact: string; kind: FactKind }> {
  // Delegate per-fact decisions to the evidence-based Reader Understanding assessor.
  function evaluateFactUsefulness(fact: string, section: string): boolean {
    try {
      const a = assessFactForSection(fact, section, notes, topicLabel);
      return !!a?.kept;
    } catch (e) {
      // If assessor fails, conservatively allow short facts through the existing heuristics fallback.
      const cleaned = fact.replace(/\[\d+[a-z]?\]/gi, "").replace(/\s+/g, " ").trim();
      if (!cleaned || cleaned.length < 20) return false;
      return /\b(is|are|refers to|defined as|means|works|process|step|used in|used for)\b/i.test(cleaned);
    }
  }

  switch (sectionId) {
    case "overview": {
      const defs = notes.definitions.length > 0 ? notes.definitions : notes.allFacts;
      // prefer facts tied to high-confidence concepts
      const model = buildTopicModel(notes, topicLabel);
      const primaryDef = selectPrimaryDefinitionFact(notes, topicLabel, topicLabel) ?? defs[0];
      const primaryPool = primaryDef && evaluateFactUsefulness(primaryDef, "overview") ? [primaryDef] : [];
      const restPool = defs
        .filter((f) => f !== primaryDef)
        .filter((f) => evaluateFactUsefulness(f, "overview"))
        .sort((a, b) => {
          const aC = model.concepts.find((c) => c.supportingFacts.includes(a))?.confidence ?? 0;
          const bC = model.concepts.find((c) => c.supportingFacts.includes(b))?.confidence ?? 0;
          return bC - aC;
        });
      const pool = [...primaryPool, ...restPool];
      return takeUnused(pool.length > 0 ? pool : defs, used, Math.min(maxFacts, 3)).map((fact) => ({
        fact,
        kind: "definition" as const,
      }));
    }
    case "why": {
      const pool = [
        ...notes.properties.filter((f) =>
          /\b(because|matters|purpose|exists|solves|helps|enables|allows|reason|benefit|important|need|designed to|protect|risk|cost)\b/i.test(
            f
          )
        ),
        ...notes.definitions.filter((f) =>
          /\b(helps|enables|allows|designed|purpose)\b/i.test(f)
        ),
        ...notes.properties,
        ...notes.allFacts.filter((f) =>
          /\b(because|purpose|helps|enables|allows|solves|matters|designed to)\b/i.test(f)
        ),
      ];
      const candidate = pool.filter((f) => evaluateFactUsefulness(f, "why"));
      // prefer concept-backed facts
      const modelWhy = buildTopicModel(notes, topicLabel);
      const candidateSorted = candidate.sort((a, b) => {
        const aC = modelWhy.concepts.find((c) => c.supportingFacts.includes(a))?.confidence ?? 0;
        const bC = modelWhy.concepts.find((c) => c.supportingFacts.includes(b))?.confidence ?? 0;
        return bC - aC;
      });
      let taken = takeUnused(candidateSorted.length > 0 ? candidateSorted : pool, used, maxFacts);
      // fallback: for technical topics pick first unused transitive-verb property
      if (taken.length === 0) {
        const fallback = notes.properties.filter((f) => /\b(\w+ed|\buses\b|\bprovides\b|\benables\b|\bhelps\b|\bworks\b|\bprocess\b)\b/i.test(f));
        taken = takeUnused(fallback, used, maxFacts);
      }
      if (taken.length > 0) {
        return taken.map((fact) => ({ fact, kind: "property" as const }));
      }
      return takeOrReuse(pool.length > 0 ? pool : notes.allFacts, used, Math.min(maxFacts, 3), true).map(
        (fact) => ({ fact, kind: "property" as const })
      );
    }
    case "how": {
      const pool = [
        ...notes.procedures,
        ...notes.properties.filter((f) =>
          /\b(works|process|mechanism|step|through|by using|consists|composed|operates|algorithm|pipeline|flow|structure)\b/i.test(
            f
          )
        ),
        ...notes.measurements,
        ...notes.allFacts.filter((f) =>
          /\b(works|process|mechanism|step|consists|composed|operates|by using)\b/i.test(f)
        ),
      ];
      const candidate = pool.filter((f) => evaluateFactUsefulness(f, "how"));
      const modelHow = buildTopicModel(notes, topicLabel);
      const candidateSorted = candidate.sort((a, b) => {
        const aC = modelHow.concepts.find((c) => c.supportingFacts.includes(a))?.confidence ?? 0;
        const bC = modelHow.concepts.find((c) => c.supportingFacts.includes(b))?.confidence ?? 0;
        return bC - aC;
      });
      let taken = takeUnused(candidateSorted.length > 0 ? candidateSorted : pool, used, maxFacts);
      if (taken.length === 0) {
        // fallback to first unused procedural-like property
        const fallback = notes.properties.filter((f) => /\b(step|first|next|then|process|workflow|by using|implement|build|deploy)\b/i.test(f));
        taken = takeUnused(fallback, used, maxFacts);
      }
      if (taken.length > 0) {
        return taken.map((fact) => ({
          fact,
          kind: notes.procedures.includes(fact) ? ("procedure" as const) : ("property" as const),
        }));
      }
      return takeOrReuse(pool.length > 0 ? pool : notes.properties, used, Math.min(maxFacts, 3), true).map(
        (fact) => ({ fact, kind: "procedure" as const })
      );
    }
    case "keyConcepts": {
      // Only keep facts that help a reader understand or remember the topic.
      const isUsefulConcept = (f: string): boolean => {
        const hasVerb = /\b(is|are|was|were|has|have|helps|enables|allows|does|makes|provides|means|defines|refers|requires|uses|works|reduces|increases|shows)\b/i.test(f);
        if (!hasVerb) return false;
        if (/\b(invented|originated|first introduced|pioneered|born in|\bin \d{4}\b|since \d{4})\b/i.test(f)) return false;
        if (/^(types of|there are \d+|the (main|three|four|five|common) types)/i.test(f)) return false;
        if (/^(see also|refer to|as mentioned|as discussed|as noted)\b/i.test(f)) return false;
        if (/^\d+(\.\d+)?%\s+(of|are|is)\b/i.test(f)) return false;
        return evaluateFactUsefulness(f, "keyConcepts");
      };

      const items: Array<{ fact: string; kind: FactKind }> = [];
      // allow reserved facts to surface here first
      const qualityProps = [
        ...reservedFacts.filter((r) => notes.properties.includes(r) && isUsefulConcept(r)),
        ...notes.properties.filter((p) => !reservedFacts.includes(p) && isUsefulConcept(p)),
      ];
      for (const f of takeUnused(qualityProps, used, 6)) {
        items.push({ fact: f, kind: "property" });
      }
      const compCandidates = notes.comparisons.filter(isUsefulConcept);
      for (const f of takeUnused(compCandidates, used, 3)) {
        items.push({ fact: f, kind: "comparison" });
      }
      const contextualMeasurements = notes.measurements.filter((f) => isUsefulConcept(f) && f.length > 50);
      for (const f of takeUnused(contextualMeasurements, used, 2)) {
        items.push({ fact: f, kind: "measurement" });
      }
      return items.slice(0, maxFacts);
    }
    case "practical": {
      const isGenuinePractical = (fact: string): boolean => {
        return evaluateFactUsefulness(fact, "practical");
      };

      const practicalScore = (fact: string): number => {
        let score = 0;
        if (/\b(used in|used for|application|applications|in practice|real.?world|example|such as|including)\b/i.test(fact)) score += 40;
        if (/^(to |how to|first |start |begin |use |apply |implement |build |train |deploy )/i.test(fact)) score += 25;
        if (/\b(product|software|business|work|decision|tool|workflow|retail|study|everyday)\b/i.test(fact)) score += 10;
        if (/\b(common|important|main|major|typical|primary|best-known)\b/i.test(fact)) score += 8;
        return score;
      };

      const pool = [
        ...notes.procedures,
        ...notes.properties,
        ...notes.allFacts,
      ].filter((f) => isGenuinePractical(f));
      const ranked = [...new Set(pool)].sort((a, b) => practicalScore(b) - practicalScore(a));
      const sigStop = new Set([
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
        "by",
        "is",
        "are",
        "be",
        "it",
        "this",
        "that",
        "these",
        "those",
        "used",
        "use",
        "using",
        "application",
        "applications",
        "example",
        "examples",
        "world",
        "real",
      ]);
      const uniqueRanked: string[] = [];
      const seenSig = new Set<string>();
      for (const fact of ranked) {
        const sig = normalizeKey(fact)
          .split(/\s+/)
          .filter((w) => w.length > 3 && !sigStop.has(w))
          .slice(0, 5)
          .join(" ");
        if (!sig || seenSig.has(sig)) continue;
        seenSig.add(sig);
        uniqueRanked.push(fact);
      }
      const chosen = takeUnused(uniqueRanked, used, maxFacts);
      if (chosen.length > 0) {
        return chosen.map((fact) => ({
          fact,
          kind: /\b(used in|used for|application|applications|in practice|real.?world|example|such as|including)\b/i.test(fact)
            ? ("property" as const)
            : ("procedure" as const),
        }));
      }
      return takeUnused(notes.properties, used, Math.min(maxFacts, 4)).map((fact) => ({
        fact,
        kind: "property" as const,
      }));
    }
    case "mistakes": {
      const warn = takeUnused(notes.warnings, used, maxFacts);
      if (warn.length > 0) {
        return warn.map((fact) => ({ fact, kind: "warning" as const }));
      }
      const cautionProps = [
        ...notes.properties.filter((f) =>
          /^(never|don't|do not|avoid|warning|caution|overlook|neglect|misuse|ethical|safety|risk|harm)|mistake|misunderstand|beginner/i.test(
            f
          )
        ),
        ...notes.allFacts.filter((f) =>
          /\b(avoid|risk|mistake|never|don't|harm|ethical|safety|misunderstand)\b/i.test(f)
        ),
      ];
      return takeOrReuse(
        cautionProps.length > 0 ? cautionProps : notes.properties,
        used,
        Math.min(maxFacts, 3),
        true
      ).map((fact) => ({ fact, kind: "warning" as const }));
    }
    case "summary": {
      // Biggest ideas only — help the reader leave with a clear mental model.
      const items: Array<{ fact: string; kind: FactKind }> = [];

      const leadDef = notes.definitions.find((f) =>
        /\b(is|are|refers to|defined as|means)\b/i.test(f) && f.length > 40
      );
      if (leadDef) {
        items.push({ fact: leadDef, kind: "definition" });
        used.add(leadDef.toLowerCase().replace(/\s+/g, " ").trim());
      }

      const mechanismPool = [
        ...notes.procedures,
        ...notes.properties.filter((f) =>
          /\b(because|helps|enables|allows|reduces|improves|solves|provides|means|key (reason|benefit|advantage)|important|critical)\b/i.test(f)
        ),
      ];
      const mechanism = mechanismPool.find((f) => {
        const key = f.toLowerCase().replace(/\s+/g, " ").trim();
        return !used.has(key) && f.length > 40 && evaluateFactUsefulness(f, "summary");
      });
      if (mechanism) {
        items.push({ fact: mechanism, kind: notes.procedures.includes(mechanism) ? "procedure" : "property" });
        used.add(mechanism.toLowerCase().replace(/\s+/g, " ").trim());
      }

      const takeawayPool = [
        ...notes.comparisons,
        ...notes.warnings,
        ...notes.properties.filter((f) =>
          /\b(trade.?off|however|but|downside|limitation|important to|consider|should|avoid|instead|rather than|not all)\b/i.test(f)
        ),
      ];
      const takeaway = takeawayPool.find((f) => {
        const key = f.toLowerCase().replace(/\s+/g, " ").trim();
        return !used.has(key) && f.length > 35 && evaluateFactUsefulness(f, "summary");
      });
      if (takeaway) {
        const kind = notes.comparisons.includes(takeaway) ? "comparison" : notes.warnings.includes(takeaway) ? "warning" : "property";
        items.push({ fact: takeaway, kind });
      }

      return items.slice(0, Math.min(maxFacts, 3));
    }
    default:
      return [];
  }
}

/** Mark facts consumed by the intro so sections do not repeat them. */
export function markIntroFactsUsed(notes: BrainNotes, used: Set<string>): void {
  // Only pin the lead definition — burning defs+props here starves Why/How when fuel is dense but fact count is modest
  const lead = notes.definitions[0];
  if (lead) used.add(normalizeKey(lead));
}

/** Plan one paragraph thesis from related claims. */
export function planParagraphThesis(
  claims: UnderstoodClaim[],
  topicLabel: string,
  sectionKind: FactKind,
  seed: number
): ParagraphThesis {
  const groups = groupClaims(claims, sectionKind, "overview", topicLabel, seed, 1);
  if (groups.length > 0) return groups[0];
  return {
    mainIdea: claims[0]?.assertion ?? topicLabel,
    centralIdea: claims[0]
      ? deriveCentralIdea(claims[0], "overview", topicLabel)
      : topicLabel,
    question: claims[0]
      ? deriveQuestion(claims[0], "overview", topicLabel, 0)
      : `What is ${topicLabel}?`,
    claims: claims.slice(0, 1),
    sectionKind,
    sectionId: "overview",
  };
}

/** Plan paragraph theses for every article section. */
export function planArticleReasoning(
  notes: BrainNotes,
  topicLabel: string,
  seed: number
): Map<string, ParagraphThesis[]> {
  const sectionPlans = planArticleSections(topicLabel);
  const result = new Map<string, ParagraphThesis[]>();
  const used = new Set<string>();
  markIntroFactsUsed(notes, used);
  // Build TopicModel once and reserve top property facts for keyConcepts
  const model = buildTopicModel(notes, topicLabel);
  const reservedProps: string[] = [];
  // collect property/supporting facts from highest-confidence concepts
  const propCandidates = model.concepts
    .filter((c) => c.type === "property" || c.type === "definition")
    .sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0));
  for (const c of propCandidates) {
    for (const f of c.supportingFacts) {
      if (reservedProps.length >= 3) break;
      if (!reservedProps.includes(f) && notes.properties.includes(f)) reservedProps.push(f);
    }
    if (reservedProps.length >= 3) break;
  }

  for (const plan of sectionPlans) {
    const factItems = factsForSection(notes, plan.id, plan.maxFacts, used, topicLabel, reservedProps);

    if (plan.id === "keyConcepts") {
      const theses: ParagraphThesis[] = [];
      const byKind = new Map<FactKind, UnderstoodClaim[]>();
      for (const { fact, kind } of factItems) {
        const list = byKind.get(kind) ?? [];
        list.push(understandFact(fact, topicLabel, kind));
        byKind.set(kind, list);
      }
      let kindIdx = 0;
      for (const kind of plan.factKinds) {
        const claims = byKind.get(kind) ?? [];
        if (claims.length === 0) continue;
        theses.push(
          ...groupClaims(
            claims,
            kind,
            plan.id,
            topicLabel,
            seed + kindIdx,
            maxClaimsPerParagraph(plan.id),
            theses.length
          )
        );
        kindIdx++;
      }
      result.set(plan.id, theses.slice(0, 6));
    } else {
      const kind = factItems[0]?.kind ?? plan.factKinds[0];
      const claims = factItems.map(({ fact, kind: k }) =>
        understandFact(fact, topicLabel, k)
      );
      const cap =
        plan.id === "overview"
          ? 3
          : plan.id === "why" || plan.id === "how"
            ? 4
            : plan.id === "summary"
              ? 3
              : plan.id === "mistakes"
                ? 3
                : plan.id === "keyConcepts"
                  ? 6
                  : 4;
      result.set(
        plan.id,
        groupClaims(
          claims,
          kind,
          plan.id,
          topicLabel,
          seed,
          maxClaimsPerParagraph(plan.id)
        ).slice(0, cap)
      );
    }
  }

  return result;
}
