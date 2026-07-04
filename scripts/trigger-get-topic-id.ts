import "dotenv/config";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://valendiro.com";
const SECRET = process.env.RENDER_SECRET || process.env.PIPELINE_TEST_SECRET || "local-test";

async function getTopicId(slug: string) {
  console.log(`Getting topic ID for: ${slug}\n`);

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

    const topic = data.all_topics.find((t: any) => t.slug === slug);
    if (topic) {
      console.log(`Topic ID: ${topic.id}`);
      console.log(`Title: ${topic.topic_translations?.[0]?.title}`);
      console.log(`Status: ${topic.status}`);
      console.log(`Difficulty: ${topic.difficulty}`);
      return topic.id;
    } else {
      console.error("Topic not found");
      process.exit(1);
    }
  } catch (error: any) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

getTopicId("nutrition-fundamentals");
