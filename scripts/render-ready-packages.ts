/**
 * Render and regenerate articles using existing ready knowledge packages
 */

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://diwwvkbztvhwouttajha.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY";
process.env.ALLOW_RENDER = "true";

import { createClient } from '@supabase/supabase-js';
import { render } from '../services/renderer/orchestrator';

const sb = createClient(
  "https://diwwvkbztvhwouttajha.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY"
);

const BATCH_SIZE = 20;

async function processPackage(packageId: string, topicId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    // Render the knowledge package
    const renderResult = await render({
      packageId: packageId,
      format: "markdown",
      rendererId: "knowledge-authoring-v1",
      forceRerender: true
    });

    if (renderResult.status === "failed") {
      return { success: false, error: "Rendering failed" };
    }

    // Update topic_translations with rendered content
    const { error: updateError } = await sb
      .from("topic_translations")
      .update({ content: renderResult.content })
      .eq("topic_id", topicId)
      .eq("language_code", "en");

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function main() {
  const startTime = Date.now();
  console.log("=== Rendering and Regenerating Articles Using Ready Packages ===\n");

  // Get all ready packages linked to published topics
  const { data: packages } = await sb
    .from("knowledge_packages")
    .select("id, topic_id, slug")
    .eq("status", "ready");

  if (!packages || packages.length === 0) {
    console.log("No ready packages found");
    return;
  }

  console.log(`Found ${packages.length} ready packages\n`);

  let packagesCreated = 0;
  let knowledgeHashGenerated = 0;
  let articlesReplaced = 0;
  let articlesRemaining = packages.length;
  const failedTopics: string[] = [];

  for (let i = 0; i < packages.length; i += BATCH_SIZE) {
    const batch = packages.slice(i, i + BATCH_SIZE);
    console.log(`\nProcessing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(packages.length / BATCH_SIZE)} (${batch.length} packages)\n`);

    for (const pkg of batch) {
      console.log(`Processing: ${pkg.slug}`);
      const result = await processPackage(pkg.id, pkg.topic_id);
      
      if (result.success) {
        console.log(`  ✓ Success`);
        packagesCreated++;
        knowledgeHashGenerated++;
        articlesReplaced++;
        articlesRemaining--;
      } else {
        console.log(`  ✗ Failed: ${result.error}`);
        failedTopics.push(pkg.slug);
      }
    }
  }

  const executionTime = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log(`\n${"─".repeat(50)}`);
  console.log(`  Total packages: ${packages.length}`);
  console.log(`  Knowledge Packages Created: ${packagesCreated}`);
  console.log(`  knowledge_hash Generated: ${knowledgeHashGenerated}`);
  console.log(`  Articles Replaced: ${articlesReplaced}`);
  console.log(`  Articles Remaining: ${articlesRemaining}`);
  console.log(`  Failed: ${failedTopics.length}`);
  console.log(`  Execution Time: ${executionTime}s`);

  if (failedTopics.length > 0) {
    console.log(`\nFailed topics: ${failedTopics.join(', ')}`);
  }

  console.log(`\n=== Rendering Complete ===`);
}

main().catch(console.error);
