import type { FactKind } from "./types";
import { BRAIN_SECTION_HEADINGS } from "@/services/content/topicHeading";
import { acronymFromLabel, pick } from "./lexicon";

export interface ArticleSectionPlan {
  id: string;
  heading: string;
  factKinds: FactKind[];
  maxFacts: number;
}

const OPENING_HOOKS = [
  (ref: string) => `${ref} is clearest when you separate what it is from how it is used.`,
  (ref: string) => `Start with a working definition of ${ref}, then look at where it shows up.`,
  (ref: string) => `${ref} makes more sense once you can name one concrete case.`,
  (ref: string) => `People explain ${ref} best by stating the core idea, then one example.`,
  (ref: string) => `The recurring themes in ${ref} matter more than a long glossary of near-synonyms.`,
];

const GENERIC_SECTION_HEADINGS = new Set([
  "key concepts",
  "why it exists",
  "how it works",
  "practical applications",
  "common mistakes to avoid",
  "summary",
  "next steps",
  "what you'll learn",
]);

function headingTopicRef(heading: string, topicLabel: string): string {
  const clean = heading
    .replace(/^(what|how|why)\s+(is|are)\s+/i, "")
    .replace(/\?+$/g, "")
    .trim();
  const norm = clean.toLowerCase();
  if (GENERIC_SECTION_HEADINGS.has(norm)) return topicLabel;
  const acronym = acronymFromLabel(clean) ?? acronymFromLabel(topicLabel);
  if (acronym && clean.split(/\s+/).length >= 3) return topicLabel;
  if (acronym) return acronym;
  if (clean.split(/\s+/).length >= 3) return topicLabel;
  return clean || topicLabel || "the topic";
}

/** Opening line for a section without repeating the H2 verbatim. */
export function sectionHook(heading: string, topicLabel: string, seed: number): string {
  const ref = headingTopicRef(heading, topicLabel);
  return pick(OPENING_HOOKS, seed)(ref);
}

/** Standard narrative article plan — What → Why → How → Concepts → Apps → Mistakes → Summary. */
export function planArticleSections(displayName: string): ArticleSectionPlan[] {
  return [
    {
      id: "overview",
      heading: BRAIN_SECTION_HEADINGS.overview(displayName),
      factKinds: ["definition"],
      maxFacts: 4,
    },
    {
      id: "why",
      heading: BRAIN_SECTION_HEADINGS.why,
      factKinds: ["property", "definition"],
      maxFacts: 6,
    },
    {
      id: "how",
      heading: BRAIN_SECTION_HEADINGS.how,
      factKinds: ["procedure", "property"],
      maxFacts: 6,
    },
    {
      id: "keyConcepts",
      heading: BRAIN_SECTION_HEADINGS.keyConcepts,
      factKinds: ["property", "measurement", "comparison"],
      maxFacts: 12,
    },
    {
      id: "practical",
      heading: BRAIN_SECTION_HEADINGS.practical,
      factKinds: ["procedure"],
      maxFacts: 8,
    },
    {
      id: "mistakes",
      heading: BRAIN_SECTION_HEADINGS.mistakes,
      factKinds: ["warning"],
      maxFacts: 8,
    },
    {
      id: "summary",
      heading: BRAIN_SECTION_HEADINGS.summary,
      factKinds: ["property", "definition"],
      maxFacts: 6,
    },
  ];
}
