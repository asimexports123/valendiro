/**
 * Validate Knowledge Admission Engine against CEO examples.
 * Run: npx tsx scripts/test-admission-engine.ts
 */

import { evaluateAdmission } from "../services/admission/knowledgeAdmissionEngine";

const CASES = [
  {
    title: "Chevy built an all-American EV truck — why is nobody buying it?",
    expect: "enrich_existing", // not a permanent topic — enrich EV/automotive catalog
  },
  {
    title: "Java Lambdas",
    expect: "permanent_knowledge",
  },
  {
    title: "Index Funds",
    expect: "permanent_knowledge",
  },
  {
    title: "GitHub releases Copilot update with new agent features",
    expect: "enrich_existing",
  },
  {
    title: "Startup Battlefield applications close July 6",
    expect: "archive_news",
  },
  {
    title: "What is Personal Finance",
    expect: "permanent_knowledge",
  },
];

let passed = 0;
let failed = 0;

console.log("Knowledge Admission Engine — validation\n");

for (const c of CASES) {
  const decision = evaluateAdmission({ title: c.title, summary: "", content: "" });
  const ok = decision.action === c.expect;
  if (ok) passed++;
  else failed++;

  console.log(`${ok ? "✓" : "✗"} "${c.title.slice(0, 50)}..."`);
  console.log(`  expected: ${c.expect} | got: ${decision.action} (${decision.reason})`);
  console.log(`  news=${decision.newsScore.toFixed(2)} evergreen=${decision.evergreenScore.toFixed(2)} publish=${decision.allowPublish}\n`);
}

console.log(`Results: ${passed}/${CASES.length} passed`);
if (failed > 0) {
  process.exit(1);
}
