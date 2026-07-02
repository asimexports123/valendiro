/**
 * Publishes rendered Markdown content from rendered_outputs
 * into topic_translations.content so the public topic pages show articles.
 */

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://diwwvkbztvhwouttajha.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY";

import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  "https://diwwvkbztvhwouttajha.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY"
);

async function main() {
  console.log("=== Publishing Rendered Content to Topics ===\n");

  // Load all knowledge packages that have a topic_id
  const { data: packages } = await sb
    .from("knowledge_packages")
    .select("id, slug, topic_id")
    .not("topic_id", "is", null);

  if (!packages?.length) {
    console.log("No linked packages found.");
    return;
  }

  console.log(`Found ${packages.length} packages with linked topics.\n`);

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const pkg of packages) {
    // Prefer markdown format for topic page rendering
    const { data: mdRender } = await sb
      .from("rendered_outputs")
      .select("content, output_format, quality_score, status")
      .eq("package_id", pkg.id)
      .eq("output_format", "markdown")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const rendered = mdRender;

    if (!rendered) {
      console.log(`  SKIP (no render): ${pkg.slug}`);
      skipped++;
      continue;
    }

    const content = rendered.content as string | null;
    if (!content) {
      console.log(`  SKIP (empty content): ${pkg.slug}`);
      skipped++;
      continue;
    }

    // Update topic_translations.content
    const { error } = await sb
      .from("topic_translations")
      .update({ content })
      .eq("topic_id", pkg.topic_id)
      .eq("language_code", "en");

    if (error) {
      console.log(`  ERROR: ${pkg.slug} — ${error.message}`);
      errors++;
    } else {
      const score = (rendered.quality_score as any)?.overall ?? "?";
      console.log(`  OK: ${pkg.slug} (quality: ${score})`);
      updated++;
    }
  }

  console.log(`\n${"─".repeat(50)}`);
  console.log(`  Updated: ${updated}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Errors:  ${errors}`);
  console.log(`\n=== Done — Topics now have rendered content ===`);
}

main().catch(console.error);
