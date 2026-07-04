import "dotenv/config";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://valendiro.com";
const SECRET = process.env.RENDER_SECRET || process.env.PIPELINE_TEST_SECRET || "local-test";

async function triggerFlagEditorial() {
  console.log("Marking legacy articles as Needs Editorial Rewrite...\n");

  try {
    const response = await fetch(`${BASE_URL}/api/admin/legacy-flag-editorial`, {
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

    console.log("=== EDITORIAL FLAGGING RESULTS ===\n");
    console.log(`Total articles: ${data.total_articles}`);
    console.log(`Successfully updated: ${data.updated_count}`);
    console.log(`Failed: ${data.failed_count}\n`);

    console.log("=== DETAILS ===\n");
    data.updated.forEach((c: any) => {
      console.log(`${c.article_slug}:`);
      console.log(`  Status: ${c.status}`);
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

triggerFlagEditorial();
