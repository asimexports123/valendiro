import "dotenv/config";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://valendiro.com";
const SECRET = process.env.RENDER_SECRET || process.env.PIPELINE_TEST_SECRET || "local-test";

async function triggerListTopics() {
  console.log("Listing all topics by category...\n");

  try {
    const response = await fetch(`${BASE_URL}/api/admin/list-topics`, {
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

    console.log("=== TOPICS BY CATEGORY ===\n");
    console.log(`Total topics: ${data.total_topics}\n`);

    Object.entries(data.by_category).forEach(([category, topics]: [string, any]) => {
      console.log(`${category}:`);
      (topics as any[]).forEach((topic: any) => {
        console.log(`  ${topic.title} (${topic.slug}) - ${topic.article_count} articles`);
      });
      console.log();
    });
  } catch (error: any) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

triggerListTopics();
