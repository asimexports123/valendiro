import "dotenv/config";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://valendiro.com";
const SECRET = process.env.RENDER_SECRET || process.env.PIPELINE_TEST_SECRET || "local-test";

async function triggerPilotRerender() {
  console.log("Triggering pilot rerender...");

  try {
    const response = await fetch(`${BASE_URL}/api/admin/renderer-rerender`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mode: "pilot",
        secret: SECRET,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Failed:", data.error);
      process.exit(1);
    }

    console.log("Pilot rerender completed successfully!");
    console.log(`Total articles: ${data.totalArticles}`);
    console.log(`Successful: ${data.successful}`);
    console.log(`Failed: ${data.failed}`);

    if (data.diagnostics && data.diagnostics.length > 0) {
      console.log("\nDiagnostics:");
      data.diagnostics.forEach((d: string) => console.log(`  - ${d}`));
    }

    if (data.successful > 0) {
      console.log("\nSuccessfully re-rendered:");
      data.results.forEach((r: any) => {
        console.log(`  - ${r.slug} (Quality: ${r.qualityScore})`);
      });
    }

    if (data.failed > 0) {
      console.log("\nFailed:");
      data.errors.forEach((e: any) => {
        console.log(`  - ${e.slug}: ${e.error}`);
        console.log(`    Full error: ${JSON.stringify(e)}`);
      });
    }
  } catch (error: any) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

triggerPilotRerender();
