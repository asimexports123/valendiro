/**
 * PROOF: Language system integration for brain writer.
 * Run: npx tsx scripts/prove-language-system.ts
 */

import { writeBrainArticle, writeBrainArticleOriginal } from "../services/discovery/brainWriter";
import type { BrainNotes } from "../services/discovery/catalogBrainUtils";
import { evaluateOriginality } from "../services/discovery/originalityGate";
import { countWords } from "../services/knowledge/contentQualityGate";

const MOCK_NOTES: BrainNotes = {
  definitions: [
    "Artificial intelligence is the simulation of human intelligence by machines.",
    "Machine learning is a subset of artificial intelligence that learns from data.",
    "Deep learning refers to neural networks with many layers.",
    "Natural language processing enables computers to understand human language.",
    "Computer vision allows systems to interpret images and video.",
    "Reinforcement learning trains agents through rewards and penalties.",
    "Expert systems use rule-based knowledge to solve domain problems.",
    "Robotics combines AI with physical actuators and sensors.",
  ],
  properties: [
    "AI systems are characterized by pattern recognition capabilities.",
    "Modern models are trained on large datasets.",
    "Neural networks are highly parallel and distributed.",
    "Inference speed varies widely across hardware platforms.",
    "Transfer learning reduces training time for new tasks.",
    "Explainability remains a challenge for deep models.",
    "Bias in training data can skew model outputs.",
    "Generalization depends on diverse representative samples.",
  ],
  procedures: [
    "To build an AI model, collect labeled data and choose an architecture.",
    "Start with data preprocessing and feature engineering.",
    "Train the model using gradient descent optimization.",
    "Validate performance on a held-out test set.",
    "Deploy the model behind an API with monitoring.",
    "Retrain periodically as new data arrives.",
    "Document assumptions and limitations for stakeholders.",
    "Benchmark against baseline heuristics before scaling.",
  ],
  warnings: [
    "A common mistake is training on biased or incomplete datasets.",
    "Avoid deploying models without proper validation.",
    "Do not ignore data privacy regulations when collecting training data.",
    "Overfitting leads to poor performance on unseen data.",
    "Neglecting model monitoring causes silent degradation.",
    "Skipping human review for high-stakes decisions is risky.",
    "Using outdated frameworks can introduce security vulnerabilities.",
    "Ignoring edge cases produces brittle production systems.",
  ],
  comparisons: [
    "Supervised learning differs from unsupervised learning in label requirements.",
    "Deep learning requires more data than traditional machine learning.",
    "Cloud inference costs more than on-device inference at scale.",
    "Rule-based systems are more interpretable than neural networks.",
  ],
  measurements: [
    "Accuracy on benchmark datasets often exceeds 90 percent.",
    "Training large models can require millions of parameters.",
    "Inference latency under 100 milliseconds is typical for edge devices.",
    "GPU clusters reduce training time by orders of magnitude.",
  ],
  allFacts: [],
};

MOCK_NOTES.allFacts = [
  ...MOCK_NOTES.definitions,
  ...MOCK_NOTES.properties,
  ...MOCK_NOTES.procedures,
  ...MOCK_NOTES.warnings,
  ...MOCK_NOTES.comparisons,
  ...MOCK_NOTES.measurements,
];

const SLUG = "what-is-artificial-intelligence";
const TITLE = "What Is Artificial Intelligence?";
const SOURCE_TEXTS = MOCK_NOTES.allFacts;

function extractSampleSentences(markdown: string, count = 3): string[] {
  const body = markdown.replace(/^#.+$/m, "").trim();
  return body
    .replace(/^##\s+.+$/gm, "")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 40)
    .slice(0, count);
}

function extractHeadings(markdown: string): string[] {
  const matches = markdown.match(/^##\s+.+$/gm) ?? [];
  return matches.map((h) => h.replace(/^##\s+/, ""));
}

function main() {
  console.log("\n=== LANGUAGE SYSTEM PROOF ===\n");

  const written = writeBrainArticle(MOCK_NOTES, TITLE, SLUG, 0, SOURCE_TEXTS);
  if (!written) {
    console.error("writeBrainArticle returned null");
    process.exit(1);
  }

  const original = writeBrainArticleOriginal(MOCK_NOTES, TITLE, SLUG, SOURCE_TEXTS);
  const originality = evaluateOriginality(written.markdown, SOURCE_TEXTS);
  const sentences = extractSampleSentences(written.markdown);
  const headings = extractHeadings(written.markdown);

  console.log("--- Metrics ---");
  console.log(`Word count:      ${written.wordCount}`);
  console.log(`Sections:        ${written.sectionsWritten}`);
  console.log(`Originality:     ${originality.pass ? "PASS" : "FAIL"} (${Math.round(originality.maxOverlap * 100)}% overlap)`);
  if (original) {
    console.log(`Original retry:  ${original.attempts} attempt(s), ${original.wordCount} words`);
  }

  console.log("\n--- Section headings ---");
  for (const h of headings) {
    const dup = /what\s+is\s+what\s+is/i.test(h);
    console.log(`  ${dup ? "[DUP!] " : ""}${h}`);
  }

  console.log("\n--- Sample sentences ---");
  sentences.forEach((s, i) => {
    console.log(`${i + 1}. ${s.slice(0, 220)}${s.length > 220 ? "…" : ""}`);
  });

  const hasDupHeading = headings.some((h) => /what\s+is\s+what\s+is/i.test(h));
  if (hasDupHeading) {
    console.error("\nFAIL: Duplicate 'What Is What Is' heading detected");
    process.exit(1);
  }

  if (written.wordCount < 360) {
    console.error("\nFAIL: Word count below minimum");
    process.exit(1);
  }

  console.log("\nPASS: Language system proof complete");
}

main();
