/**
 * Brain reasoning — group understood claims into paragraph theses (no LLM).
 */

import type { BrainNotes } from "./catalogBrainUtils";
import type { FactKind } from "./languageSystem/types";
import { planArticleSections } from "./languageSystem/rhetoric";
import { understandFact, type UnderstoodClaim } from "./brainUnderstanding";

import { deriveQuestion } from "./brainQuestion";
import { deriveCentralIdea } from "./brainDiscourse";

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
  return 2;
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

  const groups: UnderstoodClaim[][] = [];
  let current: UnderstoodClaim[] = [];

  for (let i = 0; i < claims.length; i++) {
    const claim = claims[i];
    const shouldMerge =
      current.length > 0 &&
      current.length < maxPerGroup &&
      claimOverlap(current[current.length - 1], claim);

    if (shouldMerge) {
      current.push(claim);
    } else {
      if (current.length > 0) groups.push(current);
      current = [claim];
    }
  }
  if (current.length > 0) groups.push(current);

  return groups.map((group, gi) => ({
    mainIdea: mergeMainIdea(group),
    centralIdea: deriveCentralIdea(group[0], sectionId, topicLabel),
    question: deriveQuestion(group[0], sectionId, topicLabel, startIndex + gi),
    claims: group,
    sectionKind,
    sectionId,
  }));
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
  used: Set<string>
): Array<{ fact: string; kind: FactKind }> {
  switch (sectionId) {
    case "overview": {
      const defs =
        notes.definitions.length > 0 ? notes.definitions : notes.allFacts;
      return takeUnused(defs, used, Math.min(maxFacts, 3)).map((fact) => ({
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
      const taken = takeUnused(pool, used, maxFacts);
      if (taken.length > 0) {
        return taken.map((fact) => ({ fact, kind: "property" as const }));
      }
      // Good fuel often encodes "why" inside definitional sentences — reuse best matches
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
      const taken = takeUnused(pool, used, maxFacts);
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
      const items: Array<{ fact: string; kind: FactKind }> = [];
      for (const f of takeUnused(notes.properties, used, 8)) {
        items.push({ fact: f, kind: "property" });
      }
      for (const f of takeUnused(notes.measurements, used, 3)) {
        items.push({ fact: f, kind: "measurement" });
      }
      for (const f of takeUnused(notes.comparisons, used, 3)) {
        items.push({ fact: f, kind: "comparison" });
      }
      return items.slice(0, maxFacts);
    }
    case "practical": {
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
        ...notes.properties.filter((f) =>
          /^(to |how to|first |start |begin |use |apply |implement |build |train |deploy )|\b(used in|used for|application|applications|in practice|real.?world|product|software|business|example|such as|including)\b/i.test(
            f
          )
        ),
        ...notes.allFacts.filter((f) =>
          /\b(used in|used for|application|applications|in practice|real.?world|example|such as|including)\b/i.test(f)
        ),
      ];
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
      // Reinforce only — reuse already-seen definitional/property facts, no fresh pool hunt
      const items: Array<{ fact: string; kind: FactKind }> = [];
      for (const f of takeOrReuse(notes.definitions.slice(0, 2), used, 2, true)) {
        items.push({ fact: f, kind: "definition" });
      }
      for (const f of takeOrReuse(notes.properties.slice(0, 4), used, 3, true)) {
        items.push({ fact: f, kind: "property" });
      }
      return items.slice(0, Math.min(maxFacts, 4));
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

  for (const plan of sectionPlans) {
    const factItems = factsForSection(notes, plan.id, plan.maxFacts, used);

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
