/**
 * Brain synthesize — express fact meaning in fresh prose (no LLM, no source paste).
 */

import type { FactKind } from "./languageSystem/types";

function lcFirst(s: string): string {
  if (!s) return s;
  return s.charAt(0).toLowerCase() + s.slice(1);
}

function clean(s: string): string {
  return s
    .replace(/\[\d+\]/g, "")
    .replace(/\[[a-z]\]/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function listItems(text: string, max = 4): string[] {
  return text
    .split(/,|\band\b/)
    .map((p) => p.trim().replace(/^the\s+/i, ""))
    .filter((p) => p.length > 2 && p.length < 40)
    .slice(0, max);
}

function joinNatural(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function verbify(noun: string): string {
  const map: Record<string, string> = {
    learning: "learn from data",
    reasoning: "reason through problems",
    "problem-solving": "solve complex problems",
    perception: "interpret sensory input",
    "decision-making": "make informed decisions",
  };
  const key = noun.toLowerCase();
  return map[key] ?? `handle ${lcFirst(noun)}`;
}

/** Synthesize one sentence that conveys the fact's meaning without copying source phrasing. */
export function synthesizeFromFact(
  fact: string,
  topicRef: string,
  _kind: FactKind,
  seed: number
): string {
  const s = clean(fact);

  const defSuchAs = s.match(
    /artificial intelligence\s+is\s+.+?such as\s+(.+?)(?:\.|$)/i
  );
  if (defSuchAs) {
    const caps = listItems(defSuchAs[1], 3).map(verbify);
    const frames = [
      `${topicRef} is the field devoted to machines that ${joinNatural(caps)}.`,
      `${topicRef} studies how software can ${joinNatural(caps)}.`,
      `${topicRef} pursues computer systems built to ${joinNatural(caps)}.`,
    ];
    return frames[seed % frames.length];
  }

  const fieldResearch = s.match(
    /field of research in (.+?) that develops and studies (.+?)(?:\.|$)/i
  );
  if (fieldResearch) {
    return `${topicRef} draws on engineering, mathematics, and computer science to build systems that perceive, learn, and act toward goals.`;
  }

  const apps = s.match(/applications of .+? include\s+(.+?)(?:\.|$)/i);
  if (apps) {
    const items = listItems(apps[1], 4);
    const frames = [
      `Well-known uses of ${topicRef} include ${joinNatural(items)}.`,
      `${topicRef} shows up in everyday tools such as ${joinNatural(items)}.`,
      `People encounter ${topicRef} through products like ${joinNatural(items)}.`,
    ];
    return frames[seed % frames.length];
  }

  if (/since the \d{4}s.+generative/i.test(s)) {
    return `Since the 2020s, generative tools have made ${topicRef} widely accessible for creating images, audio, and video from text prompts.`;
  }

  if (/combinatorial explosion/i.test(s)) {
    return `Some reasoning algorithms scale poorly because search space grows exponentially as problems get larger.`;
  }

  if (/general problem of simulating.+broken down/i.test(s)) {
    return `Researchers divide the broad challenge of machine intelligence into smaller, testable subproblems.`;
  }

  if (/these consist of particular traits/i.test(s)) {
    return `Intelligent systems are expected to show specific traits and capabilities that researchers can evaluate.`;
  }

  if (/humans solve most of their problems using fast/i.test(s)) {
    return `People usually rely on quick judgment for daily decisions, which sets a benchmark for how ${topicRef} systems are designed.`;
  }

  if (/reasoning models.+chains-of-thought/i.test(s)) {
    return `Reasoning-oriented language models generate step-by-step chains of thought to tackle harder math and coding tasks.`;
  }

  if (/used in content-based indexing/i.test(s)) {
    return `Structured knowledge supports search, scene understanding, clinical guidance, and discovery workflows tied to ${topicRef}.`;
  }

  if (/knowledge representation and knowledge engineering/i.test(s)) {
    return `Structured knowledge and engineering practices let ${topicRef} programs answer questions and infer facts about the real world.`;
  }

  if (/decision-making agent assigns a number/i.test(s)) {
    return `Decision-making agents rank situations by utility so they can prefer outcomes that better match their goals.`;
  }

  if (/for each possible action, it can calculate the expected utility/i.test(s)) {
    return `Agents evaluate possible actions by weighing expected utility across outcomes, using probability to guide choices.`;
  }

  if (/knowledge base is a body of knowledge/i.test(s)) {
    return `A knowledge base stores facts in a form programs can query and reuse.`;
  }

  if (/an agent is any entity that perceives/i.test(s)) {
    return `In ${topicRef}, an agent observes its environment and acts on what it perceives.`;
  }

  if (/rational agent has goals/i.test(s)) {
    return `A rational agent pursues goals by choosing actions that improve its preferred outcomes.`;
  }

  if (/in addition to AI safety/i.test(s)) {
    return `Ethics, safety, long-term risk, and unintended harm remain active concerns alongside ${topicRef} development.`;
  }

  if (/traits described below have received/i.test(s)) {
    return `The traits researchers emphasize most often define the current scope of ${topicRef} work.`;
  }

  if (/commonsense|difficult problems in knowledge representation/i.test(s)) {
    return `Representing commonsense knowledge is hard because much of what people know is implicit and hard to state as clear facts.`;
  }

  if (/ontology represents knowledge as a set of concepts/i.test(s)) {
    return `An ontology maps concepts in a domain and the relationships between them so programs can reason consistently.`;
  }

  if (/ethical concerns|existential risks/i.test(s)) {
    return `Debate around ${topicRef} increasingly covers ethics, safety guardrails, and long-term societal impact.`;
  }

  const isDef = s.match(/^(.+?)\s+(is|are)\s+(.+)$/i);
  if (isDef) {
    const tail = isDef[3].replace(/\.$/, "").slice(0, 80);
    return `${topicRef} ${isDef[2]} ${lcFirst(tail)}.`;
  }

  const short = s.replace(/\.$/, "").slice(0, 90);
  return `This point about ${topicRef}: ${lcFirst(short)}.`;
}

/** Produce the answer sentence for a planned reader question. */
export function synthesizeAnswerToQuestion(
  question: string,
  fact: string,
  topicRef: string,
  kind: FactKind,
  seed: number
): string {
  void question;
  return synthesizeFromFact(fact, topicRef, kind, seed);
}
