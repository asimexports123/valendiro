/**
 * Knowledge Package Integrity Audit
 *
 * Audit the three canary topics to investigate why they report 0 facts
 * when the database has 733 topics, 945 knowledge packages, and 3514 facts.
 */

import { createAdminClient } from "../lib/supabase/admin";

const TOPICS_TO_AUDIT = [
  "nodejs-cluster",
  "family-vacations",
  "vendor-management",
];

interface TopicAudit {
  topicId: string;
  topicSlug: string;
  knowledgePackages: Array<{
    packageId: string;
    packageSlug: string;
    createdAt: string;
    updatedAt: string;
    factCount: number;
    citationCount: number;
    relationshipCount: number;
    status: string;
  }>;
  selectedPackage: string | null;
  selectionReason: string;
  hasMultiplePackages: boolean;
  hasPackagesWithFacts: boolean;
}

async function auditTopic(slug: string): Promise<TopicAudit> {
  const supabase = createAdminClient();

  // Get topic
  const { data: topic } = await supabase
    .from("topics")
    .select("id, slug")
    .eq("slug", slug)
    .maybeSingle();

  if (!topic) {
    throw new Error(`Topic not found: ${slug}`);
  }

  // Get all knowledge packages for this topic
  const { data: packages } = await supabase
    .from("knowledge_packages")
    .select("id, slug, created_at, updated_at, status")
    .eq("topic_id", topic.id)
    .order("created_at", { ascending: false });

  const packagesWithCounts = [];

  for (const pkg of packages || []) {
    // Count facts
    const { count: factCount } = await supabase
      .from("knowledge_facts")
      .select("*", { count: "exact", head: true })
      .eq("package_id", pkg.id);

    // Count citations
    const { count: citationCount } = await supabase
      .from("knowledge_citations")
      .select("*", { count: "exact", head: true })
      .eq("package_id", pkg.id);

    // Count relationships
    const { count: relationshipCount } = await supabase
      .from("knowledge_relationships")
      .select("*", { count: "exact", head: true })
      .eq("package_id", pkg.id);

    packagesWithCounts.push({
      packageId: pkg.id,
      packageSlug: pkg.slug,
      createdAt: pkg.created_at,
      updatedAt: pkg.updated_at,
      factCount: factCount || 0,
      citationCount: citationCount || 0,
      relationshipCount: relationshipCount || 0,
      status: pkg.status,
    });
  }

  // Determine which package the renderer would select
  // The renderer typically selects the most recent published package
  const publishedPackages = packagesWithCounts.filter(p => p.status === "published");
  const selectedPackage = publishedPackages.length > 0 ? publishedPackages[0].packageId : null;
  const selectionReason = publishedPackages.length > 0
    ? "Most recent published package"
    : "No published packages found";

  return {
    topicId: topic.id,
    topicSlug: topic.slug,
    knowledgePackages: packagesWithCounts,
    selectedPackage,
    selectionReason,
    hasMultiplePackages: packagesWithCounts.length > 1,
    hasPackagesWithFacts: packagesWithCounts.some(p => p.factCount > 0),
  };
}

async function main() {
  console.log("Knowledge Package Integrity Audit");
  console.log("====================================\n");

  const audits: TopicAudit[] = [];

  for (const slug of TOPICS_TO_AUDIT) {
    console.log(`\n========================================`);
    console.log(`Auditing: ${slug}`);
    console.log(`========================================`);

    try {
      const audit = await auditTopic(slug);
      audits.push(audit);

      console.log(`\nTopic ID: ${audit.topicId}`);
      console.log(`Topic Slug: ${audit.topicSlug}`);
      console.log(`\nKnowledge Packages (${audit.knowledgePackages.length}):`);

      for (const pkg of audit.knowledgePackages) {
        console.log(`\n  Package ID: ${pkg.packageId}`);
        console.log(`  Package Slug: ${pkg.packageSlug}`);
        console.log(`  Status: ${pkg.status}`);
        console.log(`  Created: ${pkg.createdAt}`);
        console.log(`  Updated: ${pkg.updatedAt}`);
        console.log(`  Facts: ${pkg.factCount}`);
        console.log(`  Citations: ${pkg.citationCount}`);
        console.log(`  Relationships: ${pkg.relationshipCount}`);
      }

      console.log(`\n--- Renderer Selection ---`);
      console.log(`Selected Package ID: ${audit.selectedPackage}`);
      console.log(`Selection Reason: ${audit.selectionReason}`);
      console.log(`Has Multiple Packages: ${audit.hasMultiplePackages}`);
      console.log(`Has Packages with Facts: ${audit.hasPackagesWithFacts}`);

      if (audit.selectedPackage) {
        const selectedPkg = audit.knowledgePackages.find(p => p.packageId === audit.selectedPackage);
        console.log(`Selected Package Fact Count: ${selectedPkg?.factCount || 0}`);
      }

    } catch (error) {
      console.error(`Error auditing ${slug}:`, error);
    }
  }

  console.log(`\n\n========================================`);
  console.log(`SUMMARY`);
  console.log(`========================================`);

  for (const audit of audits) {
    console.log(`\n--- ${audit.topicSlug} ---`);
    console.log(`Topic ID: ${audit.topicId}`);
    console.log(`Packages: ${audit.knowledgePackages.length}`);
    console.log(`Has Multiple Packages: ${audit.hasMultiplePackages}`);
    console.log(`Has Packages with Facts: ${audit.hasPackagesWithFacts}`);
    console.log(`Selected Package: ${audit.selectedPackage}`);

    if (audit.selectedPackage) {
      const selectedPkg = audit.knowledgePackages.find(p => p.packageId === audit.selectedPackage);
      console.log(`Selected Package Facts: ${selectedPkg?.factCount || 0}`);
      console.log(`Selected Package Status: ${selectedPkg?.status}`);
    }
  }

  // Save audit results
  const fs = require("fs");
  fs.writeFileSync(
    "./canary-topics-audit.json",
    JSON.stringify(audits, null, 2)
  );
  console.log(`\n\nAudit results saved to: canary-topics-audit.json`);
}

main().catch(console.error);
