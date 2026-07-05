/**
 * Check what the live page is actually rendering
 */

const URL = "https://valendiro.com/en/topics/python-programming-fundamentals";

async function checkLiveRendering() {
  const response = await fetch(URL);
  const text = await response.text();
  
  console.log("Checking live page rendering...\n");
  
  // Check if article content exists
  const hasArticle = text.includes('<article');
  const hasMarkdown = text.includes('MarkdownContent');
  const hasPython = text.includes('Python');
  const hasFunctions = text.includes('Functions');
  
  console.log(`Has article tag: ${hasArticle}`);
  console.log(`Has MarkdownContent: ${hasMarkdown}`);
  console.log(`Contains 'Python': ${hasPython}`);
  console.log(`Contains 'Functions': ${hasFunctions}`);
  
  // Look for the actual content section
  const contentMatch = text.match(/<div[^>]*class="[^"]*prose[^"]*"[^>]*>([\s\S]*?)<\/div>/);
  if (contentMatch) {
    console.log(`\nFound prose section: ${contentMatch[1].substring(0, 200)}...`);
  } else {
    console.log("\nNo prose section found");
  }
  
  // Check if content is empty
  const emptyContentMatch = text.match(/<div[^>]*class="[^"]*prose[^"]*"[^>]*>\s*<\/div>/);
  if (emptyContentMatch) {
    console.log("\nFound empty prose section - content is not being rendered!");
  }
}

checkLiveRendering()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
