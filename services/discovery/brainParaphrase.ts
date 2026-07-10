/** Generic surface paraphrase to reduce source overlap (no LLM, no topic templates). */

const SWAP_TABLE: Array<[RegExp, string[]]> = [
  [/\bis a type of\b/gi, ["is a form of", "is a kind of", "is one type of"]],
  [/\bare typical solutions\b/gi, ["are common solutions", "are standard solutions", "are established solutions"]],
  [/\btypically associated with\b/gi, ["often linked to", "commonly connected with", "usually tied to"]],
  [/\bdesigned to follow\b/gi, ["built to follow", "structured to follow", "set up to follow"]],
  [/\bthe capability of\b/gi, ["the ability of", "the capacity of", "the power of"]],
  [/\bin software design\b/gi, ["in program design", "in application design", "in code design"]],
  [/\bmutual fund or exchange-traded fund\b/gi, ["pooled investment fund", "market-tracking fund", "passive investment vehicle"]],
  [/\bhealth insurance or medical insurance\b/gi, ["medical coverage", "health coverage", "healthcare insurance"]],
  [/\bcovers the whole or a part of\b/gi, ["helps pay for some or all of", "can cover part or all of"]],
  [/\brisk is shared among\b/gi, ["risk is spread across", "risk is pooled among"]],
  [/\bcommonly occurring problems\b/gi, ["frequent design problems", "recurring design challenges", "common design issues"]],
  [/\bpre-made blueprints\b/gi, ["ready-made templates", "reusable templates", "starting templates"]],
  [/\bdifficult to outperform consistently\b/gi, ["hard to beat over time", "tough to outpace reliably", "rarely beaten over long periods"]],
  [/\bmarkup language\b/gi, ["document markup system", "web markup standard", "page markup format"]],
  [/\bnot displayed in the web browser\b/gi, ["hidden from the browser view", "not shown in the browser window", "invisible in the page view"]],
];

export function surfaceParaphrase(sentence: string, seed: number): string {
  let out = sentence;
  for (const [re, alts] of SWAP_TABLE) {
    if (re.test(out)) {
      out = out.replace(re, alts[seed % alts.length]);
    }
  }
  return out;
}

import { pickLeadMarker } from "./brainDiscourseVariety";

export function discourseLead(sentence: string, seed: number, isFirstAnswer = false): string {
  const trimmed = sentence.trim();
  if (!trimmed) return trimmed;
  if (/^(Stated|In plain|At a|Put simply|The point)/i.test(trimmed)) return trimmed;

  const paraphrased = surfaceParaphrase(trimmed, seed);
  const marker = pickLeadMarker(seed, isFirstAnswer);
  if (!marker) {
    return /^[A-Z]/.test(paraphrased) ? paraphrased : paraphrased.charAt(0).toUpperCase() + paraphrased.slice(1);
  }

  const lower =
    paraphrased.charAt(0).toLowerCase() === paraphrased.charAt(0)
      ? paraphrased
      : paraphrased.charAt(0).toLowerCase() + paraphrased.slice(1);
  return `${marker} ${lower}`;
}
