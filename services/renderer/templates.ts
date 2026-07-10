/**
 * Template Library — Sentence, Paragraph, Section, Transitions, Grammar
 *
 * All template selections are deterministic via seeded hash.
 * No randomness. Same inputs = same output.
 */

// ─── Deterministic Variant Selection ─────────────────────────────────────────

export function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit int
  }
  return Math.abs(hash);
}

export function selectVariant<T>(variants: T[], factIndex: number, slug: string): T {
  const seed = hashCode(`${slug}:${factIndex}`);
  return variants[seed % variants.length];
}

// ─── Sentence Templates ──────────────────────────────────────────────────────

export interface SentenceTemplate {
  id: string;
  factType: string;
  styles: string[];
  variants: string[];
}

// {subject} = extracted subject, {predicate} = rest of the statement
export const SENTENCE_TEMPLATES: SentenceTemplate[] = [
  // Definition — 12 variants for maximum diversity
  {
    id: "def-standard",
    factType: "definition",
    styles: ["intermediate", "formal"],
    variants: [
      "{statement}.",
      "In essence, {statement_lower}.",
      "Put simply, {statement_lower}.",
      "By definition, {statement_lower}.",
      "At its core, {statement_lower}.",
      "To be precise, {statement_lower}.",
      "Fundamentally, {statement_lower}.",
      "The concept is straightforward: {statement_lower}.",
      "{statement}.",
      "This can be understood as follows: {statement_lower}.",
      "In technical terms, {statement_lower}.",
      "The essential idea is that {statement_lower}.",
    ],
  },
  {
    id: "def-expert",
    factType: "definition",
    styles: ["expert", "concise"],
    variants: [
      "{statement}.",
      "Formally: {statement_lower}.",
      "{statement}.",
      "Defined: {statement_lower}.",
    ],
  },
  {
    id: "def-beginner",
    factType: "definition",
    styles: ["beginner", "casual"],
    variants: [
      "{statement}.",
      "This means that {statement_lower}.",
      "In other words, {statement_lower}.",
      "Think of it this way: {statement_lower}.",
      "Simply put, {statement_lower}.",
      "Here's the basic idea: {statement_lower}.",
      "What this really means is that {statement_lower}.",
      "The simplest explanation is that {statement_lower}.",
    ],
  },

  // Property — 10 variants
  {
    id: "prop-standard",
    factType: "property",
    styles: ["intermediate", "formal"],
    variants: [
      "{statement}.",
      "Notably, {statement_lower}.",
      "It is worth noting that {statement_lower}.",
      "An important characteristic is that {statement_lower}.",
      "One distinguishing feature is that {statement_lower}.",
      "A key aspect to consider: {statement_lower}.",
      "Among its notable qualities, {statement_lower}.",
      "{statement}.",
      "What stands out is that {statement_lower}.",
      "A defining trait is that {statement_lower}.",
    ],
  },
  {
    id: "prop-expert",
    factType: "property",
    styles: ["expert", "concise"],
    variants: [
      "{statement}.",
      "{statement}.",
      "Key: {statement_lower}.",
      "Note: {statement_lower}.",
    ],
  },
  {
    id: "prop-beginner",
    factType: "property",
    styles: ["beginner", "casual"],
    variants: [
      "{statement}.",
      "One key feature is that {statement_lower}.",
      "Something worth knowing is that {statement_lower}.",
      "You'll find that {statement_lower}.",
      "An interesting point: {statement_lower}.",
      "Here's something useful to know: {statement_lower}.",
      "What makes this noteworthy is that {statement_lower}.",
      "Worth mentioning: {statement_lower}.",
    ],
  },

  // Historical — 10 variants
  {
    id: "hist-standard",
    factType: "historical",
    styles: ["intermediate", "formal"],
    variants: [
      "{statement}.",
      "Historically, {statement_lower}.",
      "Looking back, {statement_lower}.",
      "The historical record shows that {statement_lower}.",
      "Over time, {statement_lower}.",
      "Dating back to its origins, {statement_lower}.",
      "From a historical perspective, {statement_lower}.",
      "The story begins with the fact that {statement_lower}.",
      "In the timeline of its development, {statement_lower}.",
      "Tracing its roots, {statement_lower}.",
    ],
  },
  {
    id: "hist-expert",
    factType: "historical",
    styles: ["expert", "concise"],
    variants: [
      "{statement}.",
      "Historically: {statement_lower}.",
      "{statement}.",
    ],
  },

  // Causal — 8 variants
  {
    id: "causal-standard",
    factType: "causal",
    styles: ["intermediate", "formal", "expert"],
    variants: [
      "{statement}.",
      "As a consequence, {statement_lower}.",
      "This leads to the outcome that {statement_lower}.",
      "The direct result is that {statement_lower}.",
      "Because of this, {statement_lower}.",
      "This has the effect that {statement_lower}.",
      "The implication is clear: {statement_lower}.",
      "One direct outcome is that {statement_lower}.",
    ],
  },

  // Procedural — 8 variants
  {
    id: "proc-standard",
    factType: "procedural",
    styles: ["intermediate", "beginner", "formal"],
    variants: [
      "{statement}.",
      "To accomplish this, {statement_lower}.",
      "The process involves the following: {statement_lower}.",
      "In practice, {statement_lower}.",
      "The recommended approach is to note that {statement_lower}.",
      "When working through this, {statement_lower}.",
      "A practical step: {statement_lower}.",
      "To put this into action, {statement_lower}.",
    ],
  },

  // Warning — 8 variants
  {
    id: "warn-standard",
    factType: "warning",
    styles: ["intermediate", "beginner", "formal", "expert"],
    variants: [
      "{statement}.",
      "It is important to note that {statement_lower}.",
      "Be aware that {statement_lower}.",
      "Exercise caution: {statement_lower}.",
      "A critical consideration is that {statement_lower}.",
      "Do not overlook the fact that {statement_lower}.",
      "Pay attention to this: {statement_lower}.",
      "One must remember that {statement_lower}.",
    ],
  },

  // Comparison — 8 variants
  {
    id: "comp-standard",
    factType: "comparison",
    styles: ["intermediate", "formal", "expert"],
    variants: [
      "{statement}.",
      "When comparing, {statement_lower}.",
      "In contrast, {statement_lower}.",
      "The distinction is that {statement_lower}.",
      "What sets this apart is that {statement_lower}.",
      "Unlike alternatives, {statement_lower}.",
      "A notable difference: {statement_lower}.",
      "From a comparative standpoint, {statement_lower}.",
    ],
  },

  // Measurement — 8 variants
  {
    id: "meas-standard",
    factType: "measurement",
    styles: ["intermediate", "formal", "expert", "beginner"],
    variants: [
      "{statement}.",
      "By the numbers, {statement_lower}.",
      "Quantitatively, {statement_lower}.",
      "The data shows that {statement_lower}.",
      "In measurable terms, {statement_lower}.",
      "The figures indicate that {statement_lower}.",
      "Statistically speaking, {statement_lower}.",
      "According to available data, {statement_lower}.",
    ],
  },

  // Rule — 8 variants
  {
    id: "rule-standard",
    factType: "rule",
    styles: ["intermediate", "formal", "expert", "beginner"],
    variants: [
      "{statement}.",
      "As a rule, {statement_lower}.",
      "It is required that {statement_lower}.",
      "Best practice dictates that {statement_lower}.",
      "The guiding principle is that {statement_lower}.",
      "An established convention is that {statement_lower}.",
      "It should always be the case that {statement_lower}.",
      "The accepted standard is that {statement_lower}.",
    ],
  },

  // Fallback for any type
  {
    id: "generic",
    factType: "*",
    styles: ["*"],
    variants: [
      "{statement}.",
      "{statement}.",
      "It is notable that {statement_lower}.",
      "Worth considering: {statement_lower}.",
    ],
  },
];

