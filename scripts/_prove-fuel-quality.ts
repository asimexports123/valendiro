/**
 * Prove fuel quality: >=2 texts + definition signal + primary first-answer fact.
 * Run: npx tsx scripts/_prove-fuel-quality.ts
 */
import * as dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

import { createAdminClient } from "../lib/supabase/admin";
import { gatherExternalWorldFuel } from "../services/discovery/brainExternalFuel";
import { brainUnderstand } from "../services/discovery/catalogBrainUtils";
import { getPhase1SeedTopic } from "../config/phase1SeedTopics";
import {
  selectPrimaryDefinitionFact,
  inferReaderFirstQuestion,
} from "../services/discovery/brainReaderIntent";
import { shortTopicLabel } from "../services/content/topicHeading";
import type { CatalogTopicTarget } from "../services/discovery/catalogHierarchy";

const SLUGS = [
  "html-fundamentals",
  "what-is-artificial-intelligence",
  "design-patterns",
  "health-insurance",
  "index-funds",
];

async function loadTarget(slug: string): Promise<CatalogTopicTarget | null> {
  const sb = createAdminClient();
  const { data: row } = await sb
    .from("topics")
    .select("id, slug, topic_translations(title)")
    .eq("slug", slug)
    .eq("topic_translations.language_code", "en")
    .maybeSingle();
  if (!row) return null;
  const title = (row.topic_translations as Array<{ title: string }>)?.[0]?.title ?? slug;
  return {
    topicId: row.id,
    slug: row.slug,
    title,
    wordCount: 0,
    factCount: 0,
    categorySlug: null,
    categoryTitle: null,
    subcategorySlug: null,
    subcategoryTitle: null,
    priorityScore: 100,
    reason: "fuel-proof",
  };
}

async function prove(slug: string) {
  console.log(`\n=== ${slug} ===`);
  const target = await loadTarget(slug);
  if (!target) {
    console.log("NOT FOUND");
    return false;
  }
  const fuel = await gatherExternalWorldFuel(target);
  const chars = fuel.texts.reduce((s, t) => s + t.length, 0);
  console.log(
    `fuel: sources=${fuel.sourceCount} texts=${fuel.texts.length} chars=${chars} wiki=${fuel.encyclopedicCount} defSignal=${fuel.hasDefinitionSignal}`
  );
  console.log(
    "urls:",
    fuel.blocks.map((b) => `${b.source}:${b.adapterName}:${b.url.slice(0, 60)}`).join(" | ")
  );

  const seed = getPhase1SeedTopic(slug);
  const bodyLabel = shortTopicLabel(target.title);
  const notes = brainUnderstand(fuel.texts, seed?.primaryKeyword ?? target.title);
  const primary = selectPrimaryDefinitionFact(notes, target.title, bodyLabel, {
    slug,
    primaryKeyword: seed?.primaryKeyword,
  });
  const intent = inferReaderFirstQuestion(target.title, bodyLabel);
  console.log("intent:", intent.firstQuestion);
  console.log("primary:", primary?.slice(0, 160) ?? "NONE");
  console.log(
    "markup/def keywords:",
    notes.allFacts.filter((f) =>
      /\b(markup language|hypertext|is a|is an|design pattern|index fund|health insurance|artificial intelligence)\b/i.test(
        f
      )
    ).length
  );

  const ok =
    fuel.texts.length >= 2 &&
    fuel.hasDefinitionSignal &&
    Boolean(primary) &&
    !/\b(head of an|getting started|buzzword|there are many other elements)\b/i.test(primary ?? "");
  console.log(ok ? "PASS" : "FAIL");
  return ok;
}

async function main() {
  const results: Record<string, boolean> = {};
  for (const slug of SLUGS) {
    results[slug] = await prove(slug);
  }
  console.log("\n=== SUMMARY ===");
  console.log(results);
  const all = Object.values(results).every(Boolean);
  process.exit(all ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
