import * as dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

import { createAdminClient } from "@/lib/supabase/admin";
import { gatherExternalWorldFuel } from "../services/discovery/brainExternalFuel";
import { brainUnderstand, notesFactCount } from "../services/discovery/catalogBrainUtils";
import { rankBrainNotes } from "../services/discovery/brainSemanticRank";
import { planArticleReasoning } from "../services/discovery/brainReasoning";
import { composeArticleArc } from "../services/discovery/brainCompose";
import { writeBrainArticle } from "../services/discovery/brainWriter";
import { planArticleSections } from "../services/discovery/languageSystem/rhetoric";

async function main() {
  const slug = "what-is-artificial-intelligence";
  const sb = createAdminClient();
  const { data: row } = await sb
    .from("topics")
    .select("id, topic_translations(title)")
    .eq("slug", slug)
    .eq("topic_translations.language_code", "en")
    .maybeSingle();
  if (!row) throw new Error("missing topic");
  const title = (row.topic_translations as Array<{ title: string }>)[0].title;
  const target = {
    topicId: row.id,
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
    JSON.stringify(
      {
        sources: fuel.sourceCount,
        chars: fuel.texts.reduce((s, t) => s + t.length, 0),
        teach: fuel.teachingCoverage,
      },
      null,
      2
    )
  );
  let notes = brainUnderstand(fuel.texts, title, { slug, relaxed: true });
  notes = rankBrainNotes(notes, title, { slug });
  console.log(
    JSON.stringify(
      {
        all: notes.allFacts.length,
        typed: notesFactCount(notes),
        def: notes.definitions.length,
        prop: notes.properties.length,
        proc: notes.procedures.length,
        warn: notes.warnings.length,
      },
      null,
      2
    )
  );
  const reasoning = planArticleReasoning(notes, "AI", 0);
  const arc = composeArticleArc(reasoning, "AI");
  for (const p of planArticleSections(title)) {
    console.log(
      `${p.id} theses=${(arc.get(p.id) || []).length} reason=${(reasoning.get(p.id) || []).length}`
    );
  }
  process.env.BRAIN_DEBUG_WRITER = "true";
  const w = writeBrainArticle(notes, title, slug, 0, fuel.texts);
  console.log(JSON.stringify(w ? { words: w.wordCount, sections: w.sectionsWritten } : null));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
