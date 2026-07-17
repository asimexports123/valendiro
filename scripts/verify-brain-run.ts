#!/usr/bin/env tsx
import * as dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

import { createAdminClient } from "../lib/supabase/admin";
import { gatherExternalWorldFuel } from "../services/discovery/brainExternalFuel";
import { brainUnderstand } from "../services/discovery/catalogBrainUtils";
import { writeBrainArticleOriginal, writeBrainArticle } from "../services/discovery/brainWriter";
import { readFileSync, writeFileSync } from "fs";

const TOPICS = [
  "html-fundamentals",
  "design-patterns",
  "sql-fundamentals",
  "index-funds",
  "strength-training-basics",
  "stress-management-basics",
  "compound-interest-explained",
  "what-is-artificial-intelligence",
  "project-management",
  "travel-planning-fundamentals",
];

type Result = {
  slug: string;
  success: boolean;
  reason?: string;
  words?: number;
  url?: string;
};

async function main() {
  const sb = createAdminClient();
  const results: Result[] = [];

  for (const slug of TOPICS) {
    try {
      console.log(`\n=== Topic: ${slug} ===`);
      const { data: topic } = await sb
        .from("topics")
        .select("id, slug, topic_translations(title)")
        .eq("slug", slug)
        .eq("topic_translations.language_code", "en")
        .maybeSingle();
      if (!topic) {
        console.log("Topic not found in DB:", slug);
        results.push({ slug, success: false, reason: "Topic missing in DB" });
        continue;
      }
      const title = (topic.topic_translations as any)[0]?.title || slug.split("-").map(s=>s[0].toUpperCase()+s.slice(1)).join(" ");
      const target = { topicId: topic.id, slug, title } as any;

      const fuel = await gatherExternalWorldFuel(target);
      const notes = brainUnderstand(fuel.texts, title);
      console.log("Facts:", notes.allFacts?.length ?? 0, "Defs:", notes.definitions?.length ?? 0);

      // Try original writer (with retries)
      const writtenOriginal = writeBrainArticleOriginal
        ? writeBrainArticleOriginal(notes, title, slug, fuel.texts || [])
        : null;

      let resultArticle = null;
      if (writtenOriginal) {
        resultArticle = writtenOriginal;
      } else {
        // Fallback to single-shot writer
        const simple = writeBrainArticle(notes, title, slug, 0);
        if (simple) {
          resultArticle = simple;
        }
      }

      if (!resultArticle) {
        console.log("Writer produced no article for", slug);
        results.push({ slug, success: false, reason: "Writer returned null" });
        continue;
      }

      const md = resultArticle.markdown;
      const words = resultArticle.wordCount;
      const tmpPath = resolve(process.cwd(), "temp", `${slug}-article.md`);
      writeFileSync(tmpPath, md, "utf8");

      // Upsert into topic_translations
      const { data: existing } = await sb
        .from("topic_translations")
        .select("id")
        .eq("topic_id", topic.id)
        .eq("language_code", "en")
        .maybeSingle();

      if (existing) {
        await sb
          .from("topic_translations")
          .update({ content: md })
          .eq("id", existing.id);
        console.log("Updated topic_translations for", slug);
      } else {
        await sb.from("topic_translations").insert([
          {
            topic_id: topic.id,
            language_code: "en",
            title,
            content: md,
          },
        ]);
        console.log("Inserted topic_translations for", slug);
      }

      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
      const url = `${siteUrl}/en/topics/${slug}`;
      results.push({ slug, success: true, words, url });
    } catch (e: any) {
      console.error("Error processing", slug, e?.message ?? e);
      results.push({ slug, success: false, reason: e?.message ?? String(e) });
    }
  }

  // Summary
  console.log("\n=== Run Summary ===");
  for (const r of results) {
    if (r.success) {
      console.log(`✓ ${r.slug} -> ${r.url} (${r.words} words)`);
    } else {
      console.log(`✗ ${r.slug} -> ${r.reason}`);
    }
  }
  // Save results
  writeFileSync(resolve(process.cwd(), "temp", "verify-brain-run-results.json"), JSON.stringify(results, null, 2), "utf8");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

