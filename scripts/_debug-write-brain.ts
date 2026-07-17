import * as dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(process.cwd(), ".env.local") });
process.env.BRAIN_DEBUG_WRITER = "true";

import { createAdminClient } from "../lib/supabase/admin";
import { gatherExternalWorldFuel } from "../services/discovery/brainExternalFuel";
import { writeBrainArticle } from "../services/discovery/brainWriter";
import { brainUnderstand } from "../services/discovery/catalogBrainUtils";
import { getPhase1SeedTopic } from "../config/phase1SeedTopics";
import { rankBrainNotes } from "../services/discovery/brainSemanticRank";

async function main() {
  const slug = process.argv[2] || "html-fundamentals";
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
  const seed = getPhase1SeedTopic(slug);
  let notes = brainUnderstand(fuel.texts, seed?.primaryKeyword ?? title);
  console.log("facts", notes.allFacts.length, "defs", notes.definitions.length, "warn", notes.warnings?.length);
  const result = writeBrainArticle(notes, title, slug, 0);
  console.log(result ? `OK words=${result.wordCount} sections=${result.sectionsWritten}` : "NULL");
  if (result) console.log(result.markdown.split("\n").slice(0, 25).join("\n"));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
