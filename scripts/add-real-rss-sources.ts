/**
 * Add Real RSS Feed Sources
 */

import { createAdminClient } from "../lib/supabase/admin";
import { addRSSFeed } from "../services/discovery/rssDiscoveryService";

const supabase = createAdminClient();

async function addRealSources() {
  console.log("Adding real RSS feed sources...");

  const realSources = [
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
  ];

  for (const source of realSources) {
    try {
      const sourceId = await addRSSFeed(source);
      console.log(`✓ Added: ${source.name} (${sourceId})`);
    } catch (error: any) {
      console.error(`✗ Failed to add ${source.name}:`, error.message);
    }
  }

  console.log("\nDone");
}

addRealSources()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
