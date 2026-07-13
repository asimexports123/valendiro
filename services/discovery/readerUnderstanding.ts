import type { BrainNotes } from "./catalogBrainUtils";
import { scoreFactPriority, MIN_COMPOSE_PRIORITY } from "./brainSemanticRank";
import { buildTopicModel } from "./topicModel";

export interface Assessment {
  fact: string;
  score: number; // composite score (0..100)
  kept: boolean;
  signals: string[]; // descriptive signals
  reasons: string[]; // human-readable reasons for decision
  conceptIds: string[]; // matched concept ids if any
}

function hasVerb(s: string): boolean {
  return /\b(is|are|was|were|has|have|helps|enables|allows|uses|makes|provides|works|does|means|consists|reduces|improves|avoids|requires)\b/i.test(
    s
  );
}

function isTaxonomyLike(s: string): boolean {
  if (!s) return false;
  if (/^[^.!?]{0,40}(,\s*[a-z][^,]{1,30}){4,}\.?$/i.test(s)) return true;
  if (/^(types of|there are \d+|the (main|three|four|five|common) types)/i.test(s)) return true;
  return false;
}

function isFragmentOpener(s: string): boolean {
  return /^(such as|including|for example|e\.g\.|namely|for instance)/i.test(s);
}

/** Composite, evidence-based assessment for a fact in a given section. */
export function assessFactForSection(
  fact: string,
  section: string,
  notes: BrainNotes,
  title: string,
  options?: { slug?: string }
): Assessment {
  const signals: string[] = [];
  const reasons: string[] = [];
  const f = (fact || "").replace(/\[\d+[a-z]?\]/gi, "").replace(/\s+/g, " ").trim();
  const ranked = scoreFactPriority(fact, title, options);
  signals.push(...ranked.signals);

  // Base score from semantic ranking (0-100)
  let score = Math.max(0, Math.min(100, ranked.priority));

  // Surface cues (supporting evidence, not absolute)
  if (hasVerb(f)) {
    signals.push("surface:verb");
    score += 8;
  } else {
    signals.push("surface:no_verb");
    score -= 6;
  }

  if (isTaxonomyLike(f)) {
    signals.push("surface:taxonomy_like");
    score -= 18;
    reasons.push("looks like a taxonomy/list without context");
  }
  if (isFragmentOpener(f)) {
    signals.push("surface:fragment_opener");
    score -= 12;
    reasons.push("starts with example/including");
  }
  if (/\[edit\]/i.test(f) || /\[citation/i.test(f)) {
    signals.push("surface:wiki_artifact");
    score -= 24;
    reasons.push("contains wiki/edit/citation artifacts");
  }

  // TopicModel membership signals
  let conceptIds: string[] = [];
  try {
    const model = buildTopicModel(notes, title, options);
    // Normalize candidate fact tokens for fuzzy matching
    const normalize = (s: string) =>
      (s || "")
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .replace(/\s+/g, " ")
        .trim();
    const factKey = normalize(f);
    const factTokens = new Set(factKey.split(/\s+/).filter((w) => w.length > 3));

    const topicWords = new Set((title || "").toLowerCase().split(/\W+/).filter(Boolean).filter((w) => w.length > 2));
    for (const c of model.concepts) {
      let bestShared = 0;
      for (const sf of c.supportingFacts) {
        if (!sf || sf.trim().length === 0) continue;
        const sfKey = normalize(sf);
        const sfTokens = sfKey.split(/\s+/).filter((w) => w.length > 3);
        let shared = 0;
        for (const t of sfTokens) if (factTokens.has(t)) shared++;
        if (shared > bestShared) bestShared = shared;
      }
      // Strong membership if token overlap >= 2, weak membership if overlap == 1
      if (bestShared >= 2) {
        conceptIds.push(c.id);
        if (section === "overview" && c.type === "definition") {
          score += 30;
          signals.push("concept:definition_match");
        } else if (section === "how" && (c.type === "procedure" || c.type === "mechanism")) {
          score += 26;
          signals.push("concept:mechanism_match");
        } else {
          score += 12;
          signals.push("concept:member");
        }
      } else if (bestShared === 1) {
        // weak membership: still a useful signal for terse facts (avoid rejecting them)
        conceptIds.push(c.id);
        score += 6;
        signals.push("concept:member_weak");
      } else {
        // As a last resort, if fact mentions a topic keyword, give a small boost
        for (const t of factTokens) {
          if (topicWords.has(t)) {
            score += 4;
            signals.push("topic:matches_token");
            break;
          }
        }
      }
    }
  } catch (e) {
    // topic model failure should not be fatal; log minimal signal
    signals.push("concept:build_failed");
    reasons.push("topic model unavailable");
  }

  // Section-specific nudges (evidence-based)
  if (section === "why" && /\b(because|purpose|reason|so that|as a result|benefit)\b/i.test(f)) {
    score += 12;
    signals.push("section:why_signal");
  }
  if (section === "how" && /\b(step|first|next|then|process|workflow|by|through|using|implement|build|deploy)\b/i.test(f)) {
    score += 12;
    signals.push("section:how_signal");
  }
  if (section === "practical" && /\b(used in|used for|who|when|benefit|scenario|case|everyday|typical)\b/i.test(f)) {
    score += 12;
    signals.push("section:practical_signal");
  }

  // Final composite decision: allow if strong semantic priority OR concept membership OR composite score positive.
  // Important: do not let a single rule veto — require multiple negative signals to reject.
  const negativeSignals = signals.filter((s) => /^surface:|^noise:|^wiki|topic:weak|usefulness:no_verb_low_value|^fragment_opener/.test(s));
  const positiveSignals = signals.filter((s) => /^concept:|^value:|^reader:|surface:verb|section:/.test(s));

  // Adjust score slightly by counts
  score = Math.max(0, Math.min(100, Math.round(score + (positiveSignals.length - negativeSignals.length) * 6)));

  // Decision rules (evidence-based):
  // - If concept membership exists -> keep
  // - Else if semantic priority >= MIN_COMPOSE_PRIORITY -> keep
  // - Else if score >= 36 and positiveSignals exist -> keep
  // - Otherwise reject
  let kept = false;
  if (conceptIds.length > 0) {
    kept = true;
    reasons.push("kept_by_concept_membership");
  } else if (ranked.priority >= MIN_COMPOSE_PRIORITY) {
    kept = true;
    reasons.push("kept_by_semantic_priority");
  } else if (score >= 36 && positiveSignals.length > 0) {
    kept = true;
    reasons.push("kept_by_composite_evidence");
  } else {
    kept = false;
    reasons.push("rejected_by_composite_evidence");
  }

  return {
    fact,
    score,
    kept,
    signals,
    reasons,
    conceptIds,
  };
}

export default assessFactForSection;

