/**
 * Re-renders all knowledge packages in markdown format
 * and publishes the content to topic_translations.
 */

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://diwwvkbztvhwouttajha.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY";
process.env.ALLOW_RENDER = "true";

import { createClient } from "@supabase/supabase-js";
import { render } from "../services/renderer/orchestrator";

const sb = createClient(
  "https://diwwvkbztvhwouttajha.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY"
);

async function main() {
  console.log("=== Re-render as Markdown + Publish to Topics ===\n");

  const { data: packages } = await sb
    .from("knowledge_packages")
    .select("id, slug, topic_id")
    .not("topic_id", "is", null);

  if (!packages?.length) { console.log("No packages."); return; }

  let ok = 0; let errors = 0;

  for (const pkg of packages) {
    process.stdout.write(`  [${ok + errors + 1}/${packages.length}] ${pkg.slug} ... `);
    try {
      const result = await render({
        packageId: pkg.id,
        format: "markdown",
        forceRerender: true,
      });

      const content = result.content;
      if (!content) { console.log("SKIP (empty)"); continue; }

      // Write markdown into topic_translations.content
      const { error } = await sb
        .from("topic_translations")
        .update({ content })
        .eq("topic_id", pkg.topic_id)
        .eq("language_code", "en");

      if (error) {
        console.log(`ERROR: ${error.message}`);
        errors++;
      } else {
        console.log(`OK (score: ${result.qualityScore.overall})`);
        ok++;
      }
    } catch (err: any) {
      console.log(`ERROR: ${err?.message?.slice(0, 60)}`);
      errors++;
    }
    await new Promise((r) => setTimeout(r, 100));
  }

  console.log(`\n${"─".repeat(50)}`);
  console.log(`  Published: ${ok}  Errors: ${errors}`);
  console.log(`\n=== Done ===`);
}

main().catch(console.error);
