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
  // Process line by line — never destroy markdown structure (headings, tables, blank lines)
  const lines = content.split("\n");

  const processedLines = lines.map((line) => {
    // Preserve headings, table rows, blank lines, and list items exactly
    if (
      line.startsWith("#") ||
      line.startsWith("|") ||
      line.startsWith("- ") ||
      line.startsWith("* ") ||
      /^\d+\./.test(line) ||
      line.trim() === ""
    ) {
      return line;
    }

    let processed = line;

    // Reduce robotic transitions
    for (const pattern of ROBOTIC_PATTERNS) {
      processed = processed.replace(pattern, "");
    }

    // Add light hedging to absolute statements
    processed = processed.replace(/\b(always|never|must|will definitely)\b/gi, (match) => {
      const hedge = HEDGES[Math.floor(Math.random() * HEDGES.length)];
      return `${hedge}, ${match.toLowerCase()}`;
    });

    return processed;
  });

  // Vary sentence beginnings only within paragraph blocks (never on structural lines)
  let sentenceIndex = 0;
  const finalLines = processedLines.map((line) => {
    if (
      line.startsWith("#") ||
      line.startsWith("|") ||
      line.startsWith("- ") ||
      line.startsWith("* ") ||
      /^\d+\./.test(line) ||
      line.trim() === ""
    ) {
      return line;
    }

    sentenceIndex++;
    if (
      sentenceIndex % 7 === 4 &&
      line.length > 60 &&
      !line.startsWith("A") &&
      !line.startsWith("The") &&
      !line.startsWith("**")
    ) {
      const prefix = OPINION_PREFIXES[Math.floor(Math.random() * OPINION_PREFIXES.length)];
      return `${prefix} ${line.charAt(0).toLowerCase()}${line.slice(1)}`;
    }
    return line;
  });

  return finalLines
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")  // max 2 consecutive blank lines
    .replace(/[ \t]{2,}/g, " ")  // collapse inline spaces only
    .replace(/\.,/g, ".")
    .replace(/\.\./g, ".")
    .trim();
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
