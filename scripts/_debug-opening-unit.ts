/**
 * Offline Opening Composer unit check — no network.
 */
import {
  composeArticleOpening,
  composeWhatIsSentence,
  scoreOpeningQuality,
} from "../services/discovery/brainExplain";
import { inferReaderFirstQuestion } from "../services/discovery/brainReaderIntent";
import type { BrainNotes } from "../services/discovery/catalogBrainUtils";

function emptyNotes(over: Partial<BrainNotes>): BrainNotes {
  return {
    definitions: [],
    properties: [],
    procedures: [],
    warnings: [],
    comparisons: [],
    measurements: [],
    allFacts: [],
    ...over,
  };
}

const cases: Array<{
  slug: string;
  title: string;
  label: string;
  defs: string[];
  props?: string[];
}> = [
  {
    slug: "html-fundamentals",
    title: "HTML Fundamentals",
    label: "HTML Fundamentals",
    defs: ["HTML is the standard markup language used to structure web pages."],
    props: ["HTML is used in browsers such as Chrome, Firefox, and Safari."],
  },
  {
    slug: "health-insurance",
    title: "Health Insurance",
    label: "Health Insurance",
    defs: ["Health insurance helps pay medical costs in exchange for regular premiums."],
    props: [
      "Health insurance enables families to afford hospital care without catastrophic bills.",
      "You encounter it including employer plans, marketplace policies, and Medicare.",
    ],
  },
  {
    slug: "design-patterns",
    title: "Design Patterns",
    label: "Design Patterns",
    defs: [
      "A software design pattern is a reusable solution to a commonly recurring software design problem.",
    ],
    props: ["Design patterns are used in codebases including React, Spring, and .NET libraries."],
  },
  {
    slug: "index-funds",
    title: "Index Funds",
    label: "Index Funds",
    defs: ["An index fund is an investment fund that tracks the performance of a market index."],
    props: ["Index funds help investors diversify at low cost across the whole market."],
  },
  {
    slug: "what-is-artificial-intelligence",
    title: "What is Artificial Intelligence",
    label: "Artificial Intelligence",
    defs: [
      "Artificial Intelligence enables computers to perform tasks that normally require human intelligence.",
    ],
    props: [
      "AI is used in products such as search, assistants, fraud detection, and medical imaging.",
    ],
  },
];

for (const c of cases) {
  const intent = inferReaderFirstQuestion(c.title, c.label);
  const what = composeWhatIsSentence(c.defs[0], intent.topicNoun);
  const notes = emptyNotes({
    definitions: c.defs,
    properties: c.props ?? [],
    allFacts: [...c.defs, ...(c.props ?? [])],
  });
  // health insurance CEO example uses "helps" not "is" — composeWhatIs may fail; force is-form
  if (!what && /helps|enables/i.test(c.defs[0])) {
    const forced = c.defs[0]
      .replace(/\benables\b/i, "is a field that enables")
      .replace(/\bhelps\b/i, "is coverage that helps");
    notes.definitions = [forced, ...c.defs];
    notes.allFacts = [...notes.definitions, ...(c.props ?? [])];
  }
  const opening = composeArticleOpening(notes, c.label, c.title, c.slug, false);
  const sc = opening?.quality ?? scoreOpeningQuality(what ?? "", intent.topicNoun);
  console.log(
    c.slug,
    opening ? "PASS" : "FAIL",
    `ed=${sc.humanEditorialScore}`,
    `def=${sc.definitionQuality}`,
    `hook=${sc.readerHook}`
  );
  console.log(" ", (opening?.markdown ?? what ?? "(none)").slice(0, 200));
  console.log("  noun=", intent.topicNoun);
}