export function findSentenceTemplate(factType: string, styles: string[]): SentenceTemplate {
  // Find best match: exact factType + style overlap
  const candidates = SENTENCE_TEMPLATES.filter(
    (t) =>
      (t.factType === factType || t.factType === "*") &&
      (t.styles.includes("*") || t.styles.some((s) => styles.includes(s)))
  );

  // Prefer exact factType match over wildcard
  const exact = candidates.filter((t) => t.factType === factType);
  return exact.length > 0 ? exact[0] : candidates[0] ?? SENTENCE_TEMPLATES[SENTENCE_TEMPLATES.length - 1];
}

export function renderSentence(
  statement: string,
  factType: string,
  styles: string[],
  factIndex: number,
  slug: string
): string {
  const template = findSentenceTemplate(factType, styles);
  const variant = selectVariant(template.variants, factIndex, slug);
  return variant
    .replace("{statement}", statement)
    .replace("{statement_lower}", lowercaseFirst(statement));
}

// ─── Paragraph Templates ─────────────────────────────────────────────────────

export interface ParagraphPattern {
  id: string;
  structure: ("topic" | "supporting" | "transition")[];
}

export const PARAGRAPH_PATTERNS: ParagraphPattern[] = [
  { id: "topic-support-2", structure: ["topic", "supporting", "supporting"] },
  { id: "topic-support-3", structure: ["topic", "supporting", "supporting", "supporting"] },
  { id: "topic-support-1", structure: ["topic", "supporting"] },
  { id: "topic-transition", structure: ["topic", "supporting", "transition"] },
];

