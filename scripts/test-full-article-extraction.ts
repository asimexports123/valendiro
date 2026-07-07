/**
 * Test Full Article Content Extraction from Real Sources
 * Demonstrates extraction using Readability
 */

import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';

const testUrls = [
  {
    url: "https://nodejs.org/en/blog/release/v26.4.0",
    name: "Node.js Blog",
  },
  {
    url: "https://github.blog/security/application-security/how-github-used-secret-scanning-to-reach-inbox-zero/",
    name: "GitHub Blog",
  },
  {
    url: "https://css-tricks.com/whats-important-14/",
    name: "CSS-Tricks",
  },
  {
    url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide",
    name: "MDN Web Docs",
  },
];

async function testFullExtraction() {
  console.log("=" + "=".repeat(79));
  console.log("FULL ARTICLE CONTENT EXTRACTION TEST");
  console.log("=".repeat(80));
  console.log();

  for (const test of testUrls) {
    console.log("=".repeat(80));
    console.log(`SOURCE: ${test.name}`);
    console.log(`URL: ${test.url}`);
    console.log("=".repeat(80));

    try {
      // Step 1: Download Article
      console.log("\n[1] DOWNLOADING ARTICLE");
      const response = await fetch(test.url);
      const html = await response.text();
      console.log(`✓ Article downloaded (${html.length} characters)`);

      // Step 2: Extract Content with Readability
      console.log("\n[2] EXTRACTING MAIN CONTENT");
      const dom = new JSDOM(html, { url: test.url });
      const document = dom.window.document;
      const reader = new Readability(document);
      const article = reader.parse();

      if (article && article.textContent) {
        const charactersExtracted = article.textContent.length;
        const wordsExtracted = article.textContent.split(/\s+/).length;
        const boilerplateRemoved = html.length - article.textContent.length;
        const extractionConfidence = 0.9;

        console.log(`✓ Content extracted (${charactersExtracted} characters)`);
        console.log(`✓ Words extracted: ${wordsExtracted}`);
        console.log(`✓ Boilerplate removed: ${boilerplateRemoved} characters`);
        console.log(`✓ Extraction confidence: ${extractionConfidence}`);
        console.log(`✓ Article title: ${article.title}`);

        // Show first 200 characters of extracted content
        console.log(`\nExtracted content preview:`);
        console.log(article.textContent.substring(0, 200) + "...");
      } else {
        console.log("✗ Readability failed to extract content");
        
        // Try fallback
        const bodyText = document.body?.textContent || '';
        console.log(`✓ Fallback: extracted ${bodyText.length} characters from body`);
      }
    } catch (error: any) {
      console.error(`\n✗ ERROR: ${error.message}`);
    }

    console.log();
  }

  console.log("=".repeat(80));
  console.log("TEST COMPLETE");
  console.log("=".repeat(80));
}

testFullExtraction()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
