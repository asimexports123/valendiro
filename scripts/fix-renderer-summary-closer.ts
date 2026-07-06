/**
 * Fix renderer to remove summaryCloser usage
 * Removes generic closing paragraph from summary section
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const filePath = join(__dirname, "../services/renderer/renderers/longArticle.ts");
const content = readFileSync(filePath, "utf-8");

// Remove the summaryCloser usage - make closingSentence empty
const oldSummary = `    const summary: SummaryNode = {
      type: "summary",
      keyPoints,
      closingSentence: policy.summaryCloser(subject),
    };`;

const newSummary = `    const summary: SummaryNode = {
      type: "summary",
      keyPoints,
      closingSentence: "",
    };`;

const fixedContent = content.replace(oldSummary, newSummary);

writeFileSync(filePath, fixedContent, "utf-8");
console.log("Fixed renderer to remove summaryCloser usage");
