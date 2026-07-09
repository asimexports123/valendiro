/**
 * Test Production Entity URL
 * 
 * Make actual HTTP request to production URL to see real error
 */

async function testProductionURL() {
  console.log("=" + "=".repeat(79));
  console.log("TEST PRODUCTION ENTITY URL");
  console.log("=".repeat(80));
  console.log();

  const url = "https://valendiro.com/en/entity/github";

  console.log("Testing URL:", url);
  console.log();

  try {
    const response = await fetch(url);
    console.log("Status:", response.status);
    console.log("Status Text:", response.statusText);
    console.log();
    
    const text = await response.text();
    console.log("Response (first 500 chars):");
    console.log(text.substring(0, 500));
    console.log();
    
    if (response.status === 404) {
      console.log("✗ CONFIRMED: Production URL returns 404");
      console.log("This is the actual browser error");
    } else {
      console.log("✓ Production URL works");
    }
  } catch (error) {
    console.log("Error fetching URL:", (error as Error).message);
  }
}

testProductionURL();
