#!/usr/bin/env tsx
import * as dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

import { createAdminClient } from "../lib/supabase/admin";
import { gatherExternalWorldFuel } from "../services/discovery/brainExternalFuel";
import { brainUnderstand } from "../services/discovery/catalogBrainUtils";
import { writeBrainArticle } from "../services/discovery/brainWriter";
import { writeFileSync } from "fs";

const TOPICS = [
  "project-management",
  "what-is-artificial-intelligence",
  "strength-training-basics",
  "index-funds",
  "design-patterns",
];

async function processTopic(slug: string) {
  const sb = createAdminClient();
  const { data: t } = await sb
    .from("topics")
    .select("id, slug, topic_translations(title)")
    .eq("slug", slug)
    .eq("topic_translations.language_code", "en")
    .maybeSingle();
  if (!t) throw new Error(`Missing topic ${slug}`);
  const title = (t.topic_translations as any)[0]?.title || slug;
  const target = { topicId: t.id, slug, title } as any;
  const fuel = await gatherExternalWorldFuel(target);
  const notes = brainUnderstand(fuel.texts, title);
  const result = writeBrainArticle(notes, title, slug, 0);
  if (!result) {
    console.log(`Writer returned null for ${slug}`);
    return { slug, success: false, reason: "writer_null" };
  }
  const md = result.markdown;
  writeFileSync(resolve(process.cwd(), "temp", `${slug}-article.md`), md, "utf8");

  const { data: existing } = await sb
    .from("topic_translations")
    .select("id")
    .eq("topic_id", t.id)
    .eq("language_code", "en")
    .maybeSingle();
  if (existing) {
    await sb.from("topic_translations").update({ content: md }).eq("id", existing.id);
    console.log(`Updated ${slug}`);
  } else {
    await sb.from("topic_translations").insert([{ topic_id: t.id, language_code: "en", title, content: md }]);
    console.log(`Inserted ${slug}`);
  }
  const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return { slug, success: true, url: `${site}/en/topics/${slug}`, words: result.wordCount };
}

async function main() {
  const results = [];
  for (const s of TOPICS) {
    try {
      console.log(`Processing ${s}...`);
      const r = await processTopic(s);
      results.push(r);
    } catch (e: any) {
      console.error(`Error ${s}:`, e?.message ?? e);
      results.push({ slug: s, success: false, reason: e?.message ?? String(e) });
    }
  }
  writeFileSync(resolve(process.cwd(), "temp", "regenerate-five-results.json"), JSON.stringify(results, null, 2), "utf8");
  console.log("Done. Results written to temp/regenerate-five-results.json");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

