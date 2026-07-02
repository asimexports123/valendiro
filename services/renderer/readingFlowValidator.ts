/**
 * Reading Flow Validator
 *
 * Evaluates the Document Tree for reading quality:
 * - Repeated sentence openings
 * - Paragraph length balance
 * - Heading density
 * - Excessive bullet lists
 * - Transition quality
 * - Sentence variety
 *
 * Pure function. No side effects. Deterministic.
 */

import type { DocumentNode, ReadingFlowMetrics } from "./types";

export function validateReadingFlow(tree: DocumentNode[]): ReadingFlowMetrics {
  const paragraphs = extractParagraphTexts(tree);
  const headings = tree.filter((n) => n.type === "heading");
  const lists = tree.filter((n) => n.type === "list");
  const totalBlocks = tree.length;

  // 1. Repeated sentence openings (lower is better)
  const repeatedOpenings = measureRepeatedOpenings(paragraphs);

  // 2. Paragraph length balance (0-100, higher is better)
  const paragraphLengthBalance = measureParagraphBalance(paragraphs);

  // 3. Heading density (0-100, ideal is 1 heading per 3-5 blocks)
  const headingDensity = measureHeadingDensity(headings.length, totalBlocks);

  // 4. Bullet list ratio (0-100, lower ratio = less list-heavy = better)
  const bulletListRatio = measureBulletListRatio(lists.length, totalBlocks);

  // 5. Transition quality (0-100, measures presence of transition paragraphs)
  const transitionQuality = measureTransitionQuality(paragraphs);

  // 6. Sentence variety (0-100, measures sentence length variation)
  const sentenceVariety = measureSentenceVariety(paragraphs);

  // Overall flow score (weighted average)
  const overallFlowScore = Math.round(
    repeatedOpenings * 0.15 +
    paragraphLengthBalance * 0.2 +
    headingDensity * 0.15 +
    bulletListRatio * 0.15 +
    transitionQuality * 0.15 +
    sentenceVariety * 0.2
  );

  return {
    repeatedOpenings,
    paragraphLengthBalance,
    headingDensity,
    bulletListRatio,
    transitionQuality,
    sentenceVariety,
    overallFlowScore,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extractParagraphTexts(tree: DocumentNode[]): string[] {
  const texts: string[] = [];
  for (const node of tree) {
    if (node.type === "paragraph") {
      const text = node.children
        .map((child) => (typeof child === "string" ? child : "text" in child ? (child as any).text : ""))
        .join("");
      if (text.trim()) texts.push(text.trim());
    }
  }
  return texts;
}

function measureRepeatedOpenings(paragraphs: string[]): number {
  if (paragraphs.length <= 1) return 100;

  const openingWords = paragraphs.map((p) => {
    const firstWord = p.split(/\s+/)[0]?.toLowerCase() ?? "";
    return firstWord;
  });

  // Count how many consecutive paragraphs start with the same word
  let repeats = 0;
  for (let i = 1; i < openingWords.length; i++) {
    if (openingWords[i] === openingWords[i - 1] && openingWords[i].length > 2) {
      repeats++;
    }
  }

  // Score: 100 = no repeats, drops with each repeat
  const score = Math.max(0, 100 - (repeats * 20));
  return score;
}

function measureParagraphBalance(paragraphs: string[]): number {
  if (paragraphs.length <= 1) return 80;

  const lengths = paragraphs.map((p) => p.split(/\s+/).length);
  const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;

  // Variance
  const variance = lengths.reduce((sum, l) => sum + Math.pow(l - avg, 2), 0) / lengths.length;
  const stdDev = Math.sqrt(variance);

  // Good balance: some variation (stdDev between 3 and 15)
  if (stdDev >= 3 && stdDev <= 15) return 90;
  if (stdDev >= 2 && stdDev <= 20) return 75;
  if (stdDev < 2) return 50; // too uniform = robotic
  return 60; // too much variation
}

function measureHeadingDensity(headingCount: number, totalBlocks: number): number {
  if (totalBlocks === 0) return 0;

  const ratio = headingCount / totalBlocks;
  // Ideal: 1 heading per 3-6 blocks (ratio 0.15-0.33)
  if (ratio >= 0.15 && ratio <= 0.33) return 90;
  if (ratio >= 0.10 && ratio <= 0.40) return 75;
  if (ratio > 0.40) return 50; // too many headings, feels choppy
  return 60; // too few headings, hard to scan
}

function measureBulletListRatio(listCount: number, totalBlocks: number): number {
  if (totalBlocks === 0) return 100;

  const ratio = listCount / totalBlocks;
  // Good: lists are < 30% of blocks
  if (ratio <= 0.20) return 95;
  if (ratio <= 0.30) return 85;
  if (ratio <= 0.45) return 70;
  return 50; // too list-heavy
}

function measureTransitionQuality(paragraphs: string[]): number {
  if (paragraphs.length <= 2) return 70;

  // Check for transition signals in paragraphs
  const transitionSignals = [
    "however", "additionally", "furthermore", "moreover", "in contrast",
    "as a result", "consequently", "therefore", "meanwhile", "nevertheless",
    "on the other hand", "in summary", "building on", "with the fundamentals",
    "now that", "knowing", "understanding", "these features", "this history",
  ];

  let transitionsFound = 0;
  for (const p of paragraphs) {
    const lower = p.toLowerCase();
    if (transitionSignals.some((signal) => lower.startsWith(signal) || lower.includes(`, ${signal}`))) {
      transitionsFound++;
    }
  }

  const ratio = transitionsFound / paragraphs.length;
  // Good: 20-40% of paragraphs have transitional elements
  if (ratio >= 0.2 && ratio <= 0.4) return 90;
  if (ratio >= 0.1) return 75;
  return 55; // too few transitions
}

function measureSentenceVariety(paragraphs: string[]): number {
  if (paragraphs.length === 0) return 0;

  // Collect all sentence lengths
  const sentenceLengths: number[] = [];
  for (const p of paragraphs) {
    const sentences = p.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    for (const s of sentences) {
      sentenceLengths.push(s.trim().split(/\s+/).length);
    }
  }

  if (sentenceLengths.length <= 1) return 60;

  const avg = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length;
  const variance = sentenceLengths.reduce((sum, l) => sum + Math.pow(l - avg, 2), 0) / sentenceLengths.length;
  const stdDev = Math.sqrt(variance);

  // Good variety: stdDev > 5 words
  if (stdDev >= 7) return 95;
  if (stdDev >= 5) return 85;
  if (stdDev >= 3) return 70;
  return 50; // too uniform = monotonous
}