export function selectParagraphPattern(factCount: number, sectionIndex: number, slug: string): ParagraphPattern {
  if (factCount <= 2) return PARAGRAPH_PATTERNS[2]; // topic + 1 support
  if (factCount <= 3) return PARAGRAPH_PATTERNS[0]; // topic + 2 support
  const seed = hashCode(`${slug}:para:${sectionIndex}`);
  return PARAGRAPH_PATTERNS[seed % PARAGRAPH_PATTERNS.length];
}

// ─── Section Templates ───────────────────────────────────────────────────────

export interface SectionTemplate {
  id: string;
  factType: string;
  headingVariants: string[];
  minFacts: number;
  order: number;
}

export const SECTION_TEMPLATES: SectionTemplate[] = [
  {
    id: "definition",
    factType: "definition",
    headingVariants: ["What is {subject}?", "Overview", "{subject}: An Overview", "Introduction to {subject}"],
    minFacts: 1,
    order: 1,
  },
  {
    id: "property",
    factType: "property",
    headingVariants: ["Key Features", "Characteristics", "Properties of {subject}", "Notable Features"],
    minFacts: 2,
    order: 2,
  },
  {
    id: "historical",
    factType: "historical",
    headingVariants: ["History", "Background", "Origins and History", "Historical Context"],
    minFacts: 1,
    order: 3,
  },
  {
    id: "procedural",
    factType: "procedural",
    headingVariants: ["How To", "Getting Started", "Step by Step", "Usage Guide"],
    minFacts: 1,
    order: 4,
  },
  {
    id: "comparison",
    factType: "comparison",
    headingVariants: ["Comparisons", "How It Compares", "Comparison", "Versus"],
    minFacts: 2,
    order: 5,
  },
  {
    id: "measurement",
    factType: "measurement",
    headingVariants: ["By the Numbers", "Statistics", "Key Metrics", "Data Points"],
    minFacts: 1,
    order: 6,
  },
  {
    id: "warning",
    factType: "warning",
    headingVariants: ["Important Considerations", "Warnings", "Common Pitfalls", "Things to Avoid"],
    minFacts: 1,
    order: 7,
  },
  {
    id: "causal",
    factType: "causal",
    headingVariants: ["Causes and Effects", "Impact", "Consequences"],
    minFacts: 1,
    order: 8,
  },
  {
    id: "rule",
    factType: "rule",
    headingVariants: ["Rules and Best Practices", "Guidelines", "Best Practices"],
    minFacts: 1,
    order: 9,
  },
];

