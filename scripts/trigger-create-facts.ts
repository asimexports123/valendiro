import "dotenv/config";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://valendiro.com";
const SECRET = process.env.RENDER_SECRET || process.env.PIPELINE_TEST_SECRET || "local-test";

async function triggerCreateFacts() {
  console.log("Creating knowledge facts from article content...\n");

  try {
    const response = await fetch(`${BASE_URL}/api/admin/legacy-create-facts`, {
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

    console.log("=== FACT CREATION RESULTS ===\n");
    console.log(`Total articles: ${data.total_articles}`);
    console.log(`Successfully created: ${data.created_count}`);
    console.log(`Failed: ${data.failed_count}\n`);

    console.log("=== DETAILS ===\n");
    data.created.forEach((c: any) => {
      console.log(`${c.article_slug}:`);
      console.log(`  Status: ${c.status}`);
      if (c.fact_id) {
        console.log(`  Fact ID: ${c.fact_id}`);
      }
      if (c.error) {
        console.log(`  Error: ${c.error}`);
      }
      console.log();
    });
  } catch (error: any) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

triggerCreateFacts();
