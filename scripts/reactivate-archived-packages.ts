/**
 * Reactivates archived knowledge packages for low-quality topics
 */

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://diwwvkbztvhwouttajha.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY";

import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  "https://diwwvkbztvhwouttajha.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY"
);

function isLowQuality(content: string | null): boolean {
  if (!content) return true;
  if (content.length < 500) return true;
  if (content.includes('## Key Properties') && content.length < 200) return true;
  if (content.includes('headers:{type:')) return true;
  const contentWithoutComments = content.replace(/<!--[\s\S]*?-->/g, '').trim();
  if (contentWithoutComments.length < 200) return true;
  return false;
}

async function main() {
  console.log("=== Reactivating Archived Packages for Low-Quality Topics ===\n");

  // Get all published topics
  const { data: topics } = await sb
    .from("topics")
    .select("id, slug")
    .eq("status", "published");

  if (!topics) {
    console.log("No topics found");
    return;
  }

  const topicIds = topics.map(t => t.id);
  
  // Get topic translations to check quality
  const { data: translations } = await sb
    .from("topic_translations")
    .select("topic_id, content")
    .eq("language_code", "en")
    .in("topic_id", topicIds);

  const contentMap = new Map(translations?.map(t => [t.topic_id, t.content]) || []);

  // Get low-quality topic IDs
  const lowQualityTopicIds = topics
    .filter(t => isLowQuality(contentMap.get(t.id) || null))
    .map(t => t.id);

  console.log(`Found ${lowQualityTopicIds.length} low-quality topics\n`);

  // Get archived packages for these topics
  const { data: archivedPackages } = await sb
    .from("knowledge_packages")
    .select("id, slug, topic_id")
    .eq("status", "archived")
    .in("topic_id", lowQualityTopicIds);

  if (!archivedPackages || archivedPackages.length === 0) {
    console.log("No archived packages found for low-quality topics");
    return;
  }

  console.log(`Found ${archivedPackages.length} archived packages to reactivate\n`);

  let reactivated = 0;
  let failed = 0;

  for (const pkg of archivedPackages) {
    console.log(`Reactivating: ${pkg.slug}`);
    
    const { error } = await sb
      .from("knowledge_packages")
      .update({ status: "ready" })
      .eq("id", pkg.id);

    if (error) {
      console.log(`  ✗ Failed: ${error.message}`);
      failed++;
    } else {
      console.log(`  ✓ Reactivated`);
      reactivated++;
    }
  }

  console.log(`\n${"─".repeat(50)}`);
  console.log(`  Total processed: ${archivedPackages.length}`);
  console.log(`  Reactivated: ${reactivated}`);
  console.log(`  Failed: ${failed}`);
  console.log(`\n=== Package Reactivation Complete ===`);
}

main().catch(console.error);
