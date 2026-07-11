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
  // Generic "Reader Understanding Layer" — evaluate usefulness of each fact
  function evaluateFactUsefulness(fact: string, section: string): boolean {
    if (!fact) return false;
    const cleaned = fact.replace(/\[\d+[a-z]?\]/gi, "").replace(/\s+/g, " ").trim();
    if (cleaned.length < 20) return false;
    // Reject wiki/source cruft and fragment openers
    if (/\[edit\]|\bsee also\b|refer to\b|as mentioned\b/i.test(cleaned)) return false;
    if (/^(such as|including|for example|e\.g\.|namely|types of|there are \d+)/i.test(cleaned)) return false;
    // Reject long comma-taxonomy lists
    if (/^[^.!?]{0,40}(,\s*[a-z][^,]{1,30}){4,}\.?$/i.test(cleaned)) return false;
    // Reject bare statistics
    if (/^\d+(\.\d+)?%(\s+of)?\b/i.test(cleaned)) return false;

    let score = 0;
    // Explanation / reader-oriented signals
    if (/\b(helps|enables|allows|you can|you should|used in|used for|in practice|for example|for instance)\b/i.test(cleaned)) score += 30;
    if (/\b(is|are|refers to|defined as|means|consists of|works|process|step|mechanism|procedure|how to|by)\b/i.test(cleaned)) score += 22;
    if (/\b(benefit|advantage|trade-?off|limitation|risk|cost|avoid|mistake|pitfall)\b/i.test(cleaned)) score += 16;

    // Penalize historical/trivia/source emphasis
    if (/\b(invented|originated|first introduced|pioneered|in \d{4}|since \d{4})\b/i.test(cleaned)) score -= 40;
    if (/\b(author|source|study|according to|citation|survey)\b/i.test(cleaned)) score -= 18;

    // Facts without a verb are likely taxonomy/fragments — lower their score
    if (!/\b(is|are|helps|enables|allows|uses|makes|provides|works|does|means|consists)\b/i.test(cleaned)) score -= 18;

    // Section-specific nudges
    if (section === "why" && /\b(because|purpose|reason|so that|therefore|as a result)\b/i.test(cleaned)) score += 18;
    if (section === "how" && /\b(step|first|next|then|process|workflow|by|through|using|implement|build|deploy)\b/i.test(cleaned)) score += 18;
    if (section === "practical" && /\b(used in|used for|who|when|benefit|scenario|case|everyday|typical)\b/i.test(cleaned)) score += 18;

    return score >= 12;
  }

  switch (sectionId) {
    case "overview": {
      const defs = notes.definitions.length > 0 ? notes.definitions : notes.allFacts;
      const pool = defs.filter((f) => evaluateFactUsefulness(f, "overview"));
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
      const taken = takeUnused(candidate.length > 0 ? candidate : pool, used, maxFacts);
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
      const taken = takeUnused(candidate.length > 0 ? candidate : pool, used, maxFacts);
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
      const qualityProps = notes.properties.filter(isUsefulConcept);
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
