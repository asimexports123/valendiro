import * as dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

import { createAdminClient } from "../lib/supabase/admin";
import { gatherExternalWorldFuel } from "../services/discovery/brainExternalFuel";
import { runCatalogBrain } from "../services/discovery/catalogBrain";
import { topIntroFacts, shouldSkipIntroJourneyLead } from "../services/discovery/brainReaderIntent";
import { brainUnderstand } from "../services/discovery/catalogBrainUtils";
import { getPhase1SeedTopic } from "../config/phase1SeedTopics";
import { shortTopicLabel } from "../services/content/topicHeading";

async function main() {
  const slug = "html-fundamentals";
  const sb = createAdminClient();
  const { data: t } = await sb
    .from("topics")
    .select("id, slug, topic_translations(title)")
    .eq("slug", slug)
    .eq("topic_translations.language_code", "en")
    .maybeSingle();
  if (!t) throw new Error("missing");
  const title = (t.topic_translations as Array<{ title: string }>)[0].title;
  const target = {
    topicId: t.id,
    slug,
    title,
    wordCount: 0,
    factCount: 0,
    categorySlug: null,
    subcategorySlug: null,
    categoryTitle: null,
    subcategoryTitle: null,
    priorityScore: 0,
    reason: "",
  };
  const fuel = await gatherExternalWorldFuel(target);
  console.log(
    "fuel sources=",
    fuel.sourceCount,
    "wiki=",
    fuel.blocks.filter((b) => /wikipedia/i.test(b.url)).map((b) => b.url)
  );
  const seed = getPhase1SeedTopic(slug);
  const notes = brainUnderstand(fuel.texts, seed?.primaryKeyword ?? title);
  const body = shortTopicLabel(title);
  const top = topIntroFacts(notes, body, {
    slug,
    primaryKeyword: seed?.primaryKeyword,
    displayName: title,
  });
  console.log("PRIMARY DEF:", top.definition?.slice(0, 160));
  console.log("skipJourney", shouldSkipIntroJourneyLead(notes, body, { slug, displayName: title }));
  const brain = runCatalogBrain(target, fuel.texts);
  if (!brain) {
    console.log("brain NULL");
    return;
  }
  console.log("--- markdown head ---");
  console.log(brain.markdown.split("\n").slice(0, 25).join("\n"));
  console.log("--- words", brain.quality.wordCount, "pass", brain.quality.pass);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
