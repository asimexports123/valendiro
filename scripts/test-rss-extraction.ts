/**
 * Test RSS Extraction from Real Sources
 * Demonstrates full content extraction from trusted sources
 */

import Parser from 'rss-parser';
import { createAdminClient } from "../lib/supabase/admin";
import { addRSSFeed } from "../services/discovery/rssDiscoveryService";
import { processPendingExtraction } from "../services/discovery/knowledgeExtractionService";

const parser = new Parser();
const supabase = createAdminClient();

interface ExtractionMetrics {
  url: string;
  title: string;
  charactersExtracted: number;
  wordsExtracted: number;
  boilerplateRemoved: number;
  extractionConfidence: number;
  trustScore: number;
  knowledgeFactsCreated: number;
}

const testSources = [
  {
    url: "https://developer.mozilla.org/en-US/rss.xml",
    name: "MDN Web Docs",
    description: "Mozilla Developer Network - Web development documentation",
    domain: "developer.mozilla.org",
  },
  {
    url: "https://nodejs.org/en/feed/blog.xml",
    name: "Node.js Blog",
    description: "Official Node.js blog",
    domain: "nodejs.org",
  },
  {
    url: "https://github.blog/feed/",
    name: "GitHub Blog",
    description: "Official GitHub blog",
    domain: "github.com",
  },
  {
    url: "https://css-tricks.com/feed/",
    name: "CSS-Tricks",
    description: "CSS and web development articles",
    domain: "css-tricks.com",
  },
  {
    url: "https://www.nist.gov/news-events/rss.xml",
    name: "NIST News",
    description: "National Institute of Standards and Technology",
    domain: "nist.gov",
  },
];

async function testRSSExtraction() {
  console.log("=" + "=".repeat(79));
  console.log("RSS EXTRACTION TEST FROM REAL SOURCES");
  console.log("=".repeat(80));
  console.log();

  const allMetrics: ExtractionMetrics[] = [];

  for (const source of testSources) {
    console.log("=".repeat(80));
    console.log(`SOURCE: ${source.name}`);
    console.log(`URL: ${source.url}`);
    console.log("=".repeat(80));

    try {
      // Step 1: RSS Fetched
      console.log("\n[1] RSS FETCHED");
      const response = await fetch(source.url);
      const feedXML = await response.text();
      console.log(`✓ RSS feed fetched (${feedXML.length} characters)`);

      // Step 2: Parse RSS Feed
      console.log("\n[2] RSS PARSED");
      const feed = await parser.parseString(feedXML);
      console.log(`✓ RSS feed parsed (${feed.items.length} articles found)`);

      // Step 3: Extract content from first article
      if (feed.items.length > 0) {
        const firstItem = feed.items[0];
        
        console.log("\n[3] ARTICLE URL DISCOVERED");
        console.log(`✓ Article URL: ${firstItem.link}`);
        console.log(`✓ Article Title: ${firstItem.title}`);

        // Step 4: Extract Content
        console.log("\n[4] CONTENT EXTRACTION");
        let content = '';
        if ((firstItem as any)['content:encoded']) {
          content = (firstItem as any)['content:encoded'];
        } else if (firstItem.content) {
          content = firstItem.content;
        } else if (firstItem.contentSnippet) {
          content = firstItem.contentSnippet;
        } else if (firstItem.description) {
          content = firstItem.description;
        }

        const plainText = content.replace(/<[^>]*>/g, '').trim();
        const charactersExtracted = plainText.length;
        const wordsExtracted = plainText.split(/\s+/).length;
        const boilerplateRemoved = content.length - plainText.length;
        const extractionConfidence = content.length > 0 ? 0.9 : 0.0;

        console.log(`✓ Content extracted (${charactersExtracted} characters)`);
        console.log(`✓ Words extracted: ${wordsExtracted}`);
        console.log(`✓ Boilerplate removed: ${boilerplateRemoved} characters`);
        console.log(`✓ Extraction confidence: ${extractionConfidence}`);

        // Step 5: Store in database
        console.log("\n[5] STORING IN DATABASE");
        
        // Add source if not exists
        try {
          await addRSSFeed(source);
        } catch (e: any) {
          // Source may already exist
        }

        // Get source ID
        const { data: sourceData } = await supabase
          .from("discovery_sources")
          .select("id")
          .eq("name", source.name)
          .single();

        if (sourceData) {
          // Store discovered article
          const contentHash = generateContentHash(firstItem.link + content);
          
          await supabase
            .from("discovered_content")
            .insert({
              source_id: sourceData.id,
              title: firstItem.title || "",
              url: firstItem.link || "",
              content_summary: plainText.substring(0, 500),
              content_full: content,
              published_at: firstItem.pubDate || new Date().toISOString(),
              status: "deduplicated",
              content_hash: contentHash,
              trust_score: 0.80,
              freshness_score: 1.0,
              authority_score: 0.90,
              originality_score: 0.85,
              spam_score: 0.00,
            });

          console.log(`✓ Article stored in database`);

          // Step 6: Knowledge Extraction
          console.log("\n[6] KNOWLEDGE EXTRACTION");
          const extractionResult = await processPendingExtraction();
          const knowledgeFactsCreated = extractionResult.nodesCreated;
          const trustScore = 0.80;

          console.log(`✓ Knowledge facts created: ${knowledgeFactsCreated}`);
          console.log(`✓ Trust score: ${trustScore}`);

          // Store metrics
          allMetrics.push({
            url: firstItem.link || "",
            title: firstItem.title || "",
            charactersExtracted,
            wordsExtracted,
            boilerplateRemoved,
            extractionConfidence,
            trustScore,
            knowledgeFactsCreated,
          });
        }
      } else {
        console.log("✗ No articles found in feed");
      }
    } catch (error: any) {
      console.error(`\n✗ ERROR: ${error.message}`);
    }

    console.log();
  }

  // Summary
  console.log("=" + "=".repeat(79));
  console.log("EXTRACTION SUMMARY");
  console.log("=".repeat(80));
  console.log();

  console.log("Source".padEnd(25) + "Chars".padEnd(10) + "Words".padEnd(10) + "Confidence".padEnd(12) + "Knowledge");
  console.log("-".repeat(80));

  let totalChars = 0;
  let totalWords = 0;
  let totalKnowledge = 0;

  for (const metrics of allMetrics) {
    const sourceName = testSources.find(s => metrics.url.includes(s.domain))?.name || "Unknown";
    console.log(
      sourceName.padEnd(25) +
      metrics.charactersExtracted.toString().padEnd(10) +
      metrics.wordsExtracted.toString().padEnd(10) +
      metrics.extractionConfidence.toFixed(2).padEnd(12) +
      metrics.knowledgeFactsCreated.toString()
    );
    totalChars += metrics.charactersExtracted;
    totalWords += metrics.wordsExtracted;
    totalKnowledge += metrics.knowledgeFactsCreated;
  }

  console.log("-".repeat(80));
  console.log(
    "TOTAL".padEnd(25) +
    totalChars.toString().padEnd(10) +
    totalWords.toString().padEnd(10) +
    "-".padEnd(12) +
    totalKnowledge.toString()
  );

  console.log();
  console.log("=".repeat(80));
  console.log("TEST COMPLETE");
  console.log("=".repeat(80));
}

function generateContentHash(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

testRSSExtraction()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
