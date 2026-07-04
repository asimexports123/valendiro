import "dotenv/config";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://valendiro.com";
const SECRET = process.env.RENDER_SECRET || process.env.PIPELINE_TEST_SECRET || "local-test";

async function triggerInspectFactsDetail() {
  console.log("Inspecting detailed structure of production knowledge facts...\n");

  try {
    const response = await fetch(`${BASE_URL}/api/admin/inspect-facts-detail`, {
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

    console.log("=== PRODUCTION KNOWLEDGE PACKAGE STRUCTURE ===\n");
    console.log(`Package ID: ${data.package.id}`);
    console.log(`Package Slug: ${data.package.slug}\n`);

    console.log("=== KNOWLEDGE FACTS ===\n");
    data.facts.forEach((f: any, i: number) => {
      console.log(`Fact ${i + 1}:`);
      console.log(`  ID: ${f.id}`);
      console.log(`  Statement: ${f.statement}`);
      console.log(`  Fact Type: ${f.fact_type}`);
      console.log(`  Confidence: ${f.confidence}`);
      console.log(`  Scope: ${f.scope}`);
      console.log(`  Tags: ${JSON.stringify(f.tags)}`);
      console.log(`  Domain: ${f.domain}`);
      console.log(`  Created At: ${f.created_at}`);
      console.log();
    });

    console.log("=== CITATIONS ===\n");
    if (data.citations && data.citations.length > 0) {
      data.citations.forEach((c: any, i: number) => {
        console.log(`Citation ${i + 1}:`);
        console.log(`  ID: ${c.id}`);
        console.log(`  Source Name: ${c.source_name}`);
        console.log(`  Source URL: ${c.source_url}`);
        console.log();
      });
    } else {
      console.log("No citations found for this package\n");
    }

    console.log("=== DISTINCT CITATION VALUES ===\n");
    console.log(`Source Authority: ${data.distinct_source_authority.join(", ")}`);
    console.log(`Extraction Method: ${data.distinct_extraction_method.join(", ")}\n`);
  } catch (error: any) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

triggerInspectFactsDetail();
