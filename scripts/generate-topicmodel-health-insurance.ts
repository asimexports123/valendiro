#!/usr/bin/env tsx
import * as dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

import { createAdminClient } from "../lib/supabase/admin";
import { gatherExternalWorldFuel } from "../services/discovery/brainExternalFuel";
import { brainUnderstand } from "../services/discovery/catalogBrainUtils";
import { rankBrainNotes } from "../services/discovery/brainSemanticRank";
import { buildTopicModel, type TopicModel } from "../services/discovery/topicModel";
import { inferJourneyStage } from "../services/discovery/brainDiscoursePlanner";

function normalizeKey(s: string) {
  return (s || "")
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function topTokens(s: string, n = 6) {
  return normalizeKey(s)
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .slice(0, n);
}

function causalVerbFound(s: string) {
  return /\b(cause|lead to|leads to|result in|because|due to|increase|decrease|raise|reduce|drive|trigger)\b/i.test(s);
}

function inferReaderQuestions(conceptTitle: string, kind: string) {
  const q: string[] = [];
  if (/definition|what|is|means|refers/i.test(conceptTitle) || kind === "definition") {
    q.push(`What is ${conceptTitle}?`);
  }
  if (/benefit|advantag|reason|purpose|why/i.test(conceptTitle) || kind === "property") {
    q.push(`Why does ${conceptTitle} matter?`);
  }
  q.push(`How does ${conceptTitle} work in practice?`);
  return q;
}

async function main() {
  const sb = createAdminClient();
  const slug = "health-insurance";
  const { data: row } = await sb
    .from("topics")
    .select("id, slug, topic_translations(title)")
    .eq("slug", slug)
    .eq("topic_translations.language_code", "en")
    .maybeSingle();
  if (!row) {
    console.error("topic not found");
    process.exit(1);
  }
  const title = (row.topic_translations as any)[0]?.title || "Health Insurance";
  const fuel = await gatherExternalWorldFuel({ topicId: row.id, slug, title } as any);
  const notes = brainUnderstand(fuel.texts, title, { slug, relaxed: true });
  const ranked = rankBrainNotes(notes, title, { slug });
  const baseModel: TopicModel = buildTopicModel(ranked, title, { slug });

  // Enrich model with causalEdges, dependencyGraph, readerQuestions, mentalModels, importanceScores, misconceptions, scenarios, checkpoints
  const concepts = baseModel.concepts.map((c) => ({
    id: c.id,
    label: c.title ?? normalizeKey(c.supportingFacts[0] ?? "").slice(0, 40),
    canonicalAssertion: c.supportingFacts[0] ?? "",
    importanceScore: Math.min(1, Math.max(0, c.confidence / 100)),
    beginner: c.beginner,
    mentalModel:
      /risk|pool|premium|deductible|coinsurance|copay/i.test(c.title || c.supportingFacts.join(" "))
        ? "Think of it as a shared pot that members pay into so costs are distributed."
        : "",
    supportingFacts: c.supportingFacts,
    confidence: c.confidence,
  }));

  // causalEdges: if a concept's supporting facts mention another concept and contain causal verbs
  const causalEdges: Array<{ from: string; to: string; relation: string; strength: number }> = [];
  for (const a of baseModel.concepts) {
    for (const f of a.supportingFacts) {
      if (!causalVerbFound(f)) continue;
      for (const b of baseModel.concepts) {
        if (a.id === b.id) continue;
        const tk = topTokens(b.title || b.supportingFacts[0] || "");
        if (tk.some((t) => f.toLowerCase().includes(t))) {
          causalEdges.push({ from: a.id, to: b.id, relation: "causes", strength: 70 });
        }
      }
    }
  }

  // dependencyGraph: use existing edges plus causal edges
  const dependencyEdges = [...(baseModel.edges || []), ...causalEdges.map((e) => ({ from: e.from, to: e.to, relation: "causes", weight: e.strength }))];

  // readerQuestions per concept
  const readerQuestions = Object.fromEntries(
    baseModel.concepts.map((c) => [c.id, inferReaderQuestions(c.title || c.supportingFacts[0] || "", c.type)])
  );

  // misconceptions: use contradictions
  const misconceptions = baseModel.contradictions.map((ct) => ({
    pair: [ct.a, ct.b],
    whyOccurs: ct.reason,
    confidence: ct.confidence,
  }));

  // practical scenarios: extract from raw notes goods
  const scenarioCandidates = (notes.allFacts || []).filter((s) => /\b(for example|used in|such as|case|typical)\b/i.test(s)).slice(0, 8);
  const scenarios = scenarioCandidates.map((s, i) => ({ id: `s-${i}`, title: s.slice(0, 60), text: s }));

  // mechanisms: reuse
  const mechanisms = baseModel.mechanisms.map((m) => ({
    id: m.id,
    title: m.title,
    steps: m.steps,
    supportingFacts: m.supportingFacts,
  }));

  // teaching checkpoints: for each concept, require its incoming dependency predecessors
  const preds = new Map<string, Set<string>>();
  for (const e of dependencyEdges) {
    const set = preds.get(e.to) ?? new Set<string>();
    set.add(e.from);
    preds.set(e.to, set);
  }
  const teachingCheckpoints = Array.from(preds.entries()).map(([cid, deps], i) => ({
    id: `cp-${i}`,
    conceptIds: Array.from(deps),
    description: `Understand ${deps.size} prerequisite concept(s) before this concept.`,
  }));

  const topicModel = {
    slug,
    title,
    provenance: baseModel.provenance,
    concepts,
    mechanisms,
    edges: dependencyEdges,
    causalEdges,
    contradictions: baseModel.contradictions,
    readerQuestions,
    misconceptions,
    scenarios,
    teachingCheckpoints,
  };

  const outPath = "temp/topicmodel-health-insurance.json";
  require("fs").writeFileSync(outPath, JSON.stringify(topicModel, null, 2), "utf8");
  console.log("Wrote", outPath);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

