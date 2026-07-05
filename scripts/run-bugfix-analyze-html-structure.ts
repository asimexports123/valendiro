/**
 * Production Bug Fix - Analyze HTML Structure of Approved Sources
 * 
 * Analyze the actual HTML structure used by approved documentation sites
 * to understand why example extraction is failing.
 */

import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

import { PythonDocumentationConnector } from "../services/acquisition/connectors/pythonDocumentationConnector";
import { GitDocumentationConnector } from "../services/acquisition/connectors/gitDocumentationConnector";
import { MDNConnector } from "../services/acquisition/connectors/mdnConnector";

interface SourceAnalysis {
  sourceName: string;
  url: string;
  htmlLength: number;
  codeBlockCount: number;
  preCodeBlockCount: number;
  fencedCodeBlockCount: number;
  exampleSectionCount: number;
  codeClassPatterns: string[];
}

async function analyzeSource(sourceName: string, url: string, connector: any): Promise<SourceAnalysis> {
  console.log(`Analyzing: ${sourceName}`);
  console.log(`URL: ${url}`);
  
  const connectorResult = await connector.connect({
    sourceType: connector.sourceType as any,
    sourceUrl: url,
  });

  if (!connectorResult.data) {
    console.log(`  ❌ Connection failed: ${connectorResult.error}`);
    return {
      sourceName,
      url,
      htmlLength: 0,
      codeBlockCount: 0,
      preCodeBlockCount: 0,
      fencedCodeBlockCount: 0,
      exampleSectionCount: 0,
      codeClassPatterns: [],
    };
  }

  const html = connectorResult.data;
  const htmlLength = html.length;

  // Count code blocks with various patterns
  const codeBlockCount = (html.match(/<code/gi) || []).length;
  const preCodeBlockCount = (html.match(/<pre>/gi) || []).length;
  const fencedCodeBlockCount = (html.match(/```/g) || []).length;
  const exampleSectionCount = (html.match(/<div[^>]*class="[^"]*example[^"]*"/gi) || []).length;

  // Find common code class patterns
  const codeClassPatterns: string[] = [];
  const classMatches = html.match(/class="([^"]*code[^"]*)"/gi) || [];
  classMatches.forEach(match => {
    const classValue = match.match(/class="([^"]*)"/)?.[1] || "";
    if (classValue && !codeClassPatterns.includes(classValue)) {
      codeClassPatterns.push(classValue);
    }
  });

  console.log(`  HTML Length: ${htmlLength}`);
  console.log(`  <code> tags: ${codeBlockCount}`);
  console.log(`  <pre> tags: ${preCodeBlockCount}`);
  console.log(`  Fenced blocks: ${fencedCodeBlockCount}`);
  console.log(`  Example sections: ${exampleSectionCount}`);
  console.log(`  Code class patterns: ${codeClassPatterns.slice(0, 5).join(", ") || "None"}`);
  console.log();

  return {
    sourceName,
    url,
    htmlLength,
    codeBlockCount,
    preCodeBlockCount,
    fencedCodeBlockCount,
    exampleSectionCount,
    codeClassPatterns,
  };
}

async function runHTMLStructureAnalysis() {
  const timestamp = new Date().toISOString();
  console.log("Production Bug Fix - HTML Structure Analysis");
  console.log("=".repeat(60));
  console.log(`Timestamp: ${timestamp}\n`);

  const analyses: SourceAnalysis[] = [];

  // Python Tutorial
  const pythonConnector = new PythonDocumentationConnector();
  analyses.push(await analyzeSource(
    "Python Tutorial",
    "https://docs.python.org/3/tutorial/index.html",
    pythonConnector
  ));

  // Git Book
  const gitConnector = new GitDocumentationConnector();
  analyses.push(await analyzeSource(
    "Git Book",
    "https://git-scm.com/book/en/v2",
    gitConnector
  ));

  // Git Reference
  analyses.push(await analyzeSource(
    "Git Reference",
    "https://git-scm.com/docs",
    gitConnector
  ));

  // MDN Guide
  const mdnConnector = new MDNConnector();
  analyses.push(await analyzeSource(
    "MDN Guide",
    "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide",
    mdnConnector
  ));

  // MDN Reference
  analyses.push(await analyzeSource(
    "MDN Reference",
    "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference",
    mdnConnector
  ));

  console.log("=".repeat(60));
  console.log("HTML STRUCTURE ANALYSIS SUMMARY");
  console.log("=".repeat(60));

  analyses.forEach(analysis => {
    console.log(`\n${analysis.sourceName}:`);
    console.log(`  HTML Length: ${analysis.htmlLength}`);
    console.log(`  <code> tags: ${analysis.codeBlockCount}`);
    console.log(`  <pre> tags: ${analysis.preCodeBlockCount}`);
    console.log(`  Fenced blocks: ${analysis.fencedCodeBlockCount}`);
    console.log(`  Example sections: ${analysis.exampleSectionCount}`);
    console.log(`  Code class patterns: ${analysis.codeClassPatterns.slice(0, 3).join(", ") || "None"}`);
  });

  return analyses;
}

runHTMLStructureAnalysis()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("HTML structure analysis failed:", error);
    process.exit(1);
  });
