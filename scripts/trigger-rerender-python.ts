import "dotenv/config";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://valendiro.com";
const SECRET = process.env.RENDER_SECRET || process.env.PIPELINE_TEST_SECRET || "local-test";

async function rerenderNutritionFundamentals() {
  console.log("Re-rendering Nutrition Fundamentals...\n");

  try {
    const response = await fetch(`${BASE_URL}/api/admin/renderer-rerender`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        secret: SECRET,
        topic_slug: "nutrition-fundamentals",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Failed:", data.error);
      if (data.diagnostics) {
        console.error("Diagnostics:", JSON.stringify(data.diagnostics, null, 2));
      }
      process.exit(1);
    }

    console.log("=== RE-RENDER COMPLETE ===\n");
    console.log(`Success: ${data.success}`);
    console.log(`Message: ${data.message}`);
    if (data.rendered_url) {
      console.log(`Rendered URL: ${data.rendered_url}`);
    }
  } catch (error: any) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

rerenderNutritionFundamentals();
