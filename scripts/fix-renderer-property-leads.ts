/**
 * Fix renderer to remove propertyLeads usage
 * Removes generic lead paragraphs from properties sections
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const filePath = join(__dirname, "../services/renderer/renderers/longArticle.ts");
const content = readFileSync(filePath, "utf-8");

// Remove the propertyLeads code block
const propertyLeadsPattern = /  if \(facts\.length >= 2\) \{\n    const lead = pick\(policy\.propertyLeads, `\$\{slug\}:prop-lead`\);\n    nodes\.push\(\{ type: "paragraph", children: \[lead\] \}\);\n  \}\n\n/;
const fixedContent = content.replace(propertyLeadsPattern, "");

writeFileSync(filePath, fixedContent, "utf-8");
console.log("Fixed renderer to remove propertyLeads usage");
