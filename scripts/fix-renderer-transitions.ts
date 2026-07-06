/**
 * Fix renderer to remove section transitions
 * Removes the code that inserts transition sentences between sections
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const filePath = join(__dirname, "../services/renderer/renderers/longArticle.ts");
const content = readFileSync(filePath, "utf-8");

// Remove the transition insertion code block
const oldCode = `    // Policy-defined transition sentence between sections
    if (prevType) {
      const trans = policy.sectionTransitions[prevType]?.[type] ?? "";
      if (trans) nodes.push({ type: "paragraph", children: [trans] });
    }`;

const newCode = `    // Removed section transitions - now sections begin directly with questions`;

const fixedContent = content.replace(oldCode, newCode);

writeFileSync(filePath, fixedContent, "utf-8");
console.log("Fixed renderer to remove section transitions");
