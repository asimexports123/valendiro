/**
 * Check HTTP response headers from production URL
 */

const URL = "https://valendiro.com/en/topics/python-programming-fundamentals";

async function checkHeaders() {
  const response = await fetch(URL);
  
  console.log("Status:", response.status);
  console.log("\nResponse Headers:");
  response.headers.forEach((value, key) => {
    console.log(`${key}: ${value}`);
  });
  
  const text = await response.text();
  console.log("\nContent preview (first 500 chars):");
  console.log(text.substring(0, 500));
}

checkHeaders()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
