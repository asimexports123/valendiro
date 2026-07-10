/**
 * Brain discourse — compose coherent paragraphs from meaning (no LLM, no topic templates).
 */

import type { UnderstoodClaim } from "./brainUnderstanding";
import { understandFact } from "./brainUnderstanding";
import type { FactKind } from "./languageSystem/types";
import type { NarrationVoice } from "./brainNarration";
import {
  deriveCentralIdea,
  planDiscourseFromMeaning,
  planSectionBridge,
} from "./brainDiscoursePlanner";
import { surfaceParaphrase } from "./brainParaphrase";
import { pickSupportMarker, stripOverusedDiscourse } from "./brainDiscourseVariety";

export { deriveCentralIdea } from "./brainDiscoursePlanner";

export interface DiscourseUnit {
  centralIdea: string;
  lead: string;
  support: string;
  voice?: NarrationVoice;
}

function capitalize(s: string): string {
  const t = s.trim();
  if (!t) return t;
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function ensurePeriod(s: string): string {
  const t = s.trim();
  if (!t) return t;
  return /[.!?]$/.test(t) ? t : `${t}.`;
}

function lowerFirstWord(s: string): string {
  const m = s.match(/^(\S+)([\s\S]*)$/);
  if (!m) return s;
  const word = m[1];
  const rest = m[2];
  if (/^[A-Z]{2,}$/.test(word)) return s;
  return `${word.charAt(0).toLowerCase()}${word.slice(1)}${rest}`;
}

function linkSupport(_lead: string, support: string, seed: number, voice: NarrationVoice = "explain"): string {
  const trimmed = support.trim();
  if (!trimmed) return "";
  const s = capitalize(
    trimmed.replace(
      /^(this matters because|in practice,|that is why|as a result,|put simply,|the point is)\s*/i,
      ""
    )
  );
  if (/^(This|That|These|In practice|As a result|Put simply|The point|So|Unlike|By contrast|Think|You see|Why|Walking|What to|Everything|Keep|From|Teams|Good|Most|If|That sentence|Hold|Each|The sections|Applied|Naming|Concrete|People|The|You have|For example|Related|When|Without|Practitioners|Treat|Following|In real|A familiar|Match|The upside|Those|Naming the|The caveat|Ignoring|Catching|Most failures|One example|If you can|Return)\b/i.test(trimmed)) {
    return ensurePeriod(s);
  }
  const marker = pickSupportMarker(voice, seed);
  if (!marker) return ensurePeriod(s);
  return ensurePeriod(`${marker} ${lowerFirstWord(s)}`);
}

/** Compose a paragraph: one central idea, optional linked support (no filler padding). */
export function composeDiscourse(unit: DiscourseUnit, seed: number, voice: NarrationVoice = "explain"): string {
  const v = unit.voice ?? voice;
  const lead = ensurePeriod(capitalize(surfaceParaphrase(unit.lead, seed)));
  const supportRaw = unit.support?.trim() ?? "";
  if (!supportRaw) {
    return stripOverusedDiscourse(lead);
  }
  const support = linkSupport(unit.lead, surfaceParaphrase(supportRaw, seed + 1), seed, v);
  if (!support) return stripOverusedDiscourse(lead);
  return stripOverusedDiscourse(`${lead} ${support}`);
}

/** Compose a full paragraph from understood meaning — never topic-specific templates. */
export function composeDiscourseParagraph(
  claim: UnderstoodClaim,
  topicRef: string,
  kind: FactKind,
  seed: number,
  voice: NarrationVoice = "explain",
  sectionId = "overview",
  isFirstAnswer = false,
  followOn?: UnderstoodClaim
): string | null {
  const planned = planDiscourseFromMeaning(
    claim,
    topicRef,
    kind,
    sectionId,
    seed,
    isFirstAnswer,
    followOn
  );
  const unit: DiscourseUnit = {
    centralIdea: planned.centralIdea,
    lead: planned.lead,
    support: planned.support,
    voice: planned.voice,
  };
  return composeDiscourse(unit, seed, voice ?? planned.voice);
}

/** Section closer as coherent discourse. */
export function composeSectionDiscourse(
  sectionId: string,
  topicLabel: string,
  seed: number
): string {
  const bridge = planSectionBridge(sectionId, topicLabel);
  return composeDiscourse(
    {
      centralIdea: `section bridge`,
      lead: bridge.lead,
      support: bridge.support,
      voice: bridge.voice,
    },
    seed,
    bridge.voice
  );
}

/** Intro paragraph for one slot. */
export function composeIntroSlot(
  fact: string,
  topicRef: string,
  kind: FactKind,
  seed: number,
  isFirstAnswer = false
): string | null {
  const claim = understandFact(fact, topicRef, kind);
  return composeDiscourseParagraph(claim, topicRef, kind, seed, "explain", "overview", isFirstAnswer);
}

/** @deprecated — all discourse routes through planDiscourseFromMeaning */
export function planDiscourse(
  _fact: string,
  _topicRef: string,
  _kind: FactKind,
  _seed: number
): DiscourseUnit | null {
  return null;
}

/** @deprecated — use planDiscourseFromMeaning */
export function planGenericDiscourse(
  claim: UnderstoodClaim,
  topicRef: string,
  kind: FactKind,
  voice: NarrationVoice,
  sectionId = "overview"
): DiscourseUnit {
  const planned = planDiscourseFromMeaning(claim, topicRef, kind, sectionId);
  return {
    centralIdea: planned.centralIdea,
    lead: planned.lead,
    support: planned.support,
    voice: planned.voice ?? voice,
  };
}
