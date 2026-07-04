import "dotenv/config";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://valendiro.com";
const SECRET = process.env.RENDER_SECRET || process.env.PIPELINE_TEST_SECRET || "local-test";

async function getFullKnowledgePackage(topicId: string) {
  console.log(`Getting full knowledge package for topic ID: ${topicId}\n`);

  try {
    const response = await fetch(`${BASE_URL}/api/admin/get-knowledge-package`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        secret: SECRET,
        topic_id: topicId,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Failed:", data.error);
      process.exit(1);
    }

    console.log("=== TOPIC ===\n");
    console.log(JSON.stringify(data.topic, null, 2));

    console.log("\n=== KNOWLEDGE PACKAGE ===\n");
    console.log(JSON.stringify(data.knowledge_package, null, 2));

    console.log("\n=== FACTS ===\n");
    console.log(`Total facts: ${data.facts.length}`);
    data.facts.slice(0, 5).forEach((fact: any) => {
      console.log(JSON.stringify(fact, null, 2));
    });

    console.log("\n=== RELATIONSHIPS ===\n");
    console.log(`Total relationships: ${data.relationships.length}`);
    data.relationships.slice(0, 5).forEach((rel: any) => {
      console.log(JSON.stringify(rel, null, 2));
    });
  } catch (error: any) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

getFullKnowledgePackage("2f756b44-d210-4186-b60e-ed8387aea23c");
