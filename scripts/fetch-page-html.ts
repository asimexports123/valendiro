/**
 * Fetch full HTML of a page to verify component rendering
 */

const url = process.argv[2];
if (!url) {
  console.error("Usage: npx tsx scripts/fetch-page-html.ts <url>");
  process.exit(1);
}

fetch(url)
  .then(res => res.text())
  .then(html => {
    // Check for component markers
    const hasKnowledgeGraph = html.includes("Learning Path") || html.includes("🗺️");
    const hasPrerequisites = html.includes("Prerequisites") || html.includes("📖");
    const hasContinueLearning = html.includes("Continue Learning") || html.includes("📚");
    const hasApplications = html.includes("Applications") || html.includes("🔧");
    const hasRelatedGuides = html.includes("Related Guides") || html.includes("📝");
    const hasPreviousNext = html.includes("← Previous") || html.includes("Next →");
    const hasSources = html.includes('<h2 id="sources"') || html.includes('<h2 id="Sources"');
    
    console.log(`\n=== Page: ${url} ===`);
    console.log(`Knowledge Graph: ${hasKnowledgeGraph ? "✓" : "✗"}`);
    console.log(`Prerequisites: ${hasPrerequisites ? "✓" : "✗"}`);
    console.log(`Continue Learning: ${hasContinueLearning ? "✓" : "✗"}`);
    console.log(`Applications: ${hasApplications ? "✓" : "✗"}`);
    console.log(`Related Guides: ${hasRelatedGuides ? "✓" : "✗"}`);
    console.log(`Previous/Next: ${hasPreviousNext ? "✓" : "✗"}`);
    console.log(`Sources section: ${hasSources ? "✗ (STILL VISIBLE)" : "✓ (HIDDEN)"}`);
    
    // Show snippet around Knowledge Graph if found
    if (hasKnowledgeGraph) {
      const kgIndex = html.indexOf("Learning Path");
      if (kgIndex !== -1) {
        console.log("\nKnowledge Graph snippet:");
        console.log(html.substring(Math.max(0, kgIndex - 50), Math.min(html.length, kgIndex + 200)));
      }
    }
  })
  .catch(err => {
    console.error("Error:", err);
  });
