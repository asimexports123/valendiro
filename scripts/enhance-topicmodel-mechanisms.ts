#!/usr/bin/env tsx
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

function pickLinesWithKeywords(text: string, keywords: string[]) {
  const s = (text || "").replace(/\s+/g, " ");
  const parts = s.split(/[\.\n]/).map((p) => p.trim()).filter(Boolean);
  const hits: string[] = [];
  for (const p of parts) {
    for (const k of keywords) {
      if (p.toLowerCase().includes(k)) {
        hits.push(p.endsWith(".") ? p : p + ".");
        break;
      }
    }
    if (hits.length >= 6) break;
  }
  return hits;
}

function makeMechanisms(model: any) {
  const facts = (model.concepts || []).flatMap((c: any) => c.supportingFacts || []);
  const joined = facts.join(" ");

  const mechanisms: any[] = [];
  // Premium calculation mechanism
  const premiumKeys = ["premium", "calculate", "calculated", "factor", "age", "location", "tobacco", "enroll"];
  const premiumSteps = pickLinesWithKeywords(joined, premiumKeys);
  if (premiumSteps.length > 0) {
    mechanisms.push({
      id: "m-premium",
      title: "How premiums are calculated",
      steps: premiumSteps,
      supportingFacts: premiumSteps,
    });
  }

  // Claim lifecycle mechanism
  const claimKeys = ["claim", "file", "adjudicat", "appeal", "deny", "payment", "submit", "prove"];
  const claimSteps = pickLinesWithKeywords(joined, claimKeys);
  if (claimSteps.length > 0) {
    mechanisms.push({
      id: "m-claims",
      title: "How a claim is processed",
      steps: claimSteps,
      supportingFacts: claimSteps,
    });
  }

  // Point-of-care cost flow (deductible/copay/coinsurance)
  const costKeys = ["deductible", "copay", "coinsurance", "out-of-pocket", "out of pocket", "co-payment"];
  const costSteps = pickLinesWithKeywords(joined, costKeys);
  if (costSteps.length > 0) {
    mechanisms.push({
      id: "m-costflow",
      title: "How cost-sharing works at point of care",
      steps: costSteps,
      supportingFacts: costSteps,
    });
  }

  return mechanisms;
}

function inferCausalEdgesFromMechanisms(model: any, mechanisms: any[]) {
  const edges: any[] = [];
  const concepts = model.concepts || [];
  const lookup = (text: string) => {
    const key = (text || "").toLowerCase().split(/\s+/).filter((w) => w.length > 3)[0] || "";
    return concepts.find((c: any) => ((c.label || "") + " " + (c.canonicalAssertion || "")).toLowerCase().includes(key));
  };
  for (const m of mechanisms) {
    // map mechanism to the most relevant concept (by matching first step token)
    const first = m.steps[0] || m.supportingFacts[0] || "";
    const target = lookup(first);
    if (target) {
      edges.push({ from: m.id, to: target.id, relation: "enables", weight: 80 });
    }
    // link mechanism from likely prerequisites if tokens match
    for (const c of concepts) {
      if (m.supportingFacts.join(" ").toLowerCase().includes((c.label || "").toLowerCase().split(" ")[0])) {
        edges.push({ from: c.id, to: m.id, relation: "requires", weight: 60 });
      }
    }
  }
  return edges;
}

function enhanceModel(pathIn: string, pathOut: string) {
  const raw = readFileSync(pathIn, "utf8");
  const model = JSON.parse(raw);
  const mechanisms = makeMechanisms(model);
  model.mechanisms = model.mechanisms ? model.mechanisms.concat(mechanisms) : mechanisms;
  const cedges = inferCausalEdgesFromMechanisms(model, mechanisms);
  model.causalEdges = (model.causalEdges || []).concat(cedges);
  // add simple human-friendly headings where label is missing
  for (const c of model.concepts || []) {
    if (!c.label || c.label.trim().length === 0) {
      c.label = (c.canonicalAssertion || "").split(/[.?!]/)[0].slice(0, 60).trim();
    }
  }
  writeFileSync(pathOut, JSON.stringify(model, null, 2), "utf8");
  console.log("Enhanced model written to", pathOut);
}

const inPath = resolve(process.cwd(), "temp", "topicmodel-health-insurance.json");
const outPath = resolve(process.cwd(), "temp", "topicmodel-health-insurance-enhanced.json");
enhanceModel(inPath, outPath);
console.log("Done");