export function getSectionHeading(factType: string, subject: string, sectionIndex: number, slug: string): string {
  const section = SECTION_TEMPLATES.find((s) => s.factType === factType);
  if (!section) return factType.charAt(0).toUpperCase() + factType.slice(1);

  const variant = selectVariant(section.headingVariants, sectionIndex, slug);
  return variant.replace("{subject}", subject);
}

// ─── Transitions ─────────────────────────────────────────────────────────────

export const TRANSITIONS = {
  additive: [
    "Additionally, ", "Furthermore, ", "Moreover, ", "In addition, ",
    "Building on this, ", "Expanding further, ", "Along the same lines, ",
    "Equally important, ", "What's more, ", "Beyond this, ",
  ],
  contrastive: [
    "However, ", "On the other hand, ", "That said, ", "Conversely, ",
    "In contrast, ", "Nevertheless, ", "Despite this, ", "While this is true, ",
  ],
  causal: [
    "As a result, ", "Consequently, ", "Therefore, ", "Thus, ",
    "This means that ", "Because of this, ", "It follows that ",
    "The outcome is that ",
  ],
  sequential: [
    "First, ", "Next, ", "Then, ", "Finally, ",
    "To begin, ", "Following this, ", "Afterward, ", "Lastly, ",
  ],
  concluding: [
    "In summary, ", "Overall, ", "To summarize, ", "In conclusion, ",
    "Taken together, ", "All things considered, ", "The key takeaway is that ",
  ],
};

// ─── Section Intro Templates ─────────────────────────────────────────────────

export const SECTION_INTROS: Record<string, string[]> = {
  definition: [
    "Understanding the fundamentals is the first step.",
    "Before diving deeper, it helps to establish a clear foundation.",
    "Let's begin with the core concept.",
  ],
  property: [
    "Several characteristics define this topic and set it apart.",
    "The following features are particularly noteworthy.",
    "A closer look reveals several distinctive qualities.",
  ],
  historical: [
    "The history behind this topic provides valuable context.",
    "Understanding where this came from illuminates where it's going.",
    "The evolution of this subject follows an interesting trajectory.",
  ],
  procedural: [
    "Putting knowledge into practice requires a structured approach.",
    "The following steps outline the practical application.",
    "Here's how to apply this knowledge effectively.",
  ],
  comparison: [
    "Comparing different aspects helps clarify the relative strengths.",
    "Understanding the differences provides important context.",
    "A comparative view reveals important distinctions.",
  ],
  measurement: [
    "Numbers tell an important part of the story.",
    "The quantitative perspective adds concrete evidence.",
    "Looking at the data provides measurable context.",
  ],
  warning: [
    "Awareness of potential issues prevents common mistakes.",
    "Before proceeding, consider these important caveats.",
    "The following points deserve careful attention.",
  ],
  causal: [
    "Understanding cause and effect clarifies the broader impact.",
    "The following connections reveal how different elements interact.",
    "These relationships drive significant outcomes.",
  ],
  rule: [
    "Established guidelines help maintain quality and consistency.",
    "The following principles serve as reliable guides.",
    "These conventions have stood the test of practice.",
  ],
};

export function getSectionIntro(factType: string, sectionIndex: number, slug: string): string {
  const intros = SECTION_INTROS[factType];
  if (!intros || intros.length === 0) return "";
  return selectVariant(intros, sectionIndex, slug);
}

// ─── Section Outro Templates ─────────────────────────────────────────────────

export const SECTION_OUTROS: Record<string, string[]> = {
  definition: [
    "With this foundation established, the remaining details build upon these core ideas.",
    "This understanding forms the basis for everything that follows.",
  ],
  property: [
    "Together, these characteristics create a comprehensive picture.",
    "These features combine to define the complete experience.",
  ],
  historical: [
    "This history continues to shape its present form.",
    "These origins provide important context for current usage.",
  ],
  procedural: [
    "Following these steps produces reliable results.",
    "With practice, these procedures become second nature.",
  ],
  warning: [
    "Keeping these considerations in mind helps avoid common setbacks.",
    "Awareness of these issues leads to better outcomes.",
  ],
};

