/**
 * Parse published markdown into structured learning artifacts for reader UI.
 * Read-only — does not modify knowledge packages or pipeline output.
 */

export interface ProcessSteps {
  title: string;
  steps: string[];
}

export interface ProsCons {
  pros: string[];
  cons: string[];
}

export interface ParsedArticleContent {
  keyTakeaways: string[];
  processSteps: ProcessSteps | null;
  prosCons: ProsCons | null;
  checkpoints: string[];
  recapPoints: string[];
  introParagraph: string | null;
  sectionTitles: string[];
}

const STEP_SECTION = /^(#{1,3})\s+.*(how (it|to)|step|process|workflow|lifecycle|getting started)/i;
const PROS_SECTION = /^(#{1,3})\s+.*(pros?|advantages?|benefits?)/i;
const CONS_SECTION = /^(#{1,3})\s+.*(cons?|disadvantages?|drawbacks?|limitations?)/i;
const TAKEAWAY_SECTION = /^(#{1,3})\s+.*(key takeaway|what you.ll learn|summary|in brief|quick recap|at a glance)/i;
const CHECKPOINT_SECTION = /^(#{1,3})\s+.*(checkpoint|check your|self.?check|review question)/i;
const WHAT_IT_IS_SECTION = /^#{1,3}\s+what .+\b(is|are)\b/i;
const WHY_IT_MATTERS_SECTION = /^#{1,3}\s+why .+\b(matter|matters)\b/i;

/** Split markdown after the first "What … is/are" section (for Quick Facts placement). */
export function splitAfterWhatItIsSection(content: string): {
  beforeQuickFacts: string;
  afterQuickFacts: string;
  hasWhatItIs: boolean;
} {
  const lines = content.split("\n");
  const startIdx = lines.findIndex((l) => WHAT_IT_IS_SECTION.test(l));
  if (startIdx < 0) {
    return { beforeQuickFacts: content, afterQuickFacts: "", hasWhatItIs: false };
  }

  let endIdx = lines.length;
  for (let i = startIdx + 1; i < lines.length; i++) {
    if (/^#{1,3}\s/.test(lines[i])) {
      endIdx = i;
      break;
    }
  }

  return {
    beforeQuickFacts: lines.slice(0, endIdx).join("\n"),
    afterQuickFacts: lines.slice(endIdx).join("\n"),
    hasWhatItIs: true,
  };
}

/** Extract the "Why … matter(s)" section for Key Insight callout styling. */
export function splitWhyItMattersSection(content: string): {
  before: string;
  heading: string;
  body: string;
  after: string;
  hasWhyItMatters: boolean;
} {
  const lines = content.split("\n");
  const startIdx = lines.findIndex((l) => WHY_IT_MATTERS_SECTION.test(l));
  if (startIdx < 0) {
    return { before: content, heading: "", body: "", after: "", hasWhyItMatters: false };
  }

  let endIdx = lines.length;
  for (let i = startIdx + 1; i < lines.length; i++) {
    if (/^#{1,3}\s/.test(lines[i])) {
      endIdx = i;
      break;
    }
  }

  return {
    before: lines.slice(0, startIdx).join("\n"),
    heading: lines[startIdx],
    body: lines.slice(startIdx + 1, endIdx).join("\n").trim(),
    after: lines.slice(endIdx).join("\n"),
    hasWhyItMatters: true,
  };
}

function cleanListItem(line: string): string {
  return line.replace(/^[-*]\s+/, "").replace(/^\d+\.\s+/, "").replace(/\*\*/g, "").trim();
}

function extractListAfterSection(lines: string[], startIdx: number): string[] {
  const items: string[] = [];
  for (let i = startIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    if (/^#{1,3}\s/.test(line)) break;
    if (/^[-*]\s+/.test(line) || /^\d+\.\s+/.test(line)) {
      items.push(cleanListItem(line));
    }
  }
  return items.filter(Boolean);
}

function findSectionIndex(lines: string[], pattern: RegExp): number {
  return lines.findIndex((l) => pattern.test(l));
}

export function parseArticleContent(content: string): ParsedArticleContent {
  const lines = content.split("\n");
  const keyTakeaways: string[] = [];
  let processSteps: ProcessSteps | null = null;
  let prosCons: ProsCons | null = null;
  const checkpoints: string[] = [];
  const recapPoints: string[] = [];
  const sectionTitles: string[] = [];

  // Section titles for diagram hints
  for (const line of lines) {
    const m = line.match(/^#{2,3}\s+(.+)/);
    if (m) sectionTitles.push(m[1].replace(/\*\*/g, "").trim());
  }

  // Key takeaways
  const takeawayIdx = findSectionIndex(lines, TAKEAWAY_SECTION);
  if (takeawayIdx >= 0) {
    keyTakeaways.push(...extractListAfterSection(lines, takeawayIdx).slice(0, 6));
  }

  // Process steps
  const stepIdx = findSectionIndex(lines, STEP_SECTION);
  if (stepIdx >= 0) {
    const steps = extractListAfterSection(lines, stepIdx);
    if (steps.length >= 2) {
      processSteps = {
        title: lines[stepIdx].replace(/^#{1,3}\s+/, "").replace(/\*\*/g, "").trim(),
        steps: steps.slice(0, 8),
      };
    }
  }

  // Pros / cons
  const prosIdx = findSectionIndex(lines, PROS_SECTION);
  const consIdx = findSectionIndex(lines, CONS_SECTION);
  const pros = prosIdx >= 0 ? extractListAfterSection(lines, prosIdx) : [];
  const cons = consIdx >= 0 ? extractListAfterSection(lines, consIdx) : [];
  if (pros.length > 0 || cons.length > 0) {
    prosCons = { pros: pros.slice(0, 6), cons: cons.slice(0, 6) };
  }

  // Checkpoints
  const cpIdx = findSectionIndex(lines, CHECKPOINT_SECTION);
  if (cpIdx >= 0) {
    checkpoints.push(...extractListAfterSection(lines, cpIdx).slice(0, 5));
  }

  // Recap from last summary-like section or takeaways
  const recapIdx = lines.findIndex((l, i) => i > lines.length * 0.6 && /^#{1,3}\s+.*(summary|recap|key point)/i.test(l));
  if (recapIdx >= 0) {
    recapPoints.push(...extractListAfterSection(lines, recapIdx).slice(0, 5));
  } else if (keyTakeaways.length > 0) {
    recapPoints.push(...keyTakeaways.slice(0, 4));
  }

  // Intro paragraph (first non-heading paragraph)
  let introParagraph: string | null = null;
  for (const line of lines) {
    if (line.trim() && !/^#{1,6}\s/.test(line) && !/^[-*>\d]/.test(line.trim())) {
      introParagraph = line.replace(/\*\*/g, "").trim();
      if (introParagraph.length > 40) break;
      introParagraph = null;
    }
  }

  return {
    keyTakeaways,
    processSteps,
    prosCons,
    checkpoints,
    recapPoints,
    introParagraph,
    sectionTitles,
  };
}

export function extractHeadings(content: string): { id: string; text: string; level: number }[] {
  const headings: { id: string; text: string; level: number }[] = [];
  for (const line of content.split("\n")) {
    const m = line.match(/^(#{2,3})\s+(.+)/);
    if (m) {
      const text = m[2].replace(/\*\*/g, "").trim();
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      headings.push({ id, text, level: m[1].length });
    }
  }
  return headings;
}

export function estimateReadingTime(content: string | null): number {
  if (!content) return 1;
  return Math.max(1, Math.round(content.trim().split(/\s+/).length / 220));
}
