/**
 * Re-render all knowledge packages with the new educational prose renderer,
 * then publish the content to topic_translations.
 *
 * Uses dynamic import so process.env is injected before the orchestrator
 * module loads (which calls createAdminClient at import time).
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://diwwvkbztvhwouttajha.supabase.co";
const SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY";

process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE_URL;
process.env.SUPABASE_SERVICE_ROLE_KEY = SERVICE_KEY;
process.env.ALLOW_RENDER = "true";

const sb = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
  // Dynamic import AFTER env vars are set
  const { render } = await import("@/services/renderer/orchestrator");

  console.log("=== Re-render + Publish Pipeline ===\n");

  // 1. Get all packages
  const { data: packages, error } = await sb
    .from("knowledge_packages")
    .select("id, slug, topic_id")
    .order("slug");

  if (error || !packages?.length) {
    console.error("Failed to load packages:", error);
    return;
  }

  console.log(`Found ${packages.length} packages.\n`);

  const results: { slug: string; words: number; status: string }[] = [];

  for (const pkg of packages) {
    process.stdout.write(`  Rendering: ${pkg.slug} ... `);

    try {
      const result = await render({
        packageId: pkg.id,
        format: "markdown",
        rendererId: "long-article",
        style: ["intermediate"],
        forceRerender: true,
      });

      const wordCount = result.content.split(/\s+/).filter(Boolean).length;

      // 2. Update topic_translations for this package's topic
      if (pkg.topic_id) {
        const { error: updateError } = await sb
          .from("topic_translations")
          .update({ content: result.content })
          .eq("topic_id", pkg.topic_id)
          .eq("language_code", "en");

        if (updateError) {
          console.log(`❌ topic update failed: ${updateError.message}`);
          results.push({ slug: pkg.slug, words: wordCount, status: "render-ok/publish-fail" });
          continue;
        }
      }

      const depth = wordCount < 200 ? "❌ SHALLOW" : wordCount < 400 ? "⚠️  THIN" : wordCount < 700 ? "✅ OK" : "✅✅ DEEP";
      console.log(`${depth} (${wordCount}w)`);
      results.push({ slug: pkg.slug, words: wordCount, status: result.status });
    } catch (err: any) {
      console.log(`❌ ERROR: ${err.message}`);
      results.push({ slug: pkg.slug, words: 0, status: "error" });
    }
  }

  console.log("\n=== Summary ===\n");
  const shallow = results.filter((r) => r.words < 200);
  const thin = results.filter((r) => r.words >= 200 && r.words < 400);
  const ok = results.filter((r) => r.words >= 400);

  console.log(`✅ OK or DEEP:  ${ok.length}`);
  console.log(`⚠️  Thin:       ${thin.length}`);
  console.log(`❌ Shallow:     ${shallow.length}`);

  if (shallow.length || thin.length) {
    console.log("\nPackages needing more facts:");
    [...shallow, ...thin].forEach((r) => console.log(`  ${r.words}w — ${r.slug}`));
  }

  console.log("\nDone.");
}

main().catch(console.error);
