import "dotenv/config";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const SECRET = process.env.RENDER_SECRET || process.env.PIPELINE_TEST_SECRET || "local-test";

const TOPICS = [
  "python-programming-fundamentals",
  "investing-basics",
  "nutrition-fundamentals",
  "travel-planning-fundamentals",
  "marketing-fundamentals",
];

async function testAuthoringEngine() {
  console.log("=== Testing Knowledge Authoring Engine API ===\n");

  for (const topicSlug of TOPICS) {
    console.log(`\n--- ${topicSlug} ---`);

    try {
      const response = await fetch(`${BASE_URL}/api/admin/authoring-engine`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          secret: SECRET,
          topic_slug: topicSlug,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.log(`ERROR: ${data.error}`);
        if (data.enabled === false) {
          console.log("  (Feature flag disabled for this topic)");
        }
        continue;
      }

      console.log(`✓ Success`);
      console.log(`  Output ID: ${data.outputId}`);
      console.log(`  Quality Score: ${data.qualityScore}/100`);
      console.log(`  Passes All Checks: ${data.passesAllChecks}`);
      console.log(`  Recommendation: ${data.recommendation}`);
      console.log(`  Sections: ${data.sections}`);
      console.log(`  Reader Questions: ${data.readerQuestions}`);
      console.log(`  Gaps Filled: ${data.gapsFilled}`);

    } catch (error) {
      console.log(`ERROR: ${error}`);
    }
  }

  console.log("\n=== Test Complete ===");
}

testAuthoringEngine().catch(console.error);
