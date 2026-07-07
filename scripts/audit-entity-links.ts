/**
 * Audit entity links in generated articles
 */

import { createAdminClient } from "../lib/supabase/admin";

const supabase = createAdminClient();

async function auditEntityLinks() {
  console.log("=" + "=".repeat(79));
  console.log("ENTITY LINK AUDIT");
  console.log("=".repeat(80));
  console.log();

  const topicId = "6e0c7adb-be18-4dbc-9c46-86b0e59cf89e";

  // Get the topic content
  const { data: topic, error: topicError } = await supabase
    .from("topics")
    .select("content, html_content")
    .eq("id", topicId)
    .single();

  if (topicError) {
    console.log("Error getting topic:", topicError.message);
    return;
  }

  console.log("STEP 1: EXTRACT ENTITY LINKS FROM CONTENT");
  console.log("-".repeat(80));

  // Extract entity links from content
  const entityLinkPattern = /\/entity\/([a-z0-9-]+)/g;
  const links: string[] = [];
  let match;
  const content = topic.content + topic.html_content;

  while ((match = entityLinkPattern.exec(content)) !== null) {
    links.push(match[1]);
  }

  const uniqueLinks = [...new Set(links)];
  console.log(`Found ${uniqueLinks.length} unique entity links:`);
  uniqueLinks.forEach(link => {
    console.log(`  - /entity/${link}`);
  });
  console.log();

  console.log("STEP 2: VERIFY SLUGS IN DATABASE");
  console.log("-".repeat(80));

  const brokenLinks: string[] = [];
  const validLinks: string[] = [];

  for (const slug of uniqueLinks) {
    // Check in knowledge_graph_nodes
    const { data: node } = await supabase
      .from("knowledge_graph_nodes")
      .select("*")
      .eq("slug", slug)
      .single();

    if (node) {
      console.log(`✓ /entity/${slug} - EXISTS in knowledge_graph_nodes`);
      validLinks.push(slug);
    } else {
      console.log(`✗ /entity/${slug} - NOT FOUND in knowledge_graph_nodes`);
      brokenLinks.push(slug);
    }
  }
  console.log();

  console.log("STEP 3: SUMMARY");
  console.log("-".repeat(80));
  console.log(`Total entity links checked: ${uniqueLinks.length}`);
  console.log(`Valid links: ${validLinks.length}`);
  console.log(`Broken links: ${brokenLinks.length}`);
  console.log();

  if (brokenLinks.length > 0) {
    console.log("Broken links:");
    brokenLinks.forEach(link => {
      console.log(`  - /entity/${link}`);
    });
  }
}

auditEntityLinks()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
