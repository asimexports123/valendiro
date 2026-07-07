/**
 * Test entity URLs locally
 */

const slugs = [
  "github",
  "hugging-face",
  "mozilla-corporation",
  "black-forest-labs",
  "ai-act",
  "sb-942",
  "sb-1000",
];

async function testLocalURLs() {
  console.log("=" + "=".repeat(79));
  console.log("TEST LOCAL ENTITY URLS");
  console.log("=".repeat(80));
  console.log();

  const baseUrl = "http://localhost:3000";

  console.log("STEP 1: TEST ENTITY URLS LOCALLY");
  console.log("-".repeat(80));

  for (const slug of slugs) {
    const url = `${baseUrl}/entity/${slug}`;
    console.log(`Testing: ${url}`);
    
    try {
      const response = await fetch(url);
      const status = response.status;
      const statusText = response.statusText;
      
      console.log(`  Status: ${status} ${statusText}`);
      
      if (status === 200) {
        console.log(`  ✓ SUCCESS`);
      } else {
        console.log(`  ✗ FAILED`);
      }
    } catch (error) {
      console.log(`  ✗ ERROR: ${error}`);
    }
    console.log();
  }
}

testLocalURLs()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