export function getSectionOutro(factType: string, factCount: number, sectionIndex: number, slug: string): string {
  if (factCount < 4) return ""; // Only add outros for substantial sections
  const outros = SECTION_OUTROS[factType];
  if (!outros || outros.length === 0) return "";
  return selectVariant(outros, sectionIndex + 100, slug);
}

// ─── Inter-Section Transition Templates ──────────────────────────────────────

export const INTER_SECTION_TRANSITIONS: Record<string, Record<string, string[]>> = {
  definition: {
    property: ["With the fundamentals clear, let's examine the specific characteristics.", "Now that the concept is defined, consider what makes it distinctive."],
    historical: ["To understand why it works this way, some historical context helps.", "The origins of this concept shed light on its current form."],
    procedural: ["With the concept understood, here's how to apply it in practice.", "Knowing what it is leads naturally to learning how to use it."],
  },
  property: {
    historical: ["These features didn't emerge overnight. The history explains how they developed.", "Understanding how these characteristics evolved adds depth."],
    procedural: ["Knowing these features prepares you for practical application.", "With these capabilities in mind, here's how to put them to use."],
    comparison: ["These features also provide a basis for comparison.", "Understanding these qualities helps when evaluating alternatives."],
    warning: ["While these features are powerful, some considerations apply.", "Along with these strengths come certain areas of caution."],
  },
  historical: {
    property: ["This history shaped the features available today.", "From this background emerged the characteristics we see now."],
    procedural: ["With this context in mind, the practical approach becomes clearer.", "Understanding the history informs how we use it today."],
  },
  procedural: {
    warning: ["While following these steps, keep these considerations in mind.", "Before proceeding, be aware of these potential issues."],
    comparison: ["The approach described above differs from alternatives in important ways.", "Having seen the practical steps, it's useful to compare approaches."],
  },
};

export function getInterSectionTransition(fromType: string, toType: string, index: number, slug: string): string {
  const fromMap = INTER_SECTION_TRANSITIONS[fromType];
  if (!fromMap) return "";
  const transitions = fromMap[toType];
  if (!transitions || transitions.length === 0) return "";
  return selectVariant(transitions, index, slug);
}

export type TransitionType = keyof typeof TRANSITIONS;

export function selectTransition(type: TransitionType, index: number, slug: string): string {
  const pool = TRANSITIONS[type];
  return selectVariant(pool, index, slug);
}

// ─── Grammar Rules ───────────────────────────────────────────────────────────

export function lowercaseFirst(str: string): string {
  if (!str) return str;
  // Don't lowercase if it starts with an acronym or proper noun indicator
  if (str.length > 1 && str[0] === str[0].toUpperCase() && str[1] === str[1].toUpperCase()) {
    return str;
  }
  return str[0].toLowerCase() + str.slice(1);
}

export function listJoin(items: string[], conjunction: "and" | "or"): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} ${conjunction} ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, ${conjunction} ${items[items.length - 1]}`;
}

export function pluralize(word: string): string {
  if (word.endsWith("s") || word.endsWith("x") || word.endsWith("z") || word.endsWith("ch") || word.endsWith("sh")) {
    return word + "es";
  }
  if (word.endsWith("y") && !"aeiou".includes(word[word.length - 2])) {
    return word.slice(0, -1) + "ies";
  }
  return word + "s";
}

export function articlize(word: string): string {
  const vowels = "aeiou";
  const firstChar = word.trim().toLowerCase()[0];
  return vowels.includes(firstChar) ? `an ${word}` : `a ${word}`;
}

import { cleanTopicLabel } from "@/services/content/topicHeading";

// ─── Subject Extraction ──────────────────────────────────────────────────────

export function extractSubject(slug: string): string {
  const raw = slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  return cleanTopicLabel(raw);
}
