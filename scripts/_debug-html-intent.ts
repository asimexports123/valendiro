import * as dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

import { createAdminClient } from "../lib/supabase/admin";
import { gatherExternalWorldFuel } from "../services/discovery/brainExternalFuel";
import { brainUnderstand } from "../services/discovery/catalogBrainUtils";
import { getPhase1SeedTopic } from "../config/phase1SeedTopics";
import {
  selectPrimaryDefinitionFact,
  scoreAsFirstAnswer,
  inferReaderFirstQuestion,
  topIntroFacts,
  shouldSkipIntroJourneyLead,
} from "../services/discovery/brainReaderIntent";
import { auditSemanticRanking, scoreFactPriority } from "../services/discovery/brainSemanticRank";
import { shortTopicLabel } from "../services/content/topicHeading";
import { buildUnderstandKeywords } from "../services/discovery/catalogBrainUtils";

async function main() {
  const slug = "html-fundamentals";
  const sb = createAdminClient();
  const { data: t } = await sb
    .from("topics")
    .select("id, slug, topic_translations(title)")
    .eq("slug", slug)
    .eq("topic_translations.language_code", "en")
    .maybeSingle();
  if (!t) throw new Error("not found");
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
  const seed = getPhase1SeedTopic(slug);
  const notes = brainUnderstand(fuel.texts, seed?.primaryKeyword ?? title);
  const bodyLabel = shortTopicLabel(title);
  const intent = inferReaderFirstQuestion(title, bodyLabel);
  const keywords = buildUnderstandKeywords(bodyLabel, { slug, primaryKeyword: seed?.primaryKeyword });
  console.log("intent", intent);
  console.log("keywords", keywords.slice(0, 8));
  const primary = selectPrimaryDefinitionFact(notes, title, bodyLabel, {
    slug,
    primaryKeyword: seed?.primaryKeyword,
  });
  console.log("PRIMARY", primary?.slice(0, 180) ?? "NONE");
  const top = topIntroFacts(notes, bodyLabel, {
    slug,
    primaryKeyword: seed?.primaryKeyword,
    displayName: title,
  });
  console.log("top.definition", top.definition?.slice(0, 180));
  console.log(
    "skipJourney",
    shouldSkipIntroJourneyLead(notes, bodyLabel, { slug, displayName: title })
  );
  for (const f of notes.definitions.slice(0, 10)) {
    const a = scoreAsFirstAnswer(f, intent, keywords);
    const p = scoreFactPriority(f, bodyLabel, { slug });
    console.log(`ans=${a} pri=${p.priority} | ${f.slice(0, 100)}`);
  }
  const markup = notes.allFacts.filter((f) => /markup language|hypertext/i.test(f));
  console.log("markup facts", markup.length);
  for (const f of markup.slice(0, 5)) {
    const a = scoreAsFirstAnswer(f, intent, keywords);
    const p = scoreFactPriority(f, bodyLabel, { slug });
    console.log(`MARKUP ans=${a} pri=${p.priority} | ${f.slice(0, 120)}`);
  }
  const audit = auditSemanticRanking(notes, bodyLabel, {
    slug,
    primaryKeyword: seed?.primaryKeyword,
  });
  console.log("audit top", audit.topSelected[0]?.priority, audit.topSelected[0]?.fact?.slice(0, 100));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
