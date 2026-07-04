import "dotenv/config";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://valendiro.com";
const SECRET = process.env.RENDER_SECRET || process.env.PIPELINE_TEST_SECRET || "local-test";

async function triggerRemoveLegacy() {
  console.log("Removing legacy articles and all associated components...\n");

  try {
    const response = await fetch(`${BASE_URL}/api/admin/remove-legacy`, {
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

    console.log("=== LEGACY REMOVAL RESULTS ===\n");
    console.log(`Articles removed: ${data.articles_removed}`);
    console.log(`Article slugs: ${data.article_slugs.join(", ")}\n`);

    console.log("=== COMPONENT DELETION STATUS ===\n");
    console.log(`Deleted translations: ${data.results.deleted_translations}`);
    console.log(`Deleted rendered outputs: ${data.results.deleted_rendered_outputs}`);
    console.log(`Deleted relationships: ${data.results.deleted_relationships}`);
    console.log(`Deleted facts: ${data.results.deleted_facts}`);
    console.log(`Deleted citations: ${data.results.deleted_citations}`);
    console.log(`Deleted packages: ${data.results.deleted_packages}`);
    console.log(`Deleted topics: ${data.results.deleted_topics}`);
    console.log(`Deleted articles: ${data.results.deleted_articles}\n`);
  } catch (error: any) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

triggerRemoveLegacy();
