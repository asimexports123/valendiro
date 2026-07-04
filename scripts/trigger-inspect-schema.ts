import "dotenv/config";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://valendiro.com";
const SECRET = process.env.RENDER_SECRET || process.env.PIPELINE_TEST_SECRET || "local-test";

async function triggerInspectSchema() {
  console.log("Inspecting production knowledge_facts schema and data...\n");

  try {
    const response = await fetch(`${BASE_URL}/api/admin/inspect-schema`, {
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

    console.log("=== PRODUCTION SCHEMA INSPECTION ===\n");
    console.log(`Total knowledge facts in production: ${data.total_facts}\n`);
    console.log(`Distinct fact_types: ${data.distinct_fact_types.join(", ")}\n`);
    console.log(`Distinct confidence values: ${data.distinct_confidence_values.join(", ")}\n`);
    console.log(`Distinct scopes: ${data.distinct_scopes.join(", ")}\n`);

    console.log("=== SAMPLE FACTS ===\n");
    data.sample_facts.forEach((f: any, i: number) => {
      console.log(`Sample ${i + 1}:`);
      console.log(`  Statement: ${f.statement}`);
      console.log(`  Fact Type: ${f.fact_type}`);
      console.log(`  Confidence: ${f.confidence}`);
      console.log(`  Scope: ${f.scope}`);
      console.log(`  Tags: ${JSON.stringify(f.tags)}`);
      console.log();
    });
  } catch (error: any) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

triggerInspectSchema();
