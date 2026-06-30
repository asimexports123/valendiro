/**
 * Local validation script — runs pipeline directly without HTTP.
 * Usage: npx tsx scripts/run-validation.ts
 */
import "dotenv/config";
import * as dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

import { createClient } from "@supabase/supabase-js";
import {
  runResearchAgent,
  runOutlineAgent,
  runWriterAgent,
  runDeterministicQualityCheck,
  buildDeterministicSEOFields,
} from "../services/intelligence/agentPipeline";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TOPICS = [
  "CMD vs ENTRYPOINT in Docker",
  "What is Python?",
  "Index Funds",
  "Type 2 Diabetes",
  "Eiffel Tower",
  "Tesla Model 3",
  "Kubernetes",
  "Mortgage Calculator",
  "World War II",
  "I Will Find You (miniseries)",
];

async function generateOne(keyword: string) {
  const { pack, intent, durationMs: d1 } = await runResearchAgent(keyword, "general");
  const { structure, durationMs: d2 } = await runOutlineAgent(pack, intent);
  const { content, durationMs: d3 } = await runWriterAgent(pack, structure, intent);
  const quality = runDeterministicQualityCheck(content);
  const seo = buildDeterministicSEOFields(structure.title, keyword, pack);

  const slug = structure.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);

  // Upsert — delete existing slug first
  const { data: existing } = await supabase.from("articles").select("id").eq("slug", slug).maybeSingle();
  if (existing) {
    await supabase.from("article_translations").delete().eq("article_id", existing.id);
    await supabase.from("articles").delete().eq("id", existing.id);
  }

  const { data: article, error } = await supabase
    .from("articles")
    .insert({ slug, canonical_path: `/en/articles/${slug}`, article_type: "guide", status: "draft" })
    .select()
    .single();

  if (error || !article) throw new Error(error?.message || "Insert failed");

  const firstParagraph = content.replace(/^#+.+$/gm, "").split(/\n{2,}/).find((p) => p.trim().length > 40) ?? "";
  const excerpt = firstParagraph.replace(/\*\*/g, "").trim().slice(0, 250);

  await supabase.from("article_translations").insert({
    article_id: article.id,
    language_code: "en",
    title: structure.title,
    excerpt,
    content,
    meta_title: seo.metaTitle,
    meta_description: seo.metaDescription,
  });

  return {
    intent,
    title: structure.title,
    slug,
    wordCount: quality.wordCount,
    qualityScore: quality.score,
    qualityIssues: quality.issues,
    sections: structure.sections.map((s) => s.heading),
    totalMs: d1 + d2 + d3,
  };
}

async function main() {
  console.log("=".repeat(65));
  console.log("VALIDATION: 10-Article Intent-Aware Pipeline Test");
  console.log("=".repeat(65));

  const results: Array<{ keyword: string; ok: boolean; data?: any; error?: string }> = [];

  for (let i = 0; i < TOPICS.length; i++) {
    const keyword = TOPICS[i];
    // Rate limit: wait 35s between articles (Groq free tier ~1 req/min)
    if (i > 0) {
      console.log(`\n  ⏳ Waiting 35s for rate limit...`);
      await new Promise((r) => setTimeout(r, 35000));
    }
    console.log(`\n[${i + 1}/10] "${keyword}"`);
    console.log("-".repeat(55));
    try {
      const data = await generateOne(keyword);
      console.log(`  Intent   : ${data.intent}`);
      console.log(`  Title    : ${data.title}`);
      console.log(`  Words    : ${data.wordCount}`);
      console.log(`  Quality  : ${data.qualityScore}/100`);
      if (data.qualityIssues.length) console.log(`  Issues   : ${data.qualityIssues.join("; ")}`);
      console.log(`  Sections : ${data.sections.join(" | ")}`);
      console.log(`  Time     : ${(data.totalMs / 1000).toFixed(1)}s`);
      results.push({ keyword, ok: true, data });
    } catch (err: any) {
      console.error(`  ✗ FAILED: ${err.message}`);
      results.push({ keyword, ok: false, error: err.message });
    }
  }

  console.log("\n" + "=".repeat(65));
  console.log("FINAL SUMMARY");
  console.log("=".repeat(65));
  for (const r of results) {
    if (r.ok) {
      console.log(`✓ [${r.data.intent.padEnd(24)}] ${r.keyword}`);
    } else {
      console.log(`✗ [FAILED                  ] ${r.keyword} — ${r.error}`);
    }
  }
  const passed = results.filter((r) => r.ok).length;
  console.log(`\n${passed}/10 articles generated successfully.`);
}

main().catch(console.error);
