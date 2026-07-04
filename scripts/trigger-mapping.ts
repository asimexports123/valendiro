import "dotenv/config";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://valendiro.com";
const SECRET = process.env.RENDER_SECRET || process.env.PIPELINE_TEST_SECRET || "local-test";

async function triggerMapping() {
  console.log("Triggering topic mapping for orphan articles...\n");

  try {
    const response = await fetch(`${BASE_URL}/api/admin/legacy-map`, {
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

    console.log("=== MAPPING RESULTS ===\n");
    console.log(`Total orphan articles: ${data.total_orphan_articles}`);
    console.log(`Successfully linked: ${data.linked}`);
    console.log(`No matching topic: ${data.no_matching_topic}`);
    console.log(`Failed: ${data.failed}\n`);

    console.log("=== MAPPING DETAILS ===\n");
    data.mappings.forEach((m: any) => {
      console.log(`${m.article_slug}:`);
      console.log(`  Status: ${m.status}`);
      if (m.topic_slug) {
        console.log(`  Linked to topic: ${m.topic_slug} (${m.topic_id})`);
      }
      if (m.error) {
        console.log(`  Error: ${m.error}`);
      }
      console.log();
    });
  } catch (error: any) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

triggerMapping();
