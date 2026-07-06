/**
 * Recover Orphaned Knowledge Packages
 *
 * Safety guard: If a package has status=READY AND facts=0 AND queue entry=missing,
 * automatically enqueue a recovery job for knowledge acquisition.
 */

import { createAdminClient } from "../lib/supabase/admin";

interface OrphanedPackage {
  packageId: string;
  slug: string;
  topicId: string;
  status: string;
  factCount: number;
  hasQueueEntry: boolean;
}

async function findOrphanedPackages(): Promise<OrphanedPackage[]> {
  const supabase = createAdminClient();

  // Get all packages with status=ready
  const { data: packages } = await supabase
    .from("knowledge_packages")
    .select("id, slug, topic_id, status")
    .eq("status", "ready");

  if (!packages || packages.length === 0) {
    return [];
  }

  const orphaned: OrphanedPackage[] = [];

  for (const pkg of packages) {
    // Count facts
    const { count: factCount } = await supabase
      .from("knowledge_facts")
      .select("*", { count: "exact", head: true })
      .eq("package_id", pkg.id);

    // Check for queue entries
    const { data: queueEntries } = await supabase
      .from("update_queue")
      .select("id")
      .eq("object_id", pkg.topic_id)
      .eq("object_type", "topic");

    const hasQueueEntry = queueEntries && queueEntries.length > 0;

    if ((factCount || 0) === 0 && !hasQueueEntry && pkg.topic_id) {
      orphaned.push({
        packageId: pkg.id,
        slug: pkg.slug,
        topicId: pkg.topic_id,
        status: pkg.status,
        factCount: factCount || 0,
        hasQueueEntry: hasQueueEntry || false,
      });
    }
  }

  return orphaned;
}

async function recoverOrphanedPackages(): Promise<void> {
  console.log("Recovering Orphaned Knowledge Packages");
  console.log("========================================\n");

  const orphaned = await findOrphanedPackages();
  const supabase = createAdminClient();

  console.log(`Found ${orphaned.length} orphaned packages:\n`);

  for (const pkg of orphaned) {
    console.log(`Package: ${pkg.slug}`);
    console.log(`  ID: ${pkg.packageId}`);
    console.log(`  Topic ID: ${pkg.topicId}`);
    console.log(`  Status: ${pkg.status}`);
    console.log(`  Facts: ${pkg.factCount}`);
    console.log(`  Queue Entry: ${pkg.hasQueueEntry ? "YES" : "NO"}`);

    try {
      // Insert directly into update_queue using admin client
      // Use "content_refresh" as it's a valid job type in the database constraint
      const { error } = await supabase
        .from("update_queue")
        .insert({
          object_id: pkg.topicId,
          object_type: "topic",
          job_type: "content_refresh",
          priority: 10,
          scheduled_at: new Date().toISOString(),
          status: "pending",
        });

      if (error) {
        console.log(`  ❌ Failed to enqueue recovery job: ${error.message}`);
      } else {
        console.log(`  ✅ Recovery job enqueued`);
      }
    } catch (error: any) {
      console.log(`  ❌ Failed to enqueue recovery job: ${error.message}`);
    }

    console.log();
  }

  console.log(`\nRecovery complete. ${orphaned.length} packages processed.`);
}

recoverOrphanedPackages().catch(console.error);
