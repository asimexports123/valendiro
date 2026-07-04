import "dotenv/config";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://valendiro.com";
const SECRET = process.env.RENDER_SECRET || process.env.PIPELINE_TEST_SECRET || "local-test";

async function triggerVerifyIntegrity() {
  console.log("Verifying production integrity after legacy removal...\n");

  try {
    const response = await fetch(`${BASE_URL}/api/admin/verify-integrity`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        secret: SECRET,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Failed:", data.error);
      process.exit(1);
    }

    console.log("=== PRODUCTION INTEGRITY VERIFICATION ===\n");

    console.log("Environment:");
    console.log(`  Supabase URL: ${data.results.environment.supabase_url}\n`);

    console.log("SQL Counts (Exact):");
    console.log(`  topics: ${data.results.sql_counts.topics}`);
    console.log(`  knowledge_packages: ${data.results.sql_counts.knowledge_packages}`);
    console.log(`  knowledge_facts: ${data.results.sql_counts.knowledge_facts}`);
    console.log(`  rendered_outputs: ${data.results.sql_counts.rendered_outputs}`);
    console.log(`  topic_translations: ${data.results.sql_counts.topic_translations}\n`);

    console.log("Summary:");
    console.log(`  Legacy articles removed: ${data.results.summary.legacy_articles_removed}`);
    console.log(`  Orphan records found: ${data.results.summary.orphan_records_found}`);
    console.log(`  Canonical compliance: ${data.results.summary.canonical_compliance}`);
    console.log(`  Non-canonical articles: ${data.results.summary.non_canonical_count}`);
    console.log(`  Overall status: ${data.results.passed ? "PASSED" : "FAILED"}\n`);

    if (data.results.legacy_references.length > 0) {
      console.log("Legacy References Found:");
      data.results.legacy_references.forEach((ref: any) => {
        console.log(`  ${ref.type}: ${ref.count}`);
        if (ref.slugs) console.log(`    Slugs: ${ref.slugs.join(", ")}`);
      });
      console.log();
    }

    if (data.results.orphan_records.length > 0) {
      console.log("Orphan Records Found:");
      data.results.orphan_records.forEach((orphan: any) => {
        console.log(`  ${orphan.type}: ${orphan.count}`);
        if (orphan.details) console.log(`    Details: ${orphan.details.join(", ")}`);
      });
      console.log();
    }

    if (data.results.non_canonical_articles && data.results.non_canonical_articles.length > 0) {
      console.log("Non-Canonical Articles:");
      data.results.non_canonical_articles.forEach((article: any) => {
        console.log(`  ${article.slug}: ${article.reason}`);
      });
      console.log();
    }

    if (data.results.passed) {
      console.log("=== INTEGRITY VERIFICATION PASSED ===\n");
    } else {
      console.log("=== INTEGRITY VERIFICATION FAILED ===\n");
      process.exit(1);
    }
  } catch (error: any) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

triggerVerifyIntegrity();
