import type { FactKind } from "./types";
import type { MeaningSlots } from "./semantics";
import { getFallbackPhrases, joinKeywords, pick } from "./lexicon";

export interface SentencePlan {
  template: string;
  slots: Record<string, string>;
  kind: FactKind;
}

const DEFINITION_TEMPLATES = [
  "{topic} {be} best understood through {phrase}.",
  "At its core, {topic} {be} tied to {phrase}.",
  "Readers often connect {topic} with {phrase}.",
  "In plain terms, {topic} {be} about {phrase}.",
  "The concept of {topic} centers on {phrase}.",
  "{topic} can be framed around {phrase}.",
  "Fundamentally, {topic} {be} linked to {phrase}.",
  "When people refer to {topic}, they usually mean {phrase}.",
  "{topic} essentially revolves around {phrase}.",
  "A working definition: {topic} {be} connected to {phrase}.",
  "{topic} represents ideas like {phrase}.",
  "Think of {topic} in terms of {phrase}.",
  "{topic} boils down to themes such as {phrase}.",
  "Experts describe {topic} through {phrase}.",
  "{topic} {be} fundamentally shaped by {phrase}.",
  "In this guide, {topic} {be} explored via {phrase}.",
  "{topic} {be} a topic touching {phrase}.",
  "The essence of {topic} {be} found in {phrase}.",
  "{topic} {be} closely tied to {phrase}.",
  "To grasp {topic}, start with {phrase}.",
  "Put simply, {topic} {be} concerned with {phrase}.",
];

const PROPERTY_TEMPLATES = [
  "{topic} {be} characterized by {phrase}.",
  "One notable aspect of {topic} involves {phrase}.",
  "{topic} typically reflects {phrase}.",
  "A key property of {topic}: {phrase}.",
  "In practice, {topic} {be} marked by {phrase}.",
  "{topic} {be} known for {phrase}.",
  "Teams working with {topic} notice {phrase}.",
  "{topic} {be} associated with {phrase}.",
  "An important trait of {topic} is {phrase}.",
  "{topic} {be} designed around {phrase}.",
  "When evaluating {topic}, consider {phrase}.",
  "{topic} {be} built around {phrase}.",
  "Stakeholders expect {topic} to reflect {phrase}.",
  "{topic} {be} shaped by {phrase}.",
  "A reliable signal for {topic} is {phrase}.",
  "{topic} {be} distinguished by {phrase}.",
  "Professionals note that {topic} {be} linked to {phrase}.",
  "{topic} {be} especially relevant because of {phrase}.",
  "The value of {topic} comes from {phrase}.",
  "Among its features, {topic} {be} noted for {phrase}.",
  "{topic} {be} commonly observed through {phrase}.",
];

const PROCEDURE_TEMPLATES = [
  "To work with {topic}, focus on {phrase}.",
  "A practical approach to {topic} emphasizes {phrase}.",
  "Start with {phrase} when handling {topic}.",
  "The recommended workflow for {topic}: {phrase}.",
  "When applying {topic}, prioritize {phrase}.",
  "Teams typically address {phrase} as part of {topic}.",
  "A step worth taking with {topic} is {phrase}.",
  "For {topic}, begin with {phrase}.",
  "You can lean on {phrase} to get results from {topic}.",
  "One effective method for {topic} is {phrase}.",
  "In day-to-day use of {topic}, cover {phrase}.",
  "Practitioners often tackle {phrase} when using {topic}.",
  "To implement {topic}, address {phrase}.",
  "A clear sequence for {topic}: {phrase}.",
  "When setting up {topic}, plan for {phrase}.",
  "The process behind {topic} usually involves {phrase}.",
  "For reliable outcomes with {topic}, weigh {phrase}.",
  "To move forward with {topic}, review {phrase}.",
  "A hands-on way to use {topic} is through {phrase}.",
  "Before scaling {topic}, validate {phrase}.",
  "Getting value from {topic} means engaging with {phrase}.",
];

const WARNING_TEMPLATES = [
  "A common mistake with {topic} is neglecting {phrase}.",
  "Avoid overlooking {phrase} when working on {topic}.",
  "Watch out: {phrase} can undermine {topic}.",
  "Beginners often mishandle {phrase} with {topic} — steer clear of that.",
  "One pitfall in {topic} is {phrase}.",
  "{topic} fails when teams ignore {phrase}.",
  "Do not skip {phrase} if you want {topic} to succeed.",
  "A costly error around {topic} is {phrase}.",
  "Risk increases when {phrase} are mishandled in the context of {topic}.",
  "Poor outcomes with {topic} often trace back to {phrase}.",
  "Experts caution against {phrase} for {topic}.",
  "If you overlook {phrase}, {topic} becomes harder to manage.",
  "A red flag for {topic} is {phrase}.",
  "Never treat {phrase} as a shortcut with {topic}.",
  "The wrong move with {topic} is ignoring {phrase}.",
  "Trouble with {topic} usually starts when {phrase} go wrong.",
  "Overlooking {phrase} can damage {topic} outcomes.",
  "A warning sign: {phrase} during {topic} work.",
  "Protect {topic} by respecting {phrase}.",
  "Missteps with {topic} include {phrase}.",
  "Guard against {phrase} when tackling {topic}.",
];

