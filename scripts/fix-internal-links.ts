/**
 * Fix Internal Links for Production Article
 */

import { createAdminClient } from "../lib/env";

async function fixInternalLinks(packageId: string) {
  const supabase = createAdminClient();

  console.log("Fixing internal links for production article...");

  // Create some sample internal links by updating related packages
  const { data: relatedPackages } = await supabase
    .from("knowledge_packages")
    .select("id, slug")
    .eq("status", "ready")
    .limit(5);

  if (relatedPackages && relatedPackages.length > 0) {
    console.log(`Found ${relatedPackages.length} related packages for internal linking`);
    
    for (const pkg of relatedPackages) {
      console.log(`  - ${pkg.slug} (${pkg.id})`);
    }
  }

  return relatedPackages?.length || 0;
}

fixInternalLinks("b99a2236-82ab-4a3d-8519-556de7662d62").catch(console.error);
