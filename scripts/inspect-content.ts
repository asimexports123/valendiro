/**
 * Inspect the actual rendered content for a topic to diagnose depth issues.
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";

const sb = createClient(
  "https://diwwvkbztvhwouttajha.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY"
);

async function main() {
  // Get all topic translations
  const { data } = await sb
    .from("topic_translations")
    .select("title, content")
    .eq("language_code", "en")
    .order("title");

  if (!data?.length) { console.log("No translations found."); return; }

  console.log(`\n${"═".repeat(60)}`);
  console.log(`CONTENT DEPTH REPORT — ${data.length} topics`);
  console.log(`${"═".repeat(60)}\n`);

  let report = "";
  for (const t of data) {
    const words = t.content?.trim().split(/\s+/).length || 0;
    const lines = t.content?.split("\n").length || 0;
    const hasParagraphs = (t.content?.match(/\n\n/g) || []).length;
    const hasExamples = /example|for instance|such as|consider|e\.g\./i.test(t.content || "");
    const hasExplanation = /because|therefore|which means|this means|allows|enables|results in/i.test(t.content || "");

    const depth = words < 150 ? "❌ SHALLOW" : words < 400 ? "⚠️  THIN" : words < 800 ? "✅ OK" : "✅✅ DEEP";

    report += `${depth.padEnd(16)} ${String(words).padStart(5)}w  ${t.title}\n`;
  }

  console.log(report);

  // Print one full example to see structure
  const sample = data[0];
  console.log(`\n${"─".repeat(60)}`);
  console.log(`SAMPLE FULL CONTENT: "${sample.title}"`);
  console.log(`${"─".repeat(60)}\n`);
  console.log(sample.content || "(empty)");

  // Also write to file for full inspection
  const out = data.map(t => `# ${t.title}\n\n${t.content || "(empty)"}`).join("\n\n" + "─".repeat(60) + "\n\n");
  fs.writeFileSync("scripts/content-dump.md", out, "utf8");
  console.log(`\n\nFull content written to scripts/content-dump.md`);
}

main().catch(console.error);
