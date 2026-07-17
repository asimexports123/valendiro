import * as dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

import { createAdminClient } from "../lib/supabase/admin";
import { gatherExternalWorldFuel } from "../services/discovery/brainExternalFuel";
import { runBrainEngine, writeBrainArticle } from "../services/discovery/catalogBrainEngine";
import { brainUnderstand, notesFactCount } from "../services/discovery/catalogBrainUtils";
import { evaluateBrainQuality, MIN_BRAIN_WORD_COUNT_SEED } from "../services/discovery/brainQualityGate";
import { evaluateOriginality } from "../services/discovery/originalityGate";
import { getPhase1SeedTopic } from "../config/phase1SeedTopics";

async function diagnose(slug: string) {
  console.log("\n=== " + slug + " ===");
  const sb = createAdminClient();
  const { data: t, error } = await sb
    .from("topics")
    .select("id, slug, category_id, subcategory_id, topic_translations(title, content)")
    .eq("slug", slug)
    .eq("topic_translations.language_code", "en")
    .maybeSingle();
  if (error) console.log("query error:", error.message);
  if (!t) {
    console.log("NOT FOUND");
    return;
  }
  const trans = (t.topic_translations as Array<{ title?: string; content?: string }> | null)?.[0];
  const target = {
    topicId: t.id,
    slug: t.slug,
    title: trans?.title ?? slug,
    wordCount: (trans?.content ?? "").split(/\s+/).filter(Boolean).length,
    factCount: 0,
    categorySlug: null as string | null,
    subcategorySlug: null as string | null,
    categoryTitle: null,
    subcategoryTitle: null,
    priorityScore: 0,
    reason: "",
  };
  const fuel = await gatherExternalWorldFuel(target);
  const chars = fuel.texts.reduce((s, x) => s + x.length, 0);
  console.log("1. FUEL: sources=" + fuel.sourceCount + " texts=" + fuel.texts.length + " chars=" + chars);
  if (fuel.texts.length < 2) {
    console.log("   FAIL: need >=2 fuel texts");
    return;
  }

  const seed = getPhase1SeedTopic(slug);
  const notes = brainUnderstand(fuel.texts, seed?.primaryKeyword ?? target.title);
  console.log("2. FACTS: allFacts=" + notes.allFacts.length + " typed=" + notesFactCount(notes));
  console.log(
    "   defs=" +
      notes.definitions.length +
      " props=" +
      notes.properties.length +
      " procs=" +
      notes.procedures.length
  );
  if (notes.allFacts.length < 6) {
    console.log("   FAIL: need >=6 facts");
    return;
  }

  const md = writeBrainArticle(target, notes);
  if (!md) {
    console.log("3. WRITE: FAIL (sectionsWritten < 4)");
    return;
  }
  const wc = md.split(/\s+/).filter(Boolean).length;
  const h2s = (md.match(/^## /gm) ?? []).length;
  console.log("3. WRITE: words=" + wc + " h2s=" + h2s);

  const q = evaluateBrainQuality(md, { minWords: MIN_BRAIN_WORD_COUNT_SEED, minDistinctIdeas: 5 });
  console.log("4. QUALITY: pass=" + q.pass + " words=" + q.wordCount + " ideas=" + q.distinctIdeas);
  if (!q.pass) console.log("   reasons: " + q.reasons.join("; "));

  // Match publish path: originality vs ranked facts, not raw Wikipedia fuel
  const oFacts = evaluateOriginality(md, notes.allFacts.length > 0 ? notes.allFacts : fuel.texts);
  const oFuel = evaluateOriginality(md, fuel.texts);
  console.log(
    "5. ORIGINALITY (vs facts): pass=" +
      oFacts.pass +
      " overlap=" +
      Math.round(oFacts.maxOverlap * 100) +
      "%"
  );
  console.log(
    "   (vs raw fuel, legacy): pass=" +
      oFuel.pass +
      " overlap=" +
      Math.round(oFuel.maxOverlap * 100) +
      "%"
  );
  if (!oFacts.pass) console.log("   reason: " + oFacts.reason);

  const brain = runBrainEngine(target, fuel.texts);
  console.log("6. FINAL runBrainEngine: " + (brain ? "PASS" : "NULL"));
  if (md) {
    const first = md
      .split(/\n\n/)
      .map((p) => p.trim())
      .find((p) => p && !p.startsWith("#"));
    console.log("7. OPENING: " + (first ?? "").slice(0, 180));
  }
}

async function main() {
  await diagnose("compound-interest-explained");
  await diagnose("css-fundamentals");
  await diagnose("what-is-artificial-intelligence");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
