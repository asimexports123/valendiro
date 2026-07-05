/**
 * Creates knowledge packages for low-quality topics
 */

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://diwwvkbztvhwouttajha.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY";

import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  "https://diwwvkbztvhwouttajha.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpd3d2a2J6dHZod291dHRhamhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjY3NzIwMywiZXhwIjoyMDk4MjUzMjAzfQ.H-H9Ozpnn0M4d65ybDHOMVBQiK-CQFC9OPQPXq2b6yY"
);

async function main() {
  console.log("=== Creating Knowledge Packages for Low-Quality Topics ===\n");

  // Get topics without knowledge packages
  const { data: topics } = await sb
    .from("topics")
    .select("id, slug")
    .eq("status", "published");

  if (!topics) {
    console.log("No topics found");
    return;
  }

  const topicIds = topics.map(t => t.id);
  
  // Get existing packages
  const { data: existingPackages } = await sb
    .from("knowledge_packages")
    .select("topic_id")
    .in("topic_id", topicIds);

  const packagedTopicIds = new Set(existingPackages?.map(p => p.topic_id) || []);
  const topicsWithoutPackages = topics.filter(t => !packagedTopicIds.has(t.id));

  console.log(`Found ${topicsWithoutPackages.length} topics without knowledge packages\n`);

  let created = 0;
  let failed = 0;

  for (const topic of topicsWithoutPackages) {
    console.log(`Creating package for: ${topic.slug}`);
    
    try {
      // Create knowledge package with draft status
      const { data: pkg, error: pkgError } = await sb
        .from("knowledge_packages")
        .insert({
          slug: topic.slug,
          topic_id: topic.id,
          status: "draft"
        })
        .select()
        .single();

      if (pkgError) {
        console.log(`  ✗ Failed: ${pkgError.message}`);
        failed++;
      } else {
        console.log(`  ✓ Created: ${pkg.id}`);
        created++;
      }
    } catch (error: any) {
      console.log(`  ✗ Failed: ${error.message}`);
      failed++;
    }
  }

  console.log(`\n${"─".repeat(50)}`);
  console.log(`  Total processed: ${topicsWithoutPackages.length}`);
  console.log(`  Packages created: ${created}`);
  console.log(`  Failed: ${failed}`);
  console.log(`\n=== Package Creation Complete ===`);
}

main().catch(console.error);
