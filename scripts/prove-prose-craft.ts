/**
 * Quick proof: Prose Craft layer via writeBrainArticleOriginal.
 * Run: npx tsx scripts/prove-prose-craft.ts
 */
import { brainUnderstand } from "../services/discovery/catalogBrainUtils";
import { writeBrainArticleOriginal } from "../services/discovery/brainWriter";
import { evaluateOriginality } from "../services/discovery/originalityGate";

const fuel = [
  `Artificial intelligence (AI) is the capability of computational systems to perform tasks typically associated with human intelligence, such as learning, reasoning, problem-solving, perception, and decision-making. It is a field of research in computer science that develops and studies methods and software that enable machines to perceive their environment and use learning and intelligence to take actions that maximize their chances of achieving defined goals.
High-profile applications of AI include advanced web search engines, recommendation systems, virtual assistants, autonomous vehicles, generative tools, and superhuman play and analysis in strategy games.
Machine learning is a subset of AI that focuses on algorithms that improve through experience. Deep learning uses neural networks with many layers.
Natural language processing enables computers to understand and generate human language. Computer vision allows machines to interpret images and video.
Expert systems were among the earliest successful forms of AI, encoding human expertise into rule-based programs.
Reinforcement learning trains agents through rewards and penalties in simulated environments.
Neural networks are inspired by biological brain structures and consist of interconnected nodes.
Supervised learning uses labeled training data to teach models classification and regression tasks.
Unsupervised learning finds hidden patterns in data without explicit labels.
AI ethics addresses bias, transparency, accountability, and the societal impact of automated systems.
Robotics combines AI with mechanical systems to perform physical tasks in the real world.
Generative AI creates new content including text, images, music, and code based on learned patterns.
Large language models are trained on vast text corpora and can generate coherent responses to prompts.
AI safety research aims to ensure advanced systems remain aligned with human values and intentions.
The Turing test was proposed as a criterion for machine intelligence based on conversational ability.
Weak AI performs specific narrow tasks while strong AI would match general human cognitive ability.
Training deep learning models requires substantial computational resources and large datasets.
Transfer learning allows models trained on one task to adapt quickly to related problems.
Federated learning trains models across decentralized devices while keeping data local.
AI in healthcare supports diagnosis, drug discovery, and personalized treatment planning.`,
];

const slug = "what-is-artificial-intelligence";
const title = "What Is Artificial Intelligence?";

const notes = brainUnderstand(fuel, "what is artificial intelligence", {
  slug,
  primaryKeyword: "what is artificial intelligence",
});

console.log(`\n=== PROSE CRAFT PROOF: ${slug} ===\n`);
console.log(
  `Facts: ${notes.allFacts.length} | defs: ${notes.definitions.length} | prop: ${notes.properties.length} | proc: ${notes.procedures.length}`
);

const written = writeBrainArticleOriginal(notes, title, slug, fuel);

if (!written) {
  console.log("Writer: FAILED to produce original article");
  process.exit(1);
}

const originality = evaluateOriginality(written.markdown, fuel);
const body = written.markdown.replace(/^#.+$/m, "").trim();
const sentences = body
  .replace(/^##\s+.+$/gm, "")
  .split(/(?<=[.!?])\s+/)
  .map((s) => s.trim())
  .filter((s) => s.length > 40);

console.log("\n--- Metrics ---");
console.log(`Overlap:     ${Math.round((written.originalityOverlap ?? originality.maxOverlap) * 100)}%`);
console.log(`Originality: ${originality.pass ? "PASS" : "FAIL"}`);
console.log(`Word count:  ${written.wordCount}`);
console.log(`Attempts:    ${written.attempts}`);
console.log(`Sections:    ${written.sectionsWritten}`);

console.log("\n--- Sample sentences ---");
console.log(`1. ${sentences[0]?.slice(0, 220) ?? "(none)"}`);
console.log(`2. ${sentences[1]?.slice(0, 220) ?? "(none)"}`);

process.exit(0);
