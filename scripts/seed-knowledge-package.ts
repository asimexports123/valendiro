/**
 * Seeds a real Knowledge Package from existing discovery candidates.
 * Creates a demonstrable package for the Preview UI.
 */

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://diwwvkbztvhwouttajha.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY";

import { createClient } from "@supabase/supabase-js";
import { assemble } from "../services/knowledge/assembler";
import { clearGlossaryCache } from "../services/knowledge/normalizer";
import type { AssemblyInput, CandidateInput } from "../services/knowledge/types";

const sb = createClient(
  "https://diwwvkbztvhwouttajha.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY"
);

async function main() {
  console.log("=== Seeding Knowledge Package for Preview UI ===\n");
  clearGlossaryCache();

  // Get existing discovery runs
  const { data: runs } = await sb
    .from("discovery_runs")
    .select("id")
    .limit(1);

  const runId = runs?.[0]?.id ?? "00000000-0000-0000-0000-000000000001";

  // Create a rich package from multiple simulated discovery candidates
  const candidates: CandidateInput[] = [
    {
      id: "seed-cand-wiki",
      title: "Python Programming Language",
      description: "Python is a high-level, general-purpose programming language. Python was created by Guido van Rossum. Python was first released in 1991. Python supports multiple programming paradigms including object-oriented, procedural, and functional programming. Python has a comprehensive standard library. Python uses dynamic typing and garbage collection. Python is consistently ranked among the top programming languages.",
      sourceUrl: "https://en.wikipedia.org/wiki/Python_(programming_language)",
      discoveryRunId: runId,
      adapterName: "WikipediaAdapter",
      sourceSlug: "wikipedia-en",
      sourceAuthority: "encyclopedic",
      metadata: { domain: "Software Development" },
    },
    {
      id: "seed-cand-docs",
      title: "Python Official Documentation",
      description: "Python has several built-in data types including integers, floating-point numbers, strings, lists, dictionaries, tuples, and sets. Python lists are mutable ordered sequences. Python dictionaries are mutable mappings of key-value pairs. Python supports list comprehensions for concise list creation. Python requires proper indentation for code blocks. Warning: avoid using mutable objects as dictionary keys.",
      sourceUrl: "https://docs.python.org/3/",
      discoveryRunId: runId,
      adapterName: "DocsAdapter",
      sourceSlug: "python-docs",
      sourceAuthority: "official",
      metadata: { domain: "Software Development" },
    },
    {
      id: "seed-cand-tutorial",
      title: "Python Getting Started",
      description: "To install Python, download the installer from python.org. Python requires version 3.8 or higher for modern features. Python packages are managed using pip. Python virtual environments isolate project dependencies. Python was designed to emphasize code readability.",
      sourceUrl: "https://docs.python.org/3/tutorial/",
      discoveryRunId: runId,
      adapterName: "DocsAdapter",
      sourceSlug: "python-docs",
      sourceAuthority: "official",
      metadata: { domain: "Software Development" },
    },
  ];

  const input: AssemblyInput = {
    slotId: null,
    topicId: null,
    slug: "python-programming-fundamentals",
    candidates,
  };

  const report = await assemble(input);

  console.log("Assembly Report:");
  console.log(`  Package ID:     ${report.packageId}`);
  console.log(`  Slug:           ${report.slug}`);
  console.log(`  Version:        ${report.version}`);
  console.log(`  Hash:           ${report.knowledgeHash.slice(0, 24)}...`);
  console.log(`  Status:         ${report.status}`);
  console.log(`  Facts:          ${report.factsCreated}`);
  console.log(`  Citations:      ${report.citationsCreated}`);
  console.log(`  Duplicates:     ${report.duplicatesMerged}`);
  console.log(`  Conflicts:      ${report.conflictsDetected}`);
  console.log(`  Relationships:  ${report.relationshipsGenerated}`);
  console.log(`  Normalizations: ${report.glossaryNormalizations}`);
  console.log(`  Duration:       ${report.durationMs}ms`);

  if (report.normalizations.length > 0) {
    console.log("\n  Glossary Normalizations:");
    for (const n of report.normalizations) {
      console.log(`    "${n.original}" → "${n.normalized}" (${n.glossaryEntry})`);
    }
  }

  console.log("\n=== Done ===");
}

main().catch(console.error);
