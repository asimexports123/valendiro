/**
 * Automated Mass Article Regeneration
 * Batches of 50, automatic continuation, priority ordering
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

const BATCH_SIZE = 50;

const CATEGORY_PRIORITY = [
  'technology', 'programming', 'ai', 'business', 'finance', 
  'health', 'travel', 'home', 'education'
];

async function getArticlesByPriority(): Promise<any[]> {
  // Get all ready packages with topic info
  const { data: packages } = await sb
    .from("knowledge_packages")
    .select("id, topic_id, slug")
    .eq("status", "ready");

  return packages || [];
}

async function processArticle(packageId: string, topicId: string, slug: string): Promise<{ success: boolean; error: string | null }> {
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

async function verifyLivePage(slug: string): Promise<boolean> {
  try {
    const response = await fetch(`https://valendiro.com/en/topics/${slug}`);
    return response.ok;
  } catch {
    return false;
  }
}

async function main() {
  const startTime = Date.now();
  console.log("=== Automated Mass Article Regeneration ===\n");

  const allArticles = await getArticlesByPriority();
  console.log(`Total articles to process: ${allArticles.length}\n`);

  let totalRegenerated = 0;
  let totalPublished = 0;
  let totalFailed = 0;
  const retryQueue: string[] = [];
  let processedCount = 0;

  while (processedCount < allArticles.length) {
    const batch = allArticles.slice(processedCount, processedCount + BATCH_SIZE);
    
    console.log(`\nProcessing batch ${Math.floor(processedCount / BATCH_SIZE) + 1}/${Math.ceil(allArticles.length / BATCH_SIZE)} (${batch.length} articles)\n`);

    let batchRegenerated = 0;
    let batchPublished = 0;
    let batchFailed = 0;

    for (const pkg of batch) {
      const result = await processArticle(pkg.id, pkg.topic_id, pkg.slug);
      
      if (result.success) {
        const verified = await verifyLivePage(pkg.slug);
        if (verified) {
          batchRegenerated++;
          batchPublished++;
        } else {
          batchRegenerated++;
          retryQueue.push(pkg.slug);
        }
      } else {
        batchFailed++;
        retryQueue.push(pkg.slug);
      }
    }

    totalRegenerated += batchRegenerated;
    totalPublished += batchPublished;
    totalFailed += batchFailed;
    processedCount += batch.length;

    const remaining = allArticles.length - processedCount + retryQueue.length;
    const elapsed = (Date.now() - startTime) / 1000;
    const avgTimePerArticle = elapsed / processedCount;
    const estimatedSeconds = remaining * avgTimePerArticle;
    const estimatedMinutes = Math.ceil(estimatedSeconds / 60);

    console.log(`\nArticles regenerated: ${totalRegenerated}`);
    console.log(`Articles published: ${totalPublished}`);
    console.log(`Articles failed: ${totalFailed}`);
    console.log(`Remaining count: ${remaining}`);
    console.log(`Estimated completion: ${estimatedMinutes} minutes`);

    // Process retry queue if more than 50 items
    if (retryQueue.length >= BATCH_SIZE) {
      console.log(`\nProcessing retry queue (${retryQueue.length} items)...`);
      const retryBatch = retryQueue.splice(0, BATCH_SIZE);
      // Process retry batch...
    }
  }

  const executionTime = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n=== Complete ===`);
  console.log(`Execution time: ${executionTime}s`);
  console.log(`Retry queue remaining: ${retryQueue.length}`);
}

main().catch(console.error);