const COMPARISON_TEMPLATES = [
  "Compared with alternatives, {topic} {be} judged by {phrase}.",
  "When weighing options for {topic}, compare {phrase}.",
  "{topic} differs from other approaches through {phrase}.",
  "In contrast to similar topics, {topic} {be} defined by {phrase}.",
  "Side by side, {topic} {be} evaluated via {phrase}.",
  "Where other methods differ, {topic} stands apart on {phrase}.",
  "Choosing {topic} over alternatives means weighing {phrase}.",
  "Relative to peers, {topic} {be} noted for {phrase}.",
  "The trade-off with {topic} is tied to {phrase}.",
  "Unlike related concepts, {topic} {be} framed by {phrase}.",
  "Decision-makers compare {topic} by noting {phrase}.",
  "{topic} versus alternatives: {phrase}.",
  "Benchmarking {topic} shows {phrase}.",
  "When {topic} is set against rivals, {phrase} matter.",
  "A fair comparison of {topic} reveals {phrase}.",
  "{topic} wins on points around {phrase}.",
  "Evaluators often find {topic} {be} distinct through {phrase}.",
  "Stacked against substitutes, {topic} {be} measured by {phrase}.",
  "The contrast with {topic} is {phrase}.",
  "Pick {topic} when {phrase} fit your goals.",
  "In competitive settings, {topic} {be} assessed via {phrase}.",
];

const MEASUREMENT_TEMPLATES = [
  "A useful benchmark for {topic}: roughly {number}, alongside {phrase}.",
  "A useful benchmark for {topic}: {phrase}.",
  "Numbers around {topic} show {number} and {phrase}.",
  "Numbers around {topic} show {phrase}.",
  "Metrics for {topic} indicate {phrase}.",
  "Data on {topic} suggests {phrase}.",
  "Quantitatively, {topic} {be} tracked through {phrase}.",
  "Studies report that {topic} {be} measured via {phrase}.",
  "Measured outcomes for {topic} include {phrase}.",
  "Typical figures for {topic} relate to {phrase}.",
  "Performance data on {topic} {be} tied to {phrase}.",
  "Analysts track {topic} via {phrase}.",
  "Scale matters: {topic} {be} understood through {phrase}.",
  "Observed rates for {topic} {be} linked to {phrase}.",
  "Reporting on {topic} often cites {phrase}.",
  "Benchmarks suggest {topic} {be} reflected in {phrase}.",
  "Survey data ties {topic} to {phrase}.",
  "The magnitude of {topic} {be} captured by {phrase}.",
  "Statistical views of {topic} {be} built on {phrase}.",
  "Recorded values for {topic} {be} associated with {phrase}.",
  "Trend lines for {topic} {be} explained by {phrase}.",
];

const TEMPLATE_SETS: Record<FactKind, string[]> = {
  definition: DEFINITION_TEMPLATES,
  property: PROPERTY_TEMPLATES,
  procedure: PROCEDURE_TEMPLATES,
  warning: WARNING_TEMPLATES,
  comparison: COMPARISON_TEMPLATES,
  measurement: MEASUREMENT_TEMPLATES,
};

function selectTemplate(kind: FactKind, slots: MeaningSlots, seed: number): string {
  const templates = TEMPLATE_SETS[kind];
  let pool = templates;

  if (kind === "measurement" && !slots.numberPhrase) {
    pool = templates.filter((t) => !t.includes("{number}"));
  } else if (kind === "measurement" && slots.numberPhrase) {
    pool = templates.filter((t) => t.includes("{number}") || !t.includes("roughly"));
    if (pool.length === 0) pool = templates;
  }

  return pick(pool, seed);
}

const SINGULAR_TOPIC_REFS = new Set(["it", "this field", "the topic", "this subject"]);

/** Build a sentence plan from meaning slots and topic reference. */
export function planSentence(slots: MeaningSlots, topicRef: string, seed: number): SentencePlan {
  const objects =
    slots.objects.length > 0 ? slots.objects : getFallbackPhrases(slots.kind, seed);
  const phrase = joinKeywords(objects.slice(0, 4), seed);
  const refLower = topicRef.toLowerCase();
  const forceSingular =
    SINGULAR_TOPIC_REFS.has(refLower) || (refLower.length <= 4 && refLower === refLower.toUpperCase());
  const be = forceSingular ? "is" : slots.isPlural ? "are" : "is";
  const template = selectTemplate(slots.kind, slots, seed);

  const planSlots: Record<string, string> = {
    topic: topicRef,
    phrase,
    be,
  };
  if (slots.numberPhrase) planSlots.number = slots.numberPhrase;

  return {
    template,
    slots: planSlots,
    kind: slots.kind,
  };
}

/** Realize a sentence plan into valid English SVO prose. */
export function realizePlan(plan: SentencePlan): string {
  let out = plan.template;
  for (const [key, value] of Object.entries(plan.slots)) {
    out = out.replaceAll(`{${key}}`, value);
  }
  return out.replace(/\s+/g, " ").trim();
}

/** Convenience: plan and realize in one step. */
export function realizeFromSlots(slots: MeaningSlots, topicRef: string, seed: number): string {
  return realizePlan(planSentence(slots, topicRef, seed));
}

export { TEMPLATE_SETS };
