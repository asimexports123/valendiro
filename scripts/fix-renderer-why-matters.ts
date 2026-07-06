/**
 * Fix renderer to remove WHY_MATTERS template and usage
 * Removes generic transition phrases from definition sections
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const filePath = join(__dirname, "../services/renderer/renderers/longArticle.ts");
const content = readFileSync(filePath, "utf-8");

// Remove the WHY_MATTERS template entirely
const whyMattersPattern = /\/\/ ─── Why-it-matters openers \(intent-aware\) ───────────────────────────────────[\s\S]*?\n};\n\n\/\/ ─── Section Renderers/;
const fixedContent1 = content.replace(whyMattersPattern, "// ─── Section Renderers");

// Remove the code that adds the "why" sentence in renderDefinitions
const whyCodePattern = /  const whyPool = WHY_MATTERS\[intent\] \?\? WHY_MATTERS\.educate;\n  const why = pick\(whyPool, `\$\{slug\}:why-0`\);\n  nodes\.push\(\{ type: "paragraph", children: \[\`\$\{firstSentence\} \$\{why\}`\] \}\);/;
const fixedContent2 = fixedContent1.replace(whyCodePattern, "  nodes.push({ type: \"paragraph\", children: [firstSentence] });");

writeFileSync(filePath, fixedContent2, "utf-8");
console.log("Fixed renderer to remove WHY_MATTERS template");
