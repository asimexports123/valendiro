/**
 * Editorial regression — regenerate benchmark and reject composition regressions.
 * Run: npx tsx scripts/brain-editorial-regression.ts
 */
import * as dotenv from "dotenv";
import { resolve } from "path";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });
process.env.BRAIN_AUTO_PUBLISH = "false";
process.env.ALLOW_RENDER = "true";

import { createAdminClient } from "@/lib/supabase/admin";
import { gatherExternalWorldFuel } from "../services/discovery/brainExternalFuel";
import { prepareBrainCandidates } from "../services/discovery/brainAssemble";
import { writeBrainArticleOriginal } from "../services/discovery/brainWriter";
import type { CatalogTopicTarget } from "../services/discovery/catalogHierarchy";
import {
  compareEditorialRegression,
  measureEditorialQuality,
  type EditorialMetrics,
} from "../services/discovery/brainEditorialRegression";
import { COMPOSITION_ENGINE_VERSION, EDITORIAL_BENCHMARK_SLUG } from "../services/discovery/brainComposeVersion";

const BENCHMARK_PATH = resolve(process.cwd(), "data/brain-benchmark/what-is-artificial-intelligence.json");

async function loadBenchmark(): Promise<EditorialMetrics | null> {
  if (!existsSync(BENCHMARK_PATH)) return null;
  return JSON.parse(readFileSync(BENCHMARK_PATH, "utf8")) as EditorialMetrics;
}

async function loadTopicTarget(slug: string): Promise<CatalogTopicTarget | null> {
  const sb = createAdminClient();
  const { data: row } = await sb
    .from("topics")
    .select("id, slug, topic_translations(title)")
    .eq("slug", slug)
    .eq("topic_translations.language_code", "en")
    .maybeSingle();
  if (!row) return null;
  const trans = row.topic_translations?.[0];
  return {
    topicId: row.id,
    slug: row.slug,
    title: trans?.title ?? slug,
    wordCount: 0,
    factCount: 0,
    categorySlug: null,
    categoryTitle: null,
    subcategorySlug: null,
    subcategoryTitle: null,
    priorityScore: 100,
    reason: "regression",
  };
}

async function generateBenchmarkArticle(): Promise<{ content: string; sources: string[] } | null> {
  const target = await loadTopicTarget(EDITORIAL_BENCHMARK_SLUG);
  if (!target) return null;
  const fuel = await gatherExternalWorldFuel(target);
  const prepared = prepareBrainCandidates(target, fuel);
  if (prepared.brainMarkdown) {
    return { content: prepared.brainMarkdown, sources: fuel.texts };
  }
  if (prepared.notes.allFacts.length < 3) return null;
  const written = writeBrainArticleOriginal(
    prepared.notes,
    target.title,
    target.slug,
    fuel.texts
  );
  if (!written) return null;
  return { content: written.markdown, sources: fuel.texts };
}

async function main() {
  mkdirSync(resolve(process.cwd(), "data/brain-benchmark"), { recursive: true });

  const generated = await generateBenchmarkArticle();
  if (!generated) {
    console.error("Failed to generate benchmark article");
    process.exit(1);
  }

  const candidate = measureEditorialQuality(
    generated.content,
    EDITORIAL_BENCHMARK_SLUG,
    generated.sources
  );
  candidate.slug = EDITORIAL_BENCHMARK_SLUG;

  const stored = await loadBenchmark();
  if (!stored) {
    writeFileSync(BENCHMARK_PATH, JSON.stringify({ version: COMPOSITION_ENGINE_VERSION, metrics: candidate }, null, 2));
    console.log(JSON.stringify({ status: "baseline_saved", version: COMPOSITION_ENGINE_VERSION, metrics: candidate }, null, 2));
    process.exit(0);
  }

  const verdict = compareEditorialRegression(stored, candidate);
  const out = {
    version: COMPOSITION_ENGINE_VERSION,
    slug: EDITORIAL_BENCHMARK_SLUG,
    pass: verdict.pass,
    regressions: verdict.regressions,
    benchmark: stored,
    candidate,
  };

  writeFileSync(BENCHMARK_PATH, JSON.stringify({ version: COMPOSITION_ENGINE_VERSION, metrics: candidate }, null, 2));
  console.log(JSON.stringify(out, null, 2));
  process.exit(verdict.pass ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
