import "dotenv/config";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://valendiro.com";
const SECRET = process.env.RENDER_SECRET || process.env.PIPELINE_TEST_SECRET || "local-test";

async function checkTopics() {
  console.log("Checking for topics with knowledge packages...");

  try {
    const response = await fetch(`${BASE_URL}/api/admin/pipeline/run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        stage: "topics",
        limit: 5,
        secret: SECRET,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Failed:", data.error);
      process.exit(1);
    }

    console.log("Topics pipeline result:", data);
  } catch (error: any) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

checkTopics();
