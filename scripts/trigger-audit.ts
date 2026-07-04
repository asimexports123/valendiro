import "dotenv/config";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://valendiro.com";
const SECRET = process.env.RENDER_SECRET || process.env.PIPELINE_TEST_SECRET || "local-test";

async function triggerAudit() {
  console.log("Triggering legacy content audit...\n");

  try {
    const response = await fetch(`${BASE_URL}/api/admin/legacy-audit`, {
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

    console.log("=== AUDIT RESULTS ===\n");
    console.log(`Total articles: ${data.total_articles}`);
    console.log(`Orphan articles (no topic_id): ${data.orphan_articles}`);
    console.log(`Articles without knowledge package: ${data.articles_without_package}`);
    console.log(`Articles without rendered output: ${data.articles_without_rendered_output}\n`);

    console.log("=== ARTICLE DETAILS ===\n");
    data.articles.forEach((a: any) => {
      console.log(`${a.slug}:`);
      console.log(`  Article ID: ${a.article_id}`);
      console.log(`  Topic ID: ${a.topic_id || 'NULL (ORPHAN)'}`);
      console.log(`  Knowledge Package ID: ${a.knowledge_package_id || 'NULL'}`);
      console.log(`  Rendered Output ID: ${a.rendered_output_id || 'NULL'}`);
      console.log(`  Renderer Version: ${a.renderer_version || 'NULL'}`);
      console.log(`  Facts Count: ${a.facts_count}`);
      console.log(`  Published At: ${a.published_at}`);
      console.log();
    });
  } catch (error: any) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

triggerAudit();
