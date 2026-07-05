/**
 * Production Bug Fix - Analyze Code Tag HTML Structure
 * 
 * Analyze the actual HTML structure of <code> tags to understand
 * how examples are structured in the approved sources.
 */

import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

import { PythonDocumentationConnector } from "../services/acquisition/connectors/pythonDocumentationConnector";
import { MDNConnector } from "../services/acquisition/connectors/mdnConnector";

interface CodeTagAnalysis {
  sourceName: string;
  codeTagSamples: string[];
  hasPreWrapper: boolean;
  hasLanguageClass: boolean;
  commonPatterns: string[];
}

async function analyzeCodeTags(sourceName: string, url: string, connector: any): Promise<CodeTagAnalysis> {
  console.log(`Analyzing code tags in: ${sourceName}`);
  
  const connectorResult = await connector.connect({
    sourceType: connector.sourceType as any,
    sourceUrl: url,
  });

  if (!connectorResult.data) {
    console.log(`  ❌ Connection failed: ${connectorResult.error}`);
    return {
      sourceName,
      codeTagSamples: [],
      hasPreWrapper: false,
      hasLanguageClass: false,
      commonPatterns: [],
    };
  }

  const html = connectorResult.data;

  // Extract code tag samples
  const codeRegex = /<code[^>]*>([\s\S]*?)<\/code>/gi;
  const codeTagSamples: string[] = [];
  let match;
  let sampleCount = 0;

  while ((match = codeRegex.exec(html)) !== null && sampleCount < 5) {
    codeTagSamples.push(match[0]);
    sampleCount++;
  }

  // Check for pre wrapper
  const hasPreWrapper = /<pre[^>]*>[\s\S]*?<code/gi.test(html);
  
  // Check for language class
  const hasLanguageClass = /<code[^>]*class="[^"]*language-/gi.test(html);

  // Find common patterns
  const commonPatterns: string[] = [];
  if (/<code[^>]*class="[^"]*language-/gi.test(html)) {
    commonPatterns.push("language-* class");
  }
  if (/<code[^>]*class="[^"]*hljs/gi.test(html)) {
    commonPatterns.push("hljs class");
  }
  if (/```/g.test(html)) {
    commonPatterns.push("fenced blocks");
  }
  if (/<pre>/gi.test(html)) {
    commonPatterns.push("pre wrapper");
  }

  console.log(`  Code tag samples found: ${codeTagSamples.length}`);
  console.log(`  Has pre wrapper: ${hasPreWrapper}`);
  console.log(`  Has language class: ${hasLanguageClass}`);
  console.log(`  Common patterns: ${commonPatterns.join(", ") || "None"}`);
  
  if (codeTagSamples.length > 0) {
    console.log(`  Sample code tag: ${codeTagSamples[0].substring(0, 100)}...`);
  }
  console.log();

  return {
    sourceName,
    codeTagSamples,
    hasPreWrapper,
    hasLanguageClass,
    commonPatterns,
  };
}

async function runCodeTagAnalysis() {
  const timestamp = new Date().toISOString();
  console.log("Production Bug Fix - Code Tag HTML Structure Analysis");
  console.log("=".repeat(60));
  console.log(`Timestamp: ${timestamp}\n`);

  const analyses: CodeTagAnalysis[] = [];

  // Python Tutorial
  const pythonConnector = new PythonDocumentationConnector();
  analyses.push(await analyzeCodeTags(
    "Python Tutorial",
    "https://docs.python.org/3/tutorial/index.html",
    pythonConnector
  ));

  // MDN Guide (has most code tags)
  const mdnConnector = new MDNConnector();
  analyses.push(await analyzeCodeTags(
    "MDN Guide",
    "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide",
    mdnConnector
  ));

  analyses.push(await analyzeCodeTags(
    "MDN Reference",
    "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference",
    mdnConnector
  ));

  console.log("=".repeat(60));
  console.log("CODE TAG ANALYSIS SUMMARY");
  console.log("=".repeat(60));

  analyses.forEach(analysis => {
    console.log(`\n${analysis.sourceName}:`);
    console.log(`  Code tag samples: ${analysis.codeTagSamples.length}`);
    console.log(`  Has pre wrapper: ${analysis.hasPreWrapper}`);
    console.log(`  Has language class: ${analysis.hasLanguageClass}`);
    console.log(`  Common patterns: ${analysis.commonPatterns.join(", ") || "None"}`);
  });

  return analyses;
}

runCodeTagAnalysis()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("Code tag analysis failed:", error);
    process.exit(1);
  });
