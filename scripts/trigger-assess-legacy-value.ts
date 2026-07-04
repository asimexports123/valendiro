import "dotenv/config";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://valendiro.com";
const SECRET = process.env.RENDER_SECRET || process.env.PIPELINE_TEST_SECRET || "local-test";

async function triggerAssessLegacyValue() {
  console.log("Assessing production value of legacy articles...\n");

  try {
    const response = await fetch(`${BASE_URL}/api/admin/assess-legacy-value`, {
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

    console.log("=== LEGACY ARTICLE ASSESSMENT ===\n");
    data.assessment.forEach((a: any) => {
      console.log(`${a.slug}:`);
      console.log(`  Title: ${a.title}`);
      console.log(`  Status: ${a.status}`);
      console.log(`  Word Count: ${a.word_count}`);
      console.log(`  Character Count: ${a.char_count}`);
      console.log(`  Created: ${a.created_at}`);
      console.log(`  Sample Content: ${a.sample_content}`);
      console.log();
    });
  } catch (error: any) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

triggerAssessLegacyValue();
