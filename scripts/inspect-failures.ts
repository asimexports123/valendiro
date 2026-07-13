#!/usr/bin/env tsx
import * as dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

import { createAdminClient } from \"../lib/supabase/admin\";
import { gatherExternalWorldFuel } from \"../services/discovery/brainExternalFuel\";
import { brainUnderstand } from \"../services/discovery/catalogBrainUtils\";
import { rankBrainNotes } from \"../services/discovery/brainSemanticRank\";
import { traceBrainPipeline } from \"../services/discovery/brainWriter\";
import { isEditoriallySound } from \"../services/discovery/brainCompose\";

async function inspect(slug: string) {
  const sb = createAdminClient();
  const { data: row } = await sb
    .from("topics")
    .select("id, slug, topic_translations(title)")
    .eq("slug", slug)
    .eq("topic_translations.language_code", "en")
    .maybeSingle();
  if (!row) return { slug, error: "missing topic" };
  const title = (row.topic_translations as any)[0]?.title;
  const fuel = await gatherExternalWorldFuel({ topicId: row.id, slug, title } as any);
  const notes = brainUnderstand(fuel.texts, title, { slug, relaxed: true });
  const ranked = rankBrainNotes(notes, title, { slug });
  const trace = traceBrainPipeline(ranked, title, slug, fuel.texts, 0);

  const stages = trace.map((s) => {
    const para = s.paragraphOut ?? "";
    return {
      stage: s.stage,
      words: para.split(/\\s+/).filter(Boolean).length,
      editorial: isEditoriallySound(para, title),
      snippet: para.slice(0, 240),
    };
  });

  // Simple classifier heuristics
  const anyEditorialTrue = stages.some((st) => st.editorial && st.words >= 40);
  const avgWords = stages.reduce((a, b) => a + b.words, 0) / Math.max(1, stages.length);

  let rootCause = "unknown";
  if (notes.allFacts.length === 0 || fuel.sourceCount < 2) rootCause = "Insufficient source knowledge";
  else if (!anyEditorialTrue && avgWords < 30) rootCause = "Composition";
  else if (!anyEditorialTrue && avgWords >= 30) rootCause = "Claim synthesis";
  else rootCause = "Understanding / extraction";

  return {
    slug,
    title,
    fuelSources: fuel.sourceCount,
    rawFacts: notes.allFacts.length,
    stages,
    avgWords: Math.round(avgWords),
    rootCause,
  };
}

async function main() {
  const slugs = [
    "design-patterns",
    "html-fundamentals",
    "index-funds",
    "sql-fundamentals",
    "strength-training-basics",
    "stress-management-basics",
    "compound-interest-explained",
  ];
  const results: any[] = [];
  for (const s of slugs) {
    try {
      const r = await inspect(s);
      results.push(r);
    } catch (e: any) {
      results.push({ slug: s, error: String(e) });
    }
  }
  console.log(JSON.stringify(results, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

