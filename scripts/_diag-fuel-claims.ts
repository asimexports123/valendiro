#!/usr/bin/env tsx
import * as dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

import { createAdminClient } from "../lib/supabase/admin";
import { gatherExternalWorldFuel } from "../services/discovery/brainExternalFuel";
import { brainUnderstand } from "../services/discovery/catalogBrainUtils";
import { buildTopicModel } from "../services/discovery/topicModel";
import { selectPrimaryDefinitionFact } from "../services/discovery/brainReaderIntent";
import assessFactForSection from "../services/discovery/readerUnderstanding";

async function diag(slug: string) {
  const sb = createAdminClient();
  const { data: t } = await sb
    .from("topics")
    .select("id, slug, topic_translations(title)")
    .eq("slug", slug)
    .eq("topic_translations.language_code", "en")
    .maybeSingle();
  if (!t) throw new Error(`Missing ${slug}`);
  const title = (t.topic_translations as any)[0]?.title || slug;
  const fuel = await gatherExternalWorldFuel({ topicId: t.id, slug, title } as any);
  const notes = brainUnderstand(fuel.texts, title);
  const model = buildTopicModel(notes, title, { slug });
  const primary = selectPrimaryDefinitionFact(notes, title, title, { slug });

  console.log(`\n=== ${slug} ===`);
  console.log(`Fuel blocks: ${fuel.texts.length}, chars: ${fuel.texts.join("").length}`);
  console.log(`Definitions (${notes.definitions.length}):`);
  for (const [i, d] of notes.definitions.entries()) {
    const a = assessFactForSection(d, "overview", notes, title, { slug });
    console.log(`  [${i}] kept=${a.kept} ${a.reasons.join(";")} | ${d.slice(0, 130)}`);
  }
  console.log(`Primary def: ${primary?.slice(0, 140) ?? "(none)"}`);
  console.log(`Concepts (${model.concepts.length}):`);
  for (const c of model.concepts.slice(0, 14)) {
    console.log(`  ${c.id} ${c.type} title="${c.title}" facts=${c.supportingFacts.length}`);
  }

  // Sample why/how candidates
  const whyPool = notes.properties.filter((f) =>
    /\b(because|matters|purpose|helps|enables|allows|benefit|advantage|designed to)\b/i.test(f)
  );
  console.log(`Why candidates (${whyPool.length}):`);
  for (const f of whyPool.slice(0, 5)) {
    const a = assessFactForSection(f, "why", notes, title, { slug });
    console.log(`  kept=${a.kept} | ${f.slice(0, 120)}`);
  }
}

async function main() {
  for (const s of ["index-funds", "strength-training-basics"]) {
    await diag(s);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
