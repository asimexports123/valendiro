/**
 * Fix composition policy syntax error
 * Removes orphaned lines 313-315 from compositionPolicy.ts
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const filePath = join(__dirname, "../services/renderer/compositionPolicy.ts");
const content = readFileSync(filePath, "utf-8");
const lines = content.split("\n");

// Remove lines 313-315 (0-indexed: 312-314)
const fixedLines = lines.filter((_, index) => index < 312 || index > 314);
const fixedContent = fixedLines.join("\n");

writeFileSync(filePath, fixedContent, "utf-8");
console.log("Fixed compositionPolicy.ts syntax error");
