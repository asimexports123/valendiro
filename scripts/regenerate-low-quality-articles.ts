/**
 * Regenerates low-quality articles using the existing pipeline
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

interface LowQualityTopic {
  id: string;
  slug: string;
  content_length: number;
}

function isLowQuality(content: string | null): boolean {
  if (!content) return true;
  if (content.length < 500) return true;
  if (content.includes('## Key Properties') && content.length < 200) return true;
  if (content.includes('headers:{type:')) return true;
  const contentWithoutComments = content.replace(/<!--[\s\S]*?-->/g, '').trim();
  if (contentWithoutComments.length < 200) return true;
  return false;
}

async function getLowQualityTopics(): Promise<LowQualityTopic[]> {
  const { data: topics } = await sb
    .from("topics")
    .select("id, slug")
    .eq("status", "published");

  if (!topics) return [];

  const topicIds = topics.map(t => t.id);
  const { data: translations } = await sb
    .from("topic_translations")
    .select("topic_id, content")
    .eq("language_code", "en")
    .in("topic_id", topicIds);

  const contentMap = new Map(translations?.map(t => [t.topic_id, t.content]) || []);

  return topics
    .map(topic => ({
      id: topic.id,
      slug: topic.slug,
      content_length: contentMap.get(topic.id)?.length || 0
    }))
    .filter(topic => isLowQuality(contentMap.get(topic.id) || null));
}

async function regenerateTopic(topicSlug: string, topicId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    // Get knowledge package for this topic
    const { data: pkg } = await sb
      .from("knowledge_packages")
      .select("id, slug")
      .eq("topic_id", topicId)
      .maybeSingle();

    if (!pkg) {
      return { success: false, error: "No knowledge package found" };
    }

    // Render the package
    const renderResult = await render({
      packageId: pkg.id,
      format: "markdown",
      rendererId: "knowledge-authoring-v1",
      forceRerender: true
    });

    if (renderResult.status === "failed") {
      return { success: false, error: "Render failed" };
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
  console.log("=== Regenerating Low-Quality Articles ===\n");

  const lowQualityTopics = await getLowQualityTopics();
  console.log(`Found ${lowQualityTopics.length} low-quality topics to regenerate\n`);

  let replaced = 0;
  let failed = 0;
  const failedTopics: string[] = [];

  for (const topic of lowQualityTopics) {
    console.log(`Processing: ${topic.slug} (${topic.content_length} chars)`);
    
    const result = await regenerateTopic(topic.slug, topic.id);
    
    if (result.success) {
      console.log(`  ✓ Successfully regenerated`);
      replaced++;
    } else {
      console.log(`  ✗ Failed: ${result.error}`);
      failed++;
      failedTopics.push(topic.slug);
    }
  }

  console.log(`\n${"─".repeat(50)}`);
  console.log(`  Total processed: ${lowQualityTopics.length}`);
  console.log(`  Articles replaced: ${replaced}`);
  console.log(`  Failed regenerations: ${failed}`);
  console.log(`  Articles remaining: ${lowQualityTopics.length - replaced}`);

  if (failedTopics.length > 0) {
    console.log(`\nFailed topics: ${failedTopics.join(', ')}`);
  }

  console.log(`\n=== Regeneration Complete ===`);
}

main().catch(console.error);
