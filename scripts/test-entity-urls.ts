/**
 * Test entity URLs to verify they work
 */

import { createAdminClient } from "../lib/supabase/admin";

const supabase = createAdminClient();

async function testEntityURLs() {
  console.log("=" + "=".repeat(79));
  console.log("TEST ENTITY URLS");
  console.log("=".repeat(80));
  console.log();

  const baseUrl = "https://valendiro.com";
  const slugs = [
    "github",
    "hugging-face",
    "mozilla-corporation",
    "black-forest-labs",
    "ai-act",
    "sb-942",
    "sb-1000",
  ];

  console.log("STEP 1: TEST ENTITY URLS VIA HTTP");
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

  console.log("STEP 2: VERIFY DATABASE ENTITIES");
  console.log("-".repeat(80));

  for (const slug of slugs) {
    const { data: entity, error } = await supabase
      .from("knowledge_graph_nodes")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error) {
      console.log(`✗ /entity/${slug} - DATABASE ERROR: ${error.message}`);
    } else if (entity) {
      console.log(`✓ /entity/${slug} - DATABASE OK: ${entity.name}`);
    } else {
      console.log(`✗ /entity/${slug} - DATABASE NOT FOUND`);
    }
  }
}

testEntityURLs()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
