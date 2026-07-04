import "dotenv/config";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://valendiro.com";
const SECRET = process.env.RENDER_SECRET || process.env.PIPELINE_TEST_SECRET || "local-test";

async function getKnowledgePackage(topicId: string) {
  console.log(`Getting knowledge package for topic ID: ${topicId}\n`);

  try {
    const response = await fetch(`${BASE_URL}/api/admin/list-all-topics`, {
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

    const topic = data.all_topics.find((t: any) => t.id === topicId);
    if (topic) {
      console.log(JSON.stringify(topic, null, 2));
    } else {
      console.error("Topic not found");
      process.exit(1);
    }
  } catch (error: any) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

getKnowledgePackage("55c9e8eb-9d8b-48e5-a037-1aa729789e02");
