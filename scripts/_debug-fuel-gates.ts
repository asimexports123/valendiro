import * as dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

import { createAdminClient } from "../lib/supabase/admin";
import { gatherExternalWorldFuel } from "../services/discovery/brainExternalFuel";
import { runCatalogBrain } from "../services/discovery/catalogBrain";
import { evaluateOriginality } from "../services/discovery/originalityGate";

async function debug(slug: string) {
  const sb = createAdminClient();
  const { data: t } = await sb
    .from("topics")
    .select("id, slug, category_id, subcategory_id, topic_translations(title)")
    .eq("slug", slug)
    .single();
  if (!t) {
    console.log("slug:", slug, "NOT FOUND");
    return;
  }
  const title =
    (t.topic_translations as Array<{ title?: string }> | null)?.[0]?.title ?? slug;
  const target = {
    topicId: t.id,
    slug: t.slug,
    title,
    wordCount: 0,
    factCount: 0,
    categorySlug: "personal-finance",
    subcategorySlug: "investing",
    categoryTitle: "Personal Finance",
    subcategoryTitle: "Investing",
    priorityScore: 0,
    reason: "",
  };
  const fuel = await gatherExternalWorldFuel(target);
  console.log(
    "slug:",
    slug,
    "fuel sources:",
    fuel.sourceCount,
    "texts:",
    fuel.texts.length,
    "chars:",
    fuel.texts.reduce((s, x) => s + x.length, 0)
  );
  const brain = runCatalogBrain(target, fuel.texts);
  if (!brain) {
    console.log("brain: NULL");
    return;
  }
  const factCorpus = brain.notes.allFacts ?? [];
  const origFacts =
    factCorpus.length > 0 ? evaluateOriginality(brain.markdown, factCorpus) : null;
  const origFuel = evaluateOriginality(brain.markdown, fuel.texts);
  console.log(
    "brain words:",
    brain.quality.wordCount,
    "pass:",
    brain.quality.pass,
    "reasons:",
    brain.quality.reasons
  );
  if (origFacts) {
    console.log(
      "originality (vs facts): pass:",
      origFacts.pass,
      "overlap:",
      origFacts.maxOverlap,
      "reason:",
      origFacts.reason
    );
  }
  console.log(
    "originality (vs raw fuel): pass:",
    origFuel.pass,
    "overlap:",
    origFuel.maxOverlap,
    "reason:",
    origFuel.reason
  );
}
async function main() {
  await debug("compound-interest-explained");
  await debug("html-fundamentals");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
