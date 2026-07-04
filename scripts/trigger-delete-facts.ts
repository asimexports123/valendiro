import "dotenv/config";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://valendiro.com";
const SECRET = process.env.RENDER_SECRET || process.env.PIPELINE_TEST_SECRET || "local-test";

async function triggerDeleteFacts() {
  console.log("Deleting legacy migration facts...\n");

  try {
    const response = await fetch(`${BASE_URL}/api/admin/legacy-delete-facts`, {
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

    console.log("=== DELETE RESULTS ===\n");
    console.log(`Deleted ${data.deleted} legacy facts\n`);
  } catch (error: any) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

triggerDeleteFacts();
