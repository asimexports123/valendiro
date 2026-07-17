import * as dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

import { createAdminClient } from "../lib/supabase/admin";
import { gatherExternalWorldFuel } from "../services/discovery/brainExternalFuel";
import { brainUnderstand } from "../services/discovery/catalogBrainUtils";
import { getPhase1SeedTopic } from "../config/phase1SeedTopics";
import {
  selectPrimaryDefinitionFact,
  topIntroFacts,
  shouldSkipIntroJourneyLead,
} from "../services/discovery/brainReaderIntent";
import { explainIntro } from "../services/discovery/brainExplain";
import { composeIntroNarrative } from "../services/discovery/brainCompose";
import { shortTopicLabel } from "../services/content/topicHeading";
import { resolveTopicDisplayName } from "../services/content/topicHeading";

async function main() {
  const slug = "health-insurance";
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
    categoryTitle: null,
    subcategorySlug: null,
    subcategoryTitle: null,
    priorityScore: 0,
    reason: "",
  };
  const fuel = await gatherExternalWorldFuel(target);
  console.log("fuel", fuel.sourceCount, "def", fuel.hasDefinitionSignal);
  const seed = getPhase1SeedTopic(slug);
  const notes = brainUnderstand(fuel.texts, seed?.primaryKeyword ?? title);
  const displayName = resolveTopicDisplayName(slug, title);
  const bodyLabel = shortTopicLabel(slug, title);
  const primary = selectPrimaryDefinitionFact(notes, displayName, bodyLabel, {
    slug,
    primaryKeyword: seed?.primaryKeyword,
  });
  const top = topIntroFacts(notes, bodyLabel, {
    slug,
    primaryKeyword: seed?.primaryKeyword,
    displayName,
  });
  const skip = shouldSkipIntroJourneyLead(notes, bodyLabel, { slug, displayName });
  console.log("displayName", displayName, "bodyLabel", bodyLabel);
  console.log("PRIMARY", primary?.slice(0, 160));
  console.log("top.def", top.definition?.slice(0, 160));
  console.log("skipJourney", skip);
  const introRaw = explainIntro(notes, bodyLabel, displayName, 0, slug);
  console.log("introRaw:\n", introRaw.slice(0, 500));
  const composed = composeIntroNarrative(introRaw.split(/\n{2,}/).filter(Boolean), 0, bodyLabel, {
    skipJourneyLead: skip,
  });
  console.log("composed:\n", composed.slice(0, 500));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
