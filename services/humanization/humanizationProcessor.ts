const ROBOTIC_PATTERNS = [
  /it is important to note that/gi,
  /in conclusion,?/gi,
  /furthermore,?/gi,
  /moreover,?/gi,
  /consequently,?/gi,
  /as a result,?/gi,
  /it should be noted/gi,
  /this article will discuss/gi,
  /this guide will explore/gi,
];

const HEDGES = [
  "generally",
  "in most cases",
  "practically speaking",
  "for most users",
  "more often than not",
  "as a rule of thumb",
  "in everyday use",
];

const OPINION_PREFIXES = [
  "A solid choice is",
  "If you ask me,",
  "Honestly,",
  "In my experience,",
  "Realistically,",
  "To be practical,",
];

export function humanizeContent(content: string): string {
  let humanized = content;

  // Reduce robotic transitions
  for (const pattern of ROBOTIC_PATTERNS) {
    humanized = humanized.replace(pattern, "");
  }

  // Add light hedging to definitive absolute statements (conservative replacements)
  humanized = humanized.replace(/\b(always|never|must|will definitely)\b/gi, (match) => {
    const hedge = HEDGES[Math.floor(Math.random() * HEDGES.length)];
    return `${hedge}, ${match.toLowerCase()}`;
  });

  // Vary sentence beginnings: inject occasional opinion tone
  const sentences = humanized.split(/(?<=[.!?])\s+/);
  const varied = sentences.map((sentence, index) => {
    if (index % 7 === 4 && sentence.length > 30 && !sentence.startsWith("A") && !sentence.startsWith("The")) {
      const prefix = OPINION_PREFIXES[Math.floor(Math.random() * OPINION_PREFIXES.length)];
      return `${prefix} ${sentence.charAt(0).toLowerCase()}${sentence.slice(1)}`;
    }
    return sentence;
  });

  humanized = varied.join(" ");

  // Clean up double spaces and stray punctuation
  humanized = humanized
    .replace(/\s{2,}/g, " ")
    .replace(/\.,/g, ".")
    .replace(/\.\./g, ".")
    .trim();

  return humanized;
}

export function humanizeExcerpt(excerpt: string): string {
  return humanizeContent(excerpt);
}

export function humanizeMetaDescription(description: string): string {
  let humanized = humanizeContent(description);
  if (humanized.length > 160) {
    humanized = humanized.slice(0, 157) + "...";
  }
  return humanized;
}
