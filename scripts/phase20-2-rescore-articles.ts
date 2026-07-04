import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

const envPath = resolve(__dirname, "../.env.local");
const envContent = readFileSync(envPath, "utf-8");
envContent.split("\n").forEach((line) => {
  const [key, ...values] = line.split("=");
  if (key && values.length > 0) {
    process.env[key] = values.join("=");
  }
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function rescoreArticles() {
  console.log("=== Phase 20.2: Re-scoring Articles with New Educational Quality Model ===\n");

  // Fetch all rendered outputs with status != failed
  const { data: outputs, error } = await supabase
    .from("rendered_outputs")
    .select("id, package_id, document_tree, quality_score, created_at")
    .neq("status", "failed")
    .eq("output_format", "html")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching outputs:", error);
    return;
  }

  console.log(`Found ${outputs?.length || 0} rendered outputs\n`);

  const results: any[] = [];

  for (const output of outputs || []) {
    console.log(`Processing output ${output.id}...`);

    const oldScore = output.quality_score?.overall || 0;
    const newScore = await calculateNewScore(output.document_tree);

    const scoreChange = newScore - oldScore;

    results.push({
      outputId: output.id,
      packageId: output.package_id,
      oldScore,
      newScore,
      scoreChange,
    });

    // Update the database with new score
    const { error: updateError } = await supabase
      .from("rendered_outputs")
      .update({
        quality_score: newScore,
      })
      .eq("id", output.id);

    if (updateError) {
      console.error(`Error updating output ${output.id}:`, updateError);
    } else {
      console.log(`  Old: ${oldScore} → New: ${newScore} (${scoreChange >= 0 ? '+' : ''}${scoreChange})`);
    }
  }

  // Save results
  const fs = require("fs");
  fs.writeFileSync(
    resolve(__dirname, "phase20-2-rescore-results.json"),
    JSON.stringify({
      timestamp: new Date().toISOString(),
      totalProcessed: results.length,
      results,
    }, null, 2)
  );

  console.log(`\n=== Summary ===`);
  const avgChange = results.reduce((sum, r) => sum + r.scoreChange, 0) / results.length;
  const improved = results.filter(r => r.scoreChange > 0).length;
  const declined = results.filter(r => r.scoreChange < 0).length;
  const unchanged = results.filter(r => r.scoreChange === 0).length;

  console.log(`Total processed: ${results.length}`);
  console.log(`Average score change: ${avgChange.toFixed(2)}`);
  console.log(`Improved: ${improved}`);
  console.log(`Declined: ${declined}`);
  console.log(`Unchanged: ${unchanged}`);
}

async function calculateNewScore(documentTree: any): Promise<any> {
  // Import the new quality scorer
  const { scoreQuality } = await import("../services/renderer/qualityScorer.ts");
  
  // For now, we need to reconstruct the inputs
  // This is a simplified version - in production we'd need the full facts and citations
  // Since we're using existing rendered content, we'll estimate based on document tree
  
  const tree = documentTree || [];
  const wordCount = estimateWordCount(tree);
  
  // Estimate educational depth based on text content
  const textContent = extractTextFromTree(tree);
  const educationalDepth = estimateEducationalDepth(textContent);
  const learningProgression = estimateLearningProgression(textContent);
  const knowledgeGraph = estimateKnowledgeGraph(tree);
  const readerJourney = estimateReaderJourney(textContent, tree);
  const contentDensity = estimateContentDensity(wordCount, textContent);
  const retentionFactors = estimateRetentionFactors(textContent);
  const citationCoverage = 50; // Default estimate
  const missingKnowledgeCount = 1; // Default estimate

  const overall = Math.round(
    educationalDepth * 0.30 +
    learningProgression * 0.20 +
    knowledgeGraph * 0.15 +
    readerJourney * 0.15 +
    contentDensity * 0.10 +
    retentionFactors * 0.10 +
    citationCoverage * 0.05 -
    missingKnowledgeCount * 5
  );

  return Math.max(0, Math.min(100, overall));
}

function estimateWordCount(tree: any[]): number {
  let count = 0;
  for (const node of tree) {
    if (typeof node === "string") {
      count += node.split(/\s+/).length;
    } else if (node && typeof node === "object") {
      if (node.text) count += node.text.split(/\s+/).length;
      if (node.children) count += estimateWordCount(node.children);
      if (node.items) count += estimateWordCount(node.items);
      if (node.code) count += node.code.split(/\s+/).length;
    }
  }
  return count;
}

function extractTextFromTree(tree: any[]): string {
  let text = "";
  for (const node of tree) {
    if (typeof node === "string") {
      text += node + " ";
    } else if (node && typeof node === "object") {
      if (node.text) text += node.text + " ";
      if (node.children) text += extractTextFromTree(node.children);
      if (node.items) text += extractTextFromTree(node.items);
      if (node.code) text += node.code + " ";
    }
  }
  return text.toLowerCase();
}

function estimateEducationalDepth(text: string): number {
  const mentalModelPatterns = ["think of", "model as", "mental model", "imagine", "framework"];
  const analogyPatterns = ["like a", "similar to", "compared to", "analogous", "just as"];
  const examplePatterns = ["for example", "in practice", "specifically", "use case", "applied"];
  
  const mentalModelScore = Math.min(100, countPatternMatches(text, mentalModelPatterns) * 25);
  const analogyScore = Math.min(100, countPatternMatches(text, analogyPatterns) * 25);
  const exampleScore = Math.min(100, countPatternMatches(text, examplePatterns) * 20);
  
  const sentences = text.split(/[.!?]/).filter(s => s.trim().length > 0);
  const avgSentenceLength = sentences.length > 0 ? text.split(/\s+/).length / sentences.length : 0;
  const clarityScore = avgSentenceLength < 25 ? 90 : avgSentenceLength < 35 ? 70 : 50;

  return (mentalModelScore * 0.08 + analogyScore * 0.07 + exampleScore * 0.07 + clarityScore * 0.08) / 0.30;
}

function estimateLearningProgression(text: string): number {
  const scaffoldingPatterns = ["now that", "building on", "with these fundamentals", "understanding"];
  const decisionPatterns = ["when to", "how to choose", "consider", "evaluate"];
  const misconceptionPatterns = ["common mistake", "not to be confused", "avoid", "misconception"];
  
  const scaffoldingScore = Math.min(100, countPatternMatches(text, scaffoldingPatterns) * 20);
  const decisionScore = Math.min(100, countPatternMatches(text, decisionPatterns) * 20);
  const misconceptionScore = Math.min(100, countPatternMatches(text, misconceptionPatterns) * 25);

  return (scaffoldingScore * 0.07 + decisionScore * 0.07 + misconceptionScore * 0.06) / 0.20;
}

function estimateKnowledgeGraph(tree: any[]): number {
  let internalLinkCount = 0;
  for (const node of tree) {
    if (node && typeof node === "object" && node.type === "internal-link") {
      internalLinkCount++;
    }
    if (node && typeof node === "object") {
      if (node.children) internalLinkCount += countInternalLinks(node.children);
      if (node.items) internalLinkCount += countInternalLinks(node.items);
    }
  }
  
  const linkScore = Math.min(100, internalLinkCount * 10);
  const crossReferenceScore = 60; // Default estimate
  
  return (linkScore * 0.08 + crossReferenceScore * 0.07) / 0.15;
}

function countInternalLinks(nodes: any[]): number {
  let count = 0;
  for (const node of nodes) {
    if (node && typeof node === "object" && node.type === "internal-link") {
      count++;
    }
    if (node && typeof node === "object") {
      if (node.children) count += countInternalLinks(node.children);
      if (node.items) count += countInternalLinks(node.items);
    }
  }
  return count;
}

function estimateReaderJourney(text: string, tree: any[]): number {
  const firstParagraph = text.split("\n\n")[0] || "";
  const hookPatterns = ["?", "!", "imagine", "consider", "did you know"];
  const hookScore = countPatternMatches(firstParagraph, hookPatterns) > 0 ? 90 : 60;
  
  const lastParagraph = text.split("\n\n").slice(-1)[0] || "";
  const conclusionPatterns = ["summary", "conclusion", "in summary", "key takeaway"];
  const conclusionScore = countPatternMatches(lastParagraph, conclusionPatterns) > 0 ? 90 : 60;
  
  const transitionScore = 70; // Default estimate
  
  return (hookScore * 0.05 + conclusionScore * 0.05 + transitionScore * 0.05) / 0.15;
}

function estimateContentDensity(wordCount: number, text: string): number {
  const words = text.split(/\s+/);
  const uniqueWords = new Set(words);
  const redundancyRatio = words.length > 0 ? uniqueWords.size / words.length : 1;
  const redundancyScore = Math.round(redundancyRatio * 100);
  
  const densityScore = 60; // Default estimate (can't calculate without fact count)
  
  return (densityScore * 0.05 + redundancyScore * 0.05) / 0.10;
}

function estimateRetentionFactors(text: string): number {
  const mnemonicPatterns = ["acronym", "mnemonic", "remember as", "stand for"];
  const applicationPatterns = ["you can use", "apply this", "practical", "use this to"];
  
  const memorabilityScore = Math.min(100, countPatternMatches(text, mnemonicPatterns) * 30);
  const applicationScore = Math.min(100, countPatternMatches(text, applicationPatterns) * 20);
  
  return (memorabilityScore * 0.05 + applicationScore * 0.05) / 0.10;
}

function countPatternMatches(text: string, patterns: string[]): number {
  let count = 0;
  for (const pattern of patterns) {
    if (text.includes(pattern)) count++;
  }
  return count;
}

rescoreArticles().catch(console.error);
