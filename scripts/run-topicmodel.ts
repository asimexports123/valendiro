import * as dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

import { createAdminClient } from "@/lib/supabase/admin";
import { gatherExternalWorldFuel } from "../services/discovery/brainExternalFuel";
import { brainUnderstand } from "../services/discovery/catalogBrainUtils";
import { rankBrainNotes } from "../services/discovery/brainSemanticRank";
import { buildTopicModel } from "../services/discovery/topicModel";

async function run() {
  const slugs = ["what-is-artificial-intelligence", "design-patterns", "html-fundamentals"];
  const sb = createAdminClient();
  const out: any[] = [];
  for (const slug of slugs) {
    const { data: row } = await sb
      .from("topics")
      .select("id, topic_translations(title)")
      .eq("slug", slug)
      .eq("topic_translations.language_code", "en")
      .maybeSingle();
    if (!row) {
      out.push({ slug, error: "missing topic" });
      continue;
    }
    const title = (row.topic_translations as any)[0].title;
    const target = { topicId: row.id, slug, title } as any;
    const fuel = await gatherExternalWorldFuel(target);
    let notes = brainUnderstand(fuel.texts, title, { slug, relaxed: true });
    notes = rankBrainNotes(notes, title, { slug });
    const model = buildTopicModel(notes, title, { slug });
    out.push({ slug, title, model });
  }
  console.log(JSON.stringify(out, null, 2));
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

