/**
 * Validation script: Generate 10 test articles using the new intent-aware pipeline.
 * Saves each as a draft article in the DB.
 * Run: node scripts/validate-10-articles.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const VALIDATION_TOPICS = [
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

async function insertArticle(keyword, intent, title, content, metaTitle, metaDescription) {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);

  const canonicalPath = `/en/articles/${slug}`;

  // Check duplicate slug
  const { data: existing } = await supabase
    .from("articles")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (existing) {
    console.log(`  ⚠ Slug already exists, skipping: ${slug}`);
    return null;
  }

  const { data: article, error } = await supabase
    .from("articles")
    .insert({
      slug,
      canonical_path: canonicalPath,
      article_type: "guide",
      status: "draft",
    })
    .select()
    .single();

  if (error || !article) {
    console.error(`  ✗ Article insert failed: ${error?.message}`);
    return null;
  }

  const firstParagraph = content
    .replace(/^#+.+$/gm, "")
    .split(/\n{2,}/)
    .find((p) => p.trim().length > 40) ?? "";
  const excerpt = firstParagraph.replace(/\*\*/g, "").trim().slice(0, 250);

  const { error: transError } = await supabase.from("article_translations").insert({
    article_id: article.id,
    language_code: "en",
    title,
    excerpt,
    content,
    meta_title: metaTitle,
    meta_description: metaDescription,
  });

  if (transError) {
    console.error(`  ✗ Translation insert failed: ${transError.message}`);
    return null;
  }

  return { id: article.id, slug, title, intent };
}

async function run() {
  console.log("=".repeat(60));
  console.log("VALIDATION: 10-Article Intent-Aware Pipeline Test");
  console.log("=".repeat(60));
  console.log();

  // Dynamically import the compiled pipeline
  // We call the Vercel API endpoint for each topic since we can't import TS directly
  // Instead, use the running dev server if available, otherwise use Vercel
  const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://valendiro.com";

  const results = [];

  for (let i = 0; i < VALIDATION_TOPICS.length; i++) {
    const keyword = VALIDATION_TOPICS[i];
    console.log(`\n[${i + 1}/10] "${keyword}"`);
    console.log("-".repeat(50));

    try {
      // Call the pipeline via the admin API with a direct action
      const res = await fetch(`${BASE_URL}/api/admin/validate-article`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-validate-secret": process.env.VALIDATE_SECRET || "validate-local-2026",
        },
        body: JSON.stringify({ keyword }),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error(`  ✗ API error ${res.status}: ${err.slice(0, 200)}`);
        results.push({ keyword, status: "failed", error: err.slice(0, 100) });
        continue;
      }

      const data = await res.json();
      console.log(`  ✓ Intent: ${data.intent}`);
      console.log(`  ✓ Title: ${data.title}`);
      console.log(`  ✓ Words: ${data.wordCount}`);
      console.log(`  ✓ Slug: ${data.slug}`);
      console.log(`  ✓ Quality: ${data.qualityScore}/100`);
      console.log(`  ✓ Sections: ${data.sections?.join(" → ")}`);
      results.push({ keyword, status: "ok", ...data });
    } catch (err) {
      console.error(`  ✗ Error: ${err.message}`);
      results.push({ keyword, status: "failed", error: err.message });
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("SUMMARY");
  console.log("=".repeat(60));
  for (const r of results) {
    const icon = r.status === "ok" ? "✓" : "✗";
    console.log(`${icon} ${r.keyword}`);
    if (r.status === "ok") {
      console.log(`    Intent: ${r.intent} | Words: ${r.wordCount} | Quality: ${r.qualityScore}/100`);
    } else {
      console.log(`    Error: ${r.error}`);
    }
  }
}

run().catch(console.error);
