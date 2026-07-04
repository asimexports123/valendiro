import "dotenv/config";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://valendiro.com";
const SECRET = process.env.RENDER_SECRET || process.env.PIPELINE_TEST_SECRET || "local-test";

async function triggerInspectArticleStatus() {
  console.log("Inspecting valid article status values...\n");

  try {
    const response = await fetch(`${BASE_URL}/api/admin/inspect-article-status`, {
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

    console.log("=== ARTICLE STATUS VALUES ===\n");
    console.log(`Distinct status values: ${data.distinct_status.join(", ")}\n`);
  } catch (error: any) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

triggerInspectArticleStatus();
